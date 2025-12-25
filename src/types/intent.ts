/**
 * 智能意图路由相关类型定义
 */

// ========== 意图分析结果类型 ==========

// Forge 意图分析结果
export interface ForgeIntentResult {
  type: 'use_existing_forge';
  forgeId: number;
  forgeName: string;
  originalQuery: string;
}

// Forge 无匹配结果
export interface ForgeNoMatchResult {
  type: 'no_match';
  originalQuery: string;
}

// MCP 工具选择（精确到工具级别）
export interface MCPToolSelectionResult {
  mcpId: number;
  toolNames: string[];
}

// MCP 意图分析结果
export interface MCPIntentResult {
  type: 'create_forge';
  mcpTools: MCPToolSelectionResult[];
  originalQuery: string;
}

// MCP 不支持结果
export interface MCPNotSupportedResult {
  type: 'not_supported';
  originalQuery: string;
}

// MCP 不需要工具结果（LLM 可直接回答）
export interface MCPNoToolNeededResult {
  type: 'no_tool_needed';
  originalQuery: string;
}

// 统一意图分析结果类型
export type IntentResult =
  | ForgeIntentResult
  | ForgeNoMatchResult
  | MCPIntentResult
  | MCPNotSupportedResult
  | MCPNoToolNeededResult;

// ========== 配置生成类型 ==========

// 生成的 Forge 配置
export interface GeneratedForgeConfig {
  name: string;
  description: string;
  systemPrompt: string;
  mcpTools: MCPToolSelectionResult[];
}

// 配置生成字段状态
export type ConfigFieldStatus = 'pending' | 'streaming' | 'done';

// 配置生成字段
export interface ConfigField {
  status: ConfigFieldStatus;
  content: string;
}

// 配置生成状态
export interface ConfigGeneratingState {
  name: ConfigField;
  description: ConfigField;
  systemPrompt: ConfigField;
}

// ========== 操作阶段类型 ==========

// 操作阶段
export type OperationStage =
  | 'idle' // 空闲
  | 'analyzing' // 分析中
  | 'navigating' // 导航中
  | 'creating' // 创建中
  | 'typing' // 输入中
  | 'sending'; // 发送中

// 阶段文本映射
export const STAGE_TEXT_MAP: Record<OperationStage, string> = {
  idle: '',
  analyzing: '正在分析您的需求...',
  navigating: '正在为您定位...',
  creating: '正在创建 Forge...',
  typing: '正在输入...',
  sending: '正在发送...',
};

// ========== SSE 事件类型 ==========

// 配置字段名
export type ConfigFieldName = 'name' | 'description' | 'systemPrompt';

// 意图事件处理器（用于配置生成回调）
export interface IntentEventHandlers {
  onConfigStart?: (field: ConfigFieldName) => void;
  onConfigChunk?: (field: ConfigFieldName, content: string) => void;
  onConfigDone?: (field: ConfigFieldName, content: string) => void;
  onConfigComplete?: () => void;
  onCancelled?: () => void;
  onError?: (message: string) => void;
}

// ========== API 请求/响应类型 ==========

// Forge 意图分析请求
export interface AnalyzeForgeRequest {
  userInput: string;
  sessionId: string;
}

// MCP 意图分析请求
export interface AnalyzeMCPRequest {
  userInput: string;
  sessionId: string;
}

// 取消意图请求
export interface CancelIntentRequest {
  sessionId: string;
}

// 取消意图响应
export interface CancelIntentResponse {
  success: boolean;
  message: string;
}

// 配置生成请求
export interface GenerateConfigRequest {
  userIntent: string;
  mcpIds: number[];
  sessionId: string;
}

// Forge 摘要
export interface ForgeSummary {
  id: number;
  summary: string;
}
