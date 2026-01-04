/**
 * MCP API 封装
 */
import { http } from './http';
import type {
  MCP,
  MCPDetail,
  CreateMCPParams,
  UpdateMCPParams,
  DeleteMCPResult,
  ReconnectMCPResult,
  ValidateForgePublishResult,
  MCPFilterType,
  ToolPathConfig,
} from '@/types';

/**
 * 创建 MCP
 * 管理员可创建所有类型，普通用户只能创建 SSE 和 StreamableHTTP 类型
 * @param params MCP 配置参数
 */
export async function createMCP(params: CreateMCPParams): Promise<MCP> {
  const res = await http.post<MCP>('/mcp', params);
  return res.data;
}

/**
 * 获取 MCP 列表
 * @param keyword 搜索关键词（可选）
 * @param filter 筛选类型：all/builtin/mine/other（可选）
 */
export async function getMCPList(keyword?: string, filter?: MCPFilterType): Promise<MCP[]> {
  const params: Record<string, string> = {};
  if (keyword) params.keyword = keyword;
  if (filter) params.filter = filter;
  const res = await http.get<MCP[]>(
    '/mcp/list',
    Object.keys(params).length > 0 ? params : undefined
  );
  return res.data;
}

/**
 * 获取 MCP 详情
 * @param id MCP ID
 */
export async function getMCP(id: number): Promise<MCP> {
  const res = await http.get<MCP>(`/mcp/${id}`);
  return res.data;
}

/**
 * 获取 MCP 详情（含关联 Forge、工具列表）
 * @param id MCP ID
 */
export async function getMCPDetail(id: number): Promise<MCPDetail> {
  const res = await http.get<MCPDetail>(`/mcp/${id}/detail`);
  return res.data;
}

/**
 * 更新 MCP（仅管理员）
 * @param id MCP ID
 * @param params 更新参数
 */
export async function updateMCP(id: number, params: UpdateMCPParams): Promise<MCP> {
  const res = await http.put<MCP>(`/mcp/${id}`, params);
  return res.data;
}

/**
 * 关闭 MCP（仅管理员）
 * @param id MCP ID
 */
export async function closeMCP(id: number): Promise<{ success: boolean }> {
  const res = await http.post<{ success: boolean }>(`/mcp/${id}/close`);
  return res.data;
}

/**
 * 重连 MCP（所有用户可用）
 * @param id MCP ID
 */
export async function reconnectMCP(id: number): Promise<ReconnectMCPResult> {
  const res = await http.post<ReconnectMCPResult>(`/mcp/${id}/reconnect`);
  return res.data;
}

/**
 * 删除 MCP（仅管理员）
 * @param id MCP ID
 */
export async function deleteMCP(id: number): Promise<DeleteMCPResult> {
  const res = await http.delete<DeleteMCPResult>(`/mcp/${id}`);
  return res.data;
}

/**
 * 验证 Forge 公开时的 MCP 合规性
 * @param forgeId Forge ID
 */
export async function validateForgePublish(forgeId: number): Promise<ValidateForgePublishResult> {
  const res = await http.post<ValidateForgePublishResult>('/mcp/validate-forge-publish', {
    forgeId,
  });
  return res.data;
}

/**
 * 更新 MCP 工具路径配置（仅管理员）
 * @param id MCP ID
 * @param toolPathConfig 工具路径配置
 */
export async function updateToolPathConfig(
  id: number,
  toolPathConfig: ToolPathConfig | null
): Promise<{ success: boolean }> {
  const res = await http.put<{ success: boolean }>(`/mcp/${id}/tool-path-config`, {
    toolPathConfig,
  });
  return res.data;
}

/**
 * 申请公开 MCP（普通用户）
 * @param id MCP ID
 */
export async function requestPublicMCP(id: number): Promise<{ success: boolean }> {
  const res = await http.post<{ success: boolean }>(`/mcp/${id}/request-public`);
  return res.data;
}
