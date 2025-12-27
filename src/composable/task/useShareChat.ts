/**
 * 分享模式下的对话 composable
 * 用于通过分享链接访问任务时加载数据
 */
import { ref, reactive } from 'vue';
import { getSharedMessages } from '@/utils/shareApi';
import type { FlatMessage, TokenUsage } from '@/types';

// 复用 useChat 中的类型定义
export type ToolCallStatus = 'running' | 'success' | 'failed';

export type MessageType =
  | 'user'
  | 'chat'
  | 'thinking'
  | 'tool_call'
  | 'summary'
  | 'error'
  | 'user_original'
  | 'user_answer'
  | 'reviewer'
  | 'questioner'
  | 'expert'
  | 'enhancer'
  | 'turn_end';

interface BaseMessageData {
  id: string;
  type: MessageType;
}

export interface UploadedFileInfo {
  filePath: string;
  originalName: string;
  size: number;
  url: string;
}

export interface UserMessageData extends BaseMessageData {
  type: 'user';
  content: string;
  files?: UploadedFileInfo[];
}

export interface TextMessageData extends BaseMessageData {
  type:
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
  content: string;
  isStreaming?: boolean;
  aborted?: boolean;
}

export interface ToolCallMessageData extends BaseMessageData {
  type: 'tool_call';
  callId: string;
  toolName: string;
  summarizedResult?: string;
  success: boolean;
  status: ToolCallStatus;
}

export interface TurnEndMessageData extends BaseMessageData {
  type: 'turn_end';
  completedAt: string;
  accumulatedTokens?: TokenUsage;
}

export type MessageData =
  | UserMessageData
  | TextMessageData
  | ToolCallMessageData
  | TurnEndMessageData;

export interface RenderItem {
  id: string;
  type: MessageType;
  data: MessageData;
}

interface TurnEndData {
  completedAt: string;
  accumulatedTokens?: TokenUsage;
}

let idCounter = 0;
const generateId = () => `msg_${Date.now()}_${idCounter++}`;

/**
 * 将后端 FlatMessage 转换为 RenderItem
 */
function convertFlatMessage(msg: FlatMessage): RenderItem {
  const id = msg.id?.toString() || generateId();

  // 处理用户消息
  if (msg.role === 'user') {
    if (msg.type === 'user_original') {
      const data = reactive<UserMessageData>({
        id,
        type: 'user',
        content: msg.content,
        files: msg.files,
      });
      return { id, type: 'user_original', data };
    }
    if (msg.type === 'user_answer') {
      const data = reactive<TextMessageData>({
        id,
        type: msg.type,
        content: msg.content,
        aborted: msg.aborted,
      });
      return { id, type: msg.type, data };
    }
    const data = reactive<UserMessageData>({
      id,
      type: 'user',
      content: msg.content,
      files: msg.files,
    });
    return { id, type: 'user', data };
  }

  if (msg.type === 'tool_call') {
    const data = reactive<ToolCallMessageData>({
      id,
      type: 'tool_call',
      callId: msg.callId || '',
      toolName: msg.toolName || '',
      summarizedResult: msg.summarizedResult,
      success: msg.success ?? false,
      status: msg.success ? 'success' : 'failed',
    });
    return { id, type: 'tool_call', data };
  }

  // 处理增强相关类型
  if (
    ['user_original', 'user_answer', 'reviewer', 'questioner', 'expert', 'enhancer'].includes(
      msg.type
    )
  ) {
    const msgType = msg.type as
      | 'user_original'
      | 'user_answer'
      | 'reviewer'
      | 'questioner'
      | 'expert'
      | 'enhancer';
    const data = reactive<TextMessageData>({
      id,
      type: msgType,
      content: msg.content,
      aborted: msg.aborted,
    });
    return { id, type: msgType, data };
  }

  // 处理轮次结束消息
  if (msg.type === 'turn_end') {
    try {
      const turnEndContent = JSON.parse(msg.content) as TurnEndData;
      const data = reactive<TurnEndMessageData>({
        id,
        type: 'turn_end',
        completedAt: turnEndContent.completedAt,
        accumulatedTokens: turnEndContent.accumulatedTokens,
      });
      return { id, type: 'turn_end', data };
    } catch {
      const data = reactive<TurnEndMessageData>({
        id,
        type: 'turn_end',
        completedAt: new Date().toISOString(),
        accumulatedTokens: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      });
      return { id, type: 'turn_end', data };
    }
  }

  // chat/thinking/error/summary
  const msgType = (msg.type || 'chat') as 'chat' | 'thinking' | 'error' | 'summary';
  const data = reactive<TextMessageData>({
    id,
    type: msgType,
    content: msg.content,
    aborted: msg.aborted,
  });
  return { id, type: msgType, data };
}

export interface UseShareChatOptions {
  taskId: string;
  shareSign: string;
}

export function useShareChat(options: UseShareChatOptions) {
  const { taskId, shareSign } = options;

  const renderItems = ref<RenderItem[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const shareMode = ref<'detail' | 'replay'>('detail');

  /**
   * 加载分享的消息
   */
  const loadMessages = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await getSharedMessages(taskId, shareSign);
      const messages = result.messages as FlatMessage[];
      renderItems.value = messages.map(convertFlatMessage);
      shareMode.value = result.shareMode;
    } catch (err) {
      const e = err as { message?: string; status?: number };
      if (e.status === 403) {
        error.value = '分享链接已失效或无效';
      } else if (e.status === 404) {
        error.value = '任务不存在';
      } else {
        error.value = e.message || '加载失败';
      }
    } finally {
      isLoading.value = false;
    }
  };

  return {
    renderItems,
    isLoading,
    error,
    shareMode,
    loadMessages,
  };
}
