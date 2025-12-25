/**
 * 意图事件订阅 composable
 * 管理智能路由 SSE 事件的订阅和分发
 */
import { ref } from 'vue';
import type { IntentSSEEvent, IntentEventHandlers, ConfigFieldName, IntentResult } from '@/types';

// 当前事件处理器（单例，同一时间只有一个智能路由操作）
let currentHandlers: IntentEventHandlers | null = null;

/**
 * 处理 SSE 事件
 * @param event 意图 SSE 事件
 */
function handleIntentEvent(event: IntentSSEEvent): void {
  if (!currentHandlers) {
    console.log('[IntentSubscription] 未找到订阅的处理器');
    return;
  }

  const { type, data } = event;

  // 根据事件类型分发
  switch (type) {
    case 'intent:analyze_start':
      currentHandlers.onAnalyzeStart?.();
      break;

    case 'intent:analyze_result':
      if (data?.result) {
        currentHandlers.onAnalyzeResult?.(data.result as IntentResult);
      }
      break;

    case 'intent:config_start':
      if (data?.field) {
        currentHandlers.onConfigStart?.(data.field as ConfigFieldName);
      }
      break;

    case 'intent:config_chunk':
      if (data?.field && data?.content !== undefined) {
        currentHandlers.onConfigChunk?.(data.field as ConfigFieldName, data.content);
      }
      break;

    case 'intent:config_done':
      if (data?.field && data?.content !== undefined) {
        currentHandlers.onConfigDone?.(data.field as ConfigFieldName, data.content);
      }
      break;

    case 'intent:config_complete':
      currentHandlers.onConfigComplete?.();
      // 完成后自动清理
      currentHandlers = null;
      break;

    case 'intent:cancelled':
      currentHandlers.onCancelled?.();
      // 取消后自动清理
      currentHandlers = null;
      break;

    case 'intent:error':
      if (data?.message) {
        currentHandlers.onError?.(data.message);
      }
      // 错误后自动清理
      currentHandlers = null;
      break;
  }
}

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

  return {
    subscribed,
    subscribe,
    unsubscribe,
    isSubscribed,
  };
}

/**
 * 获取意图订阅管理器（用于 SSE 事件分发）
 * 返回一个单例对象，供 useTaskSubscription 调用
 */
export function getIntentSubscriptionManager() {
  return {
    handleEvent: handleIntentEvent,
  };
}

/**
 * 判断是否为意图事件
 * @param eventType 事件类型
 */
export function isIntentEvent(eventType: string): boolean {
  return eventType.startsWith('intent:');
}
