/**
 * 消息管理模块
 * 负责消息的增删改查和格式转换
 */
import { reactive, type Ref } from 'vue';
import type { FlatMessage, TurnEndData } from '@/types';
import type {
  RenderItem,
  UserMessageData,
  TextMessageData,
  TextMessageType,
  ToolCallMessageData,
  TurnEndMessageData,
  UploadedFileInfo,
} from './types';

// ID 计数器
let idCounter = 0;

/**
 * 生成唯一消息 ID
 */
export const generateId = () => {
  return `msg_${Date.now()}_${idCounter++}`;
};

/**
 * 重置 ID 计数器（用于测试）
 */
export const resetIdCounter = () => {
  idCounter = 0;
};

/**
 * 获取当前 ID 计数器值并自增
 */
export const getNextIdCounter = () => {
  return ++idCounter;
};

export interface UseMessageManagerOptions {
  renderItems: Ref<RenderItem[]>;
}

export function useMessageManager(options: UseMessageManagerOptions) {
  const { renderItems } = options;

  /**
   * 添加用户消息（支持多文件）
   */
  const addUserMessage = (content: string, files?: UploadedFileInfo[]): RenderItem => {
    const id = generateId();
    const data = reactive<UserMessageData>({
      id,
      type: 'user',
      content,
      files: files && files.length > 0 ? files : undefined,
    });
    const item: RenderItem = { id, type: 'user', data };
    renderItems.value.push(item);
    return item;
  };

  /**
   * 添加文本消息（chat/thinking/summary/error 及增强相关类型）
   */
  const addTextMessage = (type: TextMessageType, content: string): RenderItem => {
    const id = generateId();
    const data = reactive<TextMessageData>({
      id,
      type,
      content,
    });
    const item: RenderItem = { id, type, data };
    renderItems.value.push(item);
    return item;
  };

  /**
   * 添加工具调用消息
   */
  const addToolCallMessage = (callId: string, toolName: string): RenderItem => {
    const id = generateId();
    const data = reactive<ToolCallMessageData>({
      id,
      type: 'tool_call',
      callId,
      toolName,
      success: false,
      status: 'running',
    });
    const item: RenderItem = { id, type: 'tool_call', data };
    renderItems.value.push(item);
    return item;
  };

  /**
   * 添加轮次结束消息
   */
  const addTurnEndMessage = (turnEndData: TurnEndData): RenderItem => {
    const id = generateId();
    const data = reactive<TurnEndMessageData>({
      id,
      type: 'turn_end',
      messageId: turnEndData.messageId,
      completedAt: turnEndData.completedAt,
      accumulatedTokens: turnEndData.accumulatedTokens,
    });
    const item: RenderItem = { id, type: 'turn_end', data };
    renderItems.value.push(item);
    return item;
  };

  /**
   * 添加用户回复消息（智能迭代）
   */
  const addUserAnswerMessage = (content: string): RenderItem => {
    const id = generateId();
    const data = reactive<TextMessageData>({
      id,
      type: 'user_answer',
      content,
    });
    const item: RenderItem = { id, type: 'user_answer', data };
    renderItems.value.push(item);
    return item;
  };

  /**
   * 清空消息列表
   */
  const clearMessages = () => {
    renderItems.value = [];
  };

  return {
    addUserMessage,
    addTextMessage,
    addToolCallMessage,
    addTurnEndMessage,
    addUserAnswerMessage,
    clearMessages,
  };
}

/**
 * 将后端 FlatMessage 转换为 RenderItem
 * 独立函数，可被 useChat 和 useShareChat 复用
 */
export function convertFlatMessage(msg: FlatMessage): RenderItem {
  const id = msg.id?.toString() || generateId();

  // 处理用户消息（注意：user_original 需要保留文件信息）
  if (msg.role === 'user') {
    // user_original 类型需要保留文件信息，使用 UserMessageData
    if (msg.type === 'user_original') {
      const data = reactive<UserMessageData>({
        id,
        type: 'user', // 使用 user 类型以便 UserMessage 组件正确渲染
        content: msg.content,
        files: msg.files,
      });
      return { id, type: 'user_original', data };
    }
    // user_answer 类型不需要文件
    if (msg.type === 'user_answer') {
      const data = reactive<TextMessageData>({
        id,
        type: msg.type,
        content: msg.content,
        aborted: msg.aborted,
      });
      return { id, type: msg.type, data };
    }
    // 普通用户消息
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
      outputFiles: msg.outputFiles,
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
        messageId: msg.id, // 保存数据库消息 ID
        completedAt: turnEndContent.completedAt,
        accumulatedTokens: turnEndContent.accumulatedTokens,
      });
      return { id, type: 'turn_end', data };
    } catch {
      // 解析失败，返回空的 turn_end 消息
      const data = reactive<TurnEndMessageData>({
        id,
        type: 'turn_end',
        messageId: msg.id, // 保存数据库消息 ID
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
