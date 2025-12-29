/**
 * 智能迭代模块
 * 负责提示词增强的智能迭代功能
 */
import type { Ref } from 'vue';
import type { RenderItem, TextMessageData, UserMessageData, SmartIterateContext } from './types';

export interface UseSmartIterateOptions {
  renderItems: Ref<RenderItem[]>;
  isLoading: Ref<boolean>;
}

export function useSmartIterate(options: UseSmartIterateOptions) {
  const { renderItems, isLoading } = options;

  /**
   * 获取智能迭代上下文
   * 从消息列表中提取原始提示词、reviewer、questioner 的内容
   * 用于用户回复澄清问题后发送请求
   */
  const getSmartIterateContext = (): SmartIterateContext => {
    let originalPrompt = '';
    let reviewerOutput = '';
    let questionerOutput = '';

    // 从后往前遍历，找到最近的一组迭代消息
    for (let i = renderItems.value.length - 1; i >= 0; i--) {
      const item = renderItems.value[i];
      if (!item) continue;

      if (item.type === 'questioner' && !questionerOutput) {
        const data = item.data as TextMessageData;
        questionerOutput = data.content;
      } else if (item.type === 'reviewer' && !reviewerOutput) {
        const data = item.data as TextMessageData;
        reviewerOutput = data.content;
      } else if ((item.type === 'user_original' || item.type === 'user') && !originalPrompt) {
        // 支持 user_original（历史消息）和 user（当前会话）两种类型
        const data = item.data as TextMessageData | UserMessageData;
        originalPrompt = data.content;
      }

      // 如果三个都找到了，退出循环
      if (originalPrompt && reviewerOutput && questionerOutput) {
        break;
      }

      // 如果遇到 enhancer 或 chat，说明已经过了当前迭代周期
      if (item.type === 'enhancer' || item.type === 'chat') {
        break;
      }
    }

    return { originalPrompt, reviewerOutput, questionerOutput };
  };

  /**
   * 检查是否需要显示智能迭代回复输入框
   * 条件：最后一条消息是 questioner 类型，且不在加载中，且未被中断
   */
  const needsSmartIterateReply = (): boolean => {
    if (isLoading.value) return false;
    const lastItem = renderItems.value[renderItems.value.length - 1];
    if (lastItem?.type !== 'questioner') return false;
    // 检查是否被中断
    const data = lastItem.data as TextMessageData;
    if (data.aborted) return false;
    return true;
  };

  return {
    getSmartIterateContext,
    needsSmartIterateReply,
  };
}
