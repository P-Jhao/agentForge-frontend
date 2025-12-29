/**
 * 聊天相关类型定义
 * 被 useChat 和 useShareChat 共享
 */
import type { TokenUsage } from '@/types';

// 工具调用状态类型
export type ToolCallStatus = 'running' | 'success' | 'failed';

// 消息类型（扩展支持提示词增强相关类型）
export type MessageType =
  | 'user'
  | 'chat'
  | 'thinking'
  | 'tool_call'
  | 'summary'
  | 'error'
  // 提示词增强相关类型
  | 'user_original' // 开启增强时的用户原始输入
  | 'user_answer' // 智能迭代中用户对澄清问题的回复
  | 'reviewer' // 审查者输出
  | 'questioner' // 提问者输出
  | 'expert' // 专家分析输出
  | 'enhancer' // 增强后的提示词
  // 轮次结束统计
  | 'turn_end'; // 对话轮次结束统计信息

// 基础消息数据
export interface BaseMessageData {
  id: string;
  type: MessageType;
}

// 用户上传的文件信息
export interface UploadedFileInfo {
  filePath: string;
  originalName: string;
  size: number;
  url: string;
}

// 用户消息数据
export interface UserMessageData extends BaseMessageData {
  type: 'user';
  content: string;
  files?: UploadedFileInfo[];
}

// 文本消息类型（chat/thinking/summary/error 及增强相关类型）
export type TextMessageType =
  | 'chat'
  | 'thinking'
  | 'summary'
  | 'error'
  | 'user_original'
  | 'user_answer'
  | 'reviewer'
  | 'questioner'
  | 'expert'
  | 'enhancer';

// 文本消息数据
export interface TextMessageData extends BaseMessageData {
  type: TextMessageType;
  content: string;
  isStreaming?: boolean; // 是否正在流式输出
  aborted?: boolean; // 是否因中断而不完整
}

// 工具调用消息数据
export interface ToolCallMessageData extends BaseMessageData {
  type: 'tool_call';
  callId: string;
  toolName: string;
  summarizedResult?: string; // Markdown 格式摘要
  success: boolean;
  status: ToolCallStatus;
}

// 轮次结束消息数据
export interface TurnEndMessageData extends BaseMessageData {
  type: 'turn_end';
  messageId?: number; // 数据库消息 ID，用于反馈功能
  completedAt: string; // ISO 8601 格式
  accumulatedTokens?: TokenUsage; // 可选，中断时可能没有
  feedbackType?: 'like' | 'dislike' | null; // 当前反馈状态
}

// 消息数据联合类型
export type MessageData =
  | UserMessageData
  | TextMessageData
  | ToolCallMessageData
  | TurnEndMessageData;

// 渲染项（包含响应式数据）
export interface RenderItem {
  id: string;
  type: MessageType;
  data: MessageData;
}

// composable 配置选项
export interface UseChatOptions {
  taskId: string;
  onScrollToBottom?: () => void;
  onForceScrollToBottom?: () => void;
}

// 智能迭代上下文
export interface SmartIterateContext {
  originalPrompt: string;
  reviewerOutput: string;
  questionerOutput: string;
}
