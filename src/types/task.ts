/**
 * 任务相关类型定义
 */

// 任务状态枚举
export type TaskStatus = 'running' | 'completed' | 'cancelled' | 'waiting';

// 消息类型枚举（新格式，不再包含 tool）
export type MessageType =
  | 'chat'
  | 'thinking'
  | 'tool_call'
  | 'error'
  | 'summary'
  // 提示词增强相关类型
  | 'user_original' // 开启增强时的用户原始输入
  | 'user_answer' // 智能迭代中用户对澄清问题的回复
  | 'reviewer' // 审查者输出
  | 'questioner' // 提问者输出
  | 'expert' // 专家分析输出
  | 'enhancer'; // 增强后的提示词

// 基础消息段落（thinking/chat/error 及增强相关类型）
export interface BaseMessageSegment {
  type:
    | 'thinking'
    | 'chat'
    | 'error'
    | 'summary'
    // 提示词增强相关类型
    | 'user_original'
    | 'user_answer'
    | 'reviewer'
    | 'questioner'
    | 'expert'
    | 'enhancer';
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
  args?: Record<string, unknown>; // 工具 LLM 决定的参数
}

// 消息角色
export type MessageRole = 'user' | 'assistant' | 'system';

// 用户上传的文件信息
export interface UploadedFileInfo {
  filePath: string;
  originalName: string;
  size: number;
  url: string;
}

// 扁平消息类型（新格式，每条消息一个类型）
export interface FlatMessage {
  id: number;
  role: MessageRole;
  type: MessageType;
  content: string;
  // 工具调用专用字段
  callId?: string;
  toolName?: string;
  arguments?: Record<string, unknown>;
  result?: unknown;
  success?: boolean;
  // 用户上传的文件
  files?: UploadedFileInfo[];
  // 中断标记（消息是否因用户中断而不完整）
  aborted?: boolean;
  createdAt: string;
}

// 旧消息类型（兼容）
export interface Message {
  id: number;
  role: MessageRole;
  content: string | MessageSegment[]; // user: 字符串; assistant: 段落数组
  createdAt: string;
}

// 任务关联的 Forge 信息（简化版）
export interface TaskForge {
  id: number;
  displayName: string;
  avatar: string | null;
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
  // 关联的 Forge 信息（从 Forge 创建的任务才有）
  agent?: TaskForge | null;
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
  | 'summary'
  | 'error'
  | 'done'
  // 提示词增强相关类型
  | 'user_original' // 用户原始输入（增强模式下）
  | 'reviewer' // 审查者输出
  | 'questioner' // 提问者输出
  | 'expert' // 专家分析输出
  | 'enhancer'; // 增强后的提示词

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
