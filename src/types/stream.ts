/**
 * 流式消息类型定义
 */

// 消息类型枚举
export type ChunkType =
  | 'chatStream' // AI 回复流式输出
  | 'thinking' // AI 思考过程
  | 'toolCall' // 工具调用开始
  | 'toolResult' // 工具调用结果
  | 'status' // 状态变更
  | 'heartbeat' // 心跳
  | 'error' // 错误
  | 'done'; // 结束

// 流式事件类型
export type StreamEvent = 'start' | 'data' | 'end';

// 任务状态
export type TaskStatus = 'running' | 'success' | 'failed';

// 流式文本数据（chatStream / thinking）
export interface StreamTextData {
  event: StreamEvent;
  content?: string;
}

// 工具调用数据
export interface ToolCallData {
  toolId: string;
  toolName: string;
  args: Record<string, unknown>;
}

// 工具结果数据
export interface ToolResultData {
  toolId: string;
  result: unknown;
  success: boolean;
  error?: string;
}

// 状态变更数据
export interface StatusData {
  status: TaskStatus;
  message?: string;
}

// 错误数据
export interface ErrorData {
  message: string;
  code?: string;
}

// 统一的流式消息结构
export interface StreamChunk {
  type: ChunkType;
  data?: StreamTextData | ToolCallData | ToolResultData | StatusData | ErrorData;
}

// 类型守卫函数
export function isChatStream(chunk: StreamChunk): chunk is StreamChunk & { data: StreamTextData } {
  return chunk.type === 'chatStream';
}

export function isThinking(chunk: StreamChunk): chunk is StreamChunk & { data: StreamTextData } {
  return chunk.type === 'thinking';
}

export function isToolCall(chunk: StreamChunk): chunk is StreamChunk & { data: ToolCallData } {
  return chunk.type === 'toolCall';
}

export function isToolResult(chunk: StreamChunk): chunk is StreamChunk & { data: ToolResultData } {
  return chunk.type === 'toolResult';
}

export function isStatus(chunk: StreamChunk): chunk is StreamChunk & { data: StatusData } {
  return chunk.type === 'status';
}

export function isError(chunk: StreamChunk): chunk is StreamChunk & { data: ErrorData } {
  return chunk.type === 'error';
}
