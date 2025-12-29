/**
 * 反馈功能模块
 * 负责消息反馈状态的加载和更新
 */
import type { Ref } from 'vue';
import { batchGetFeedbackStatus } from '@/utils/feedbackApi';
import type { RenderItem, TurnEndMessageData } from './types';

export interface UseFeedbackOptions {
  renderItems: Ref<RenderItem[]>;
  taskId: Ref<string>;
}

export function useFeedback(options: UseFeedbackOptions) {
  const { renderItems, taskId } = options;

  /**
   * 批量加载反馈状态
   * 从 renderItems 中提取所有 turn_end 消息的 messageId，批量获取反馈状态
   */
  const loadFeedbackStatus = async () => {
    // 提取所有 turn_end 消息的 messageId
    const turnEndItems = renderItems.value.filter(
      (item) => item.type === 'turn_end' && (item.data as TurnEndMessageData).messageId
    );

    if (turnEndItems.length === 0) return;

    const messageIds = turnEndItems.map(
      (item) => (item.data as TurnEndMessageData).messageId as number
    );

    try {
      const statusMap = await batchGetFeedbackStatus({
        taskId: taskId.value,
        turnEndMessageIds: messageIds,
      });

      // 更新每个 turn_end 消息的反馈状态
      for (const item of turnEndItems) {
        const data = item.data as TurnEndMessageData;
        if (data.messageId && statusMap[data.messageId] !== undefined) {
          data.feedbackType = statusMap[data.messageId];
        }
      }
    } catch (error) {
      console.error('[useFeedback] 加载反馈状态失败:', error);
    }
  };

  /**
   * 更新单个轮次的反馈状态
   */
  const updateFeedbackStatus = (messageId: number, type: 'like' | 'dislike' | null) => {
    const item = renderItems.value.find(
      (item) =>
        item.type === 'turn_end' && (item.data as TurnEndMessageData).messageId === messageId
    );
    if (item) {
      (item.data as TurnEndMessageData).feedbackType = type;
    }
  };

  return {
    loadFeedbackStatus,
    updateFeedbackStatus,
  };
}
