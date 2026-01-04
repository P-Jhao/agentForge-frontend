/**
 * SSE 消息处理模块
 * 负责处理服务端推送的流式消息
 */
import type { Ref } from 'vue';
import type { TaskSSEChunk, ToolCallStartData, ToolCallResultData, TurnEndData } from '@/types';
import type { RenderItem, TextMessageData, TextMessageType, ToolCallMessageData } from './types';
import type { useMessageManager } from './useMessageManager';

export interface UseSSEHandlerOptions {
  renderItems: Ref<RenderItem[]>;
  messageManager: ReturnType<typeof useMessageManager>;
}

export function useSSEHandler(options: UseSSEHandlerOptions) {
  const { renderItems, messageManager } = options;

  // 当前正在流式输出的消息（记录 type 和对应的响应式数据）
  let currentStreamItem: RenderItem | null = null;

  /**
   * 获取当前流式消息项
   */
  const getCurrentStreamItem = () => currentStreamItem;

  /**
   * 设置当前流式消息项
   */
  const setCurrentStreamItem = (item: RenderItem | null) => {
    currentStreamItem = item;
  };

  /**
   * 结束当前流式消息
   */
  const endCurrentStream = () => {
    if (currentStreamItem) {
      const data = currentStreamItem.data as TextMessageData;
      if (data && 'isStreaming' in data) {
        data.isStreaming = false;
      }
    }
    currentStreamItem = null;
  };

  /**
   * 标记当前流式消息为已中断
   */
  const markCurrentStreamAborted = () => {
    if (currentStreamItem) {
      const data = currentStreamItem.data as TextMessageData;
      if (data && 'isStreaming' in data) {
        data.isStreaming = false;
        data.aborted = true;
      }
    }
    currentStreamItem = null;
  };

  /**
   * 处理 SSE 消息（核心逻辑）
   * 根据 type 决定是追加到当前消息还是创建新消息
   * @returns 是否成功处理
   */
  const handleSSEChunk = (chunk: TaskSSEChunk): boolean => {
    const { type, data } = chunk;

    // 工具调用开始
    if (type === 'tool_call_start' && data) {
      const toolData = data as ToolCallStartData;
      // 结束当前流式消息
      currentStreamItem = null;
      // 创建新的工具调用消息
      messageManager.addToolCallMessage(toolData.callId, toolData.toolName);
      return true;
    }

    // 工具调用结果
    if (type === 'tool_call_result' && data) {
      const resultData = data as ToolCallResultData;
      // 查找对应的工具调用消息并更新
      const toolItem = renderItems.value.find(
        (item) =>
          item.type === 'tool_call' &&
          (item.data as ToolCallMessageData).callId === resultData.callId
      );
      if (toolItem) {
        const toolData = toolItem.data as ToolCallMessageData;
        toolData.success = resultData.success;
        toolData.summarizedResult = resultData.summarizedResult;
        toolData.status = resultData.success ? 'success' : 'failed';
        toolData.outputFiles = resultData.outputFiles;
      }
      return true;
    }

    // 文本消息（chat/thinking/summary 及增强相关类型）
    if (
      ['chat', 'thinking', 'summary', 'reviewer', 'questioner', 'expert', 'enhancer'].includes(
        type
      ) &&
      typeof data === 'string'
    ) {
      const msgType = type as TextMessageType;

      // 如果当前有流式消息且类型相同，追加内容
      if (currentStreamItem && currentStreamItem.type === msgType) {
        (currentStreamItem.data as TextMessageData).content += data;
      } else {
        // 类型不同或没有当前消息，先结束之前的流式消息
        if (currentStreamItem) {
          (currentStreamItem.data as TextMessageData).isStreaming = false;
        }
        // 创建新消息，标记为正在流式输出
        currentStreamItem = messageManager.addTextMessage(msgType, data);
        (currentStreamItem.data as TextMessageData).isStreaming = true;
      }
      return true;
    }

    // 用户原始输入消息（增强模式下）
    if (type === 'user_original' && typeof data === 'string') {
      // 用户原始输入不需要流式处理，直接创建
      messageManager.addTextMessage('user_original', data);
      return true;
    }

    // 错误消息
    if (type === 'error' && data) {
      const errorData = data as { message: string };
      currentStreamItem = null;
      messageManager.addTextMessage('error', errorData.message);
      return true;
    }

    // 轮次结束消息
    if (type === 'turn_end' && data) {
      const turnEndData = data as TurnEndData;
      // 结束当前流式消息
      if (currentStreamItem) {
        (currentStreamItem.data as TextMessageData).isStreaming = false;
      }
      currentStreamItem = null;
      // 添加轮次结束消息
      messageManager.addTurnEndMessage(turnEndData);
      return true;
    }

    // done 消息
    if (type === 'done') {
      // 结束当前流式消息
      if (currentStreamItem) {
        (currentStreamItem.data as TextMessageData).isStreaming = false;
      }
      currentStreamItem = null;
      return true;
    }

    return false;
  };

  return {
    handleSSEChunk,
    getCurrentStreamItem,
    setCurrentStreamItem,
    endCurrentStream,
    markCurrentStreamAborted,
  };
}
