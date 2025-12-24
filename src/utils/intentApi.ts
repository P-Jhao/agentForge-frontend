/**
 * 意图分析 API 封装
 * 处理智能路由相关的 API 请求
 */
import { http } from './http';
import type {
  AnalyzeForgeRequest,
  AnalyzeMCPRequest,
  CancelIntentRequest,
  CancelIntentResponse,
  ForgeIntentResult,
  ForgeNoMatchResult,
  MCPIntentResult,
  MCPNotSupportedResult,
  ForgeSummary,
} from '@/types';

// API 基础路径
const API_BASE = import.meta.env.VITE_API_BASE || '';

/**
 * 分析 Forge 意图
 * @param params 请求参数
 * @returns Forge 意图分析结果
 */
export async function analyzeForgeIntent(
  params: AnalyzeForgeRequest
): Promise<ForgeIntentResult | ForgeNoMatchResult> {
  const res = await http.post<ForgeIntentResult | ForgeNoMatchResult>(
    '/intent/analyze-forge',
    params
  );
  return res.data;
}

/**
 * 分析 MCP 意图
 * @param params 请求参数
 * @returns MCP 意图分析结果
 */
export async function analyzeMCPIntent(
  params: AnalyzeMCPRequest
): Promise<MCPIntentResult | MCPNotSupportedResult> {
  const res = await http.post<MCPIntentResult | MCPNotSupportedResult>(
    '/intent/analyze-mcp',
    params
  );
  return res.data;
}

/**
 * 取消意图分析操作
 * @param params 请求参数
 * @returns 取消结果
 */
export async function cancelIntent(params: CancelIntentRequest): Promise<CancelIntentResponse> {
  const res = await http.post<CancelIntentResponse>('/intent/cancel', params);
  return res.data;
}

/**
 * 订阅意图事件
 * @param sessionId 会话 ID
 */
export async function subscribeIntent(sessionId: string): Promise<void> {
  await http.post('/intent/subscribe', { sessionId });
}

/**
 * 取消订阅意图事件
 * @param sessionId 会话 ID
 */
export async function unsubscribeIntent(sessionId: string): Promise<void> {
  await http.post('/intent/unsubscribe', { sessionId });
}

/**
 * 获取所有 Forge 摘要列表（用于意图分析）
 * @returns Forge 摘要列表
 */
export async function getForgeSummaries(): Promise<ForgeSummary[]> {
  const res = await http.get<ForgeSummary[]>('/forge/summaries');
  return res.data;
}

/**
 * 生成 Forge 配置（SSE 流式响应）
 * @param userIntent 用户意图
 * @param mcpIds MCP ID 列表
 * @param sessionId 会话 ID
 * @param onEvent 事件回调
 * @returns AbortController 用于取消请求
 */
export function generateForgeConfig(
  userIntent: string,
  mcpIds: number[],
  sessionId: string,
  onEvent: (event: { type: string; field?: string; content?: string; message?: string }) => void
): AbortController {
  const controller = new AbortController();
  const token = localStorage.getItem('forgeToken') || '';

  const url = `${API_BASE}/forge/generate-config`;

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userIntent, mcpIds, sessionId }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // 按行分割处理 SSE 格式
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6);
            // 解析并触发事件
            if (currentData) {
              try {
                const data = JSON.parse(currentData);
                onEvent({
                  type: currentEvent || data.type,
                  field: data.field,
                  content: data.content,
                  message: data.message,
                });
              } catch {
                console.warn('解析 SSE 数据失败:', currentData);
              }
            }
            currentEvent = '';
            currentData = '';
          }
        }
      }
    })
    .catch((error) => {
      // 忽略用户主动取消的请求
      if (error.name === 'AbortError') {
        return;
      }
      onEvent({ type: 'error', message: error.message });
    });

  return controller;
}

/**
 * 生成 Forge 摘要
 * @param forgeId Forge ID
 * @returns 生成的摘要
 */
export async function generateForgeSummary(forgeId: number): Promise<string> {
  const res = await http.post<{ summary: string }>('/forge/generate-summary', {
    forgeId,
  });
  return res.data.summary;
}
