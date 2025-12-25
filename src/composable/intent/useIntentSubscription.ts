/**
 * 意图事件订阅 composable
 * 管理智能路由配置生成事件的订阅
 */
import { ref } from 'vue';
import type { IntentEventHandlers } from '@/types';

// 当前事件处理器（单例，同一时间只有一个智能路由操作）
let currentHandlers: IntentEventHandlers | null = null;

/**
 * 意图事件订阅 composable
 */
export function useIntentSubscription() {
  // 是否已订阅
  const subscribed = ref(false);

  /**
   * 订阅意图事件
   * @param handlers 事件处理器
   */
  const subscribe = (handlers: IntentEventHandlers): void => {
    currentHandlers = handlers;
    subscribed.value = true;
    console.log('[IntentSubscription] 已订阅');
  };

  /**
   * 取消订阅
   */
  const unsubscribe = (): void => {
    currentHandlers = null;
    subscribed.value = false;
    console.log('[IntentSubscription] 已取消订阅');
  };

  /**
   * 检查是否已订阅
   */
  const isSubscribed = (): boolean => {
    return subscribed.value;
  };

  /**
   * 获取当前处理器（供外部直接调用）
   */
  const getHandlers = (): IntentEventHandlers | null => {
    return currentHandlers;
  };

  return {
    subscribed,
    subscribe,
    unsubscribe,
    isSubscribed,
    getHandlers,
  };
}
