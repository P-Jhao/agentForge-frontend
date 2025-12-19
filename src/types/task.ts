/**
 * 任务相关类型定义
 */

// 任务状态枚举
export type TaskStatus = 'running' | 'completed' | 'cancelled';

// 消息类型枚举（LLM 输出的不同阶段）
export type MessageType = 'thinking' | 'chat' | 'tool' | 'error' | 'tool_call';

// 基础消息段落（thinking/chat/tool/error）
export interface BaseMessageSegment {
  type: 'thinking' | 'chat' | 'tool' | 'error';
  content: string;
}

// 工具调用段落
export interface ToolCallSegment {
  type: 'tool_call';
  callId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
  success: boolean;
}

// 消息段落（assistant 消息的数组元素）
export type MessageSegment = BaseMessageSegment | ToolCallSegment;

// 工具调用开始数据（SSE 推送）
export interface ToolCallStartData {
  callId: string;
  toolName: string;
}

// 工具调用结果数据（SSE 推送）
export interface ToolCallResultData {
  callId: string;
  toolName: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

// 消息角色
export type MessageRole = 'user' | 'assistant' | 'system';

// 消息类型
export interface Message {
  id: number;
  role: MessageRole;
  content: string | MessageSegment[]; // user: 字符串; assistant: 段落数组
  createdAt: string;
}

// 任务类型
export interface Task {
  id: number;
  uuid: string;
  userId: number;
  agentId: number | null;
  title: string;
  favorite: boolean;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

// 分组任务类型（侧边栏使用）
export interface GroupedTasks {
  today: Task[];
  yesterday: Task[];
  earlier: Task[];
}

// 创建任务参数
export interface CreateTaskParams {
  id: string; // 前端生成的 UUID
  agentId?: number;
  title?: string;
  firstMessage?: string;
}

// 更新任务参数
export interface UpdateTaskParams {
  title?: string;
  favorite?: boolean;
}

// 获取任务列表参数
export interface GetTasksParams {
  keyword?: string;
  favorite?: boolean;
}

// SSE 消息类型
export type TaskSSEChunkType =
  | 'history'
  | 'thinking'
  | 'chat'
  | 'tool'
  | 'tool_call_start'
  | 'tool_call_result'
  | 'error'
  | 'done';

// SSE 消息结构
export interface TaskSSEChunk {
  type: TaskSSEChunkType;
  data?: Message[] | string | { message: string } | ToolCallStartData | ToolCallResultData;
}

// 类型守卫函数
export function isHistoryChunk(chunk: TaskSSEChunk): chunk is TaskSSEChunk & { data: Message[] } {
  return chunk.type === 'history';
}

export function isContentChunk(chunk: TaskSSEChunk): chunk is TaskSSEChunk & { data: string } {
  return ['thinking', 'chat', 'tool'].includes(chunk.type);
}

export function isErrorChunk(
  chunk: TaskSSEChunk
): chunk is TaskSSEChunk & { data: { message: string } } {
  return chunk.type === 'error';
}

export function isDoneChunk(chunk: TaskSSEChunk): boolean {
  return chunk.type === 'done';
}
