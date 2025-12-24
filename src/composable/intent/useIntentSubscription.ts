/**
 * 意图事件订阅 composable
 * 管理智能路由 SSE 事件的订阅和分发
 */
import { ref } from 'vue';
import type { IntentSSEEvent, IntentEventHandlers, ConfigFieldName, IntentResult } from '@/types';

// 全局订阅管理器（单例）
class IntentEventSubscriptionManager {
  // 订阅列表：sessionId -> handlers
  private subscriptions: Map<string, IntentEventHandlers> = new Map();

  /**
   * 订阅智能路由事件
   * @param sessionId 会话 ID
   * @param handlers 事件处理器
   */
  subscribe(sessionId: string, handlers: IntentEventHandlers): void {
    this.subscriptions.set(sessionId, handlers);
    console.log(`[IntentSubscription] 订阅会话: ${sessionId}`);
  }

  /**
   * 取消订阅
   * @param sessionId 会话 ID
   */
  unsubscribe(sessionId: string): void {
    if (this.subscriptions.has(sessionId)) {
      this.subscriptions.delete(sessionId);
      console.log(`[IntentSubscription] 取消订阅会话: ${sessionId}`);
    }
  }

  /**
   * 检查是否已订阅
   * @param sessionId 会话 ID
   */
  isSubscribed(sessionId: string): boolean {
    return this.subscriptions.has(sessionId);
  }

  /**
   * 处理 SSE 事件
   * @param event 意图 SSE 事件
   */
  handleEvent(event: IntentSSEEvent): void {
    const { type, sessionId, data } = event;

    // 获取对应会话的处理器
    const handlers = this.subscriptions.get(sessionId);
    if (!handlers) {
      console.log(`[IntentSubscription] 未找到会话 ${sessionId} 的订阅`);
      return;
    }

    // 根据事件类型分发
    switch (type) {
      case 'intent:analyze_start':
        handlers.onAnalyzeStart?.();
        break;

      case 'intent:analyze_result':
        if (data?.result) {
          handlers.onAnalyzeResult?.(data.result as IntentResult);
        }
        break;

      case 'intent:config_start':
        if (data?.field) {
          handlers.onConfigStart?.(data.field as ConfigFieldName);
        }
        break;

      case 'intent:config_chunk':
        if (data?.field && data?.content !== undefined) {
          handlers.onConfigChunk?.(data.field as ConfigFieldName, data.content);
        }
        break;

      case 'intent:config_done':
        if (data?.field && data?.content !== undefined) {
          handlers.onConfigDone?.(data.field as ConfigFieldName, data.content);
        }
        break;

      case 'intent:config_complete':
        handlers.onConfigComplete?.();
        // 完成后自动取消订阅
        this.unsubscribe(sessionId);
        break;

      case 'intent:cancelled':
        handlers.onCancelled?.();
        // 取消后自动取消订阅
        this.unsubscribe(sessionId);
        break;

      case 'intent:error':
        if (data?.message) {
          handlers.onError?.(data.message);
        }
        // 错误后自动取消订阅
        this.unsubscribe(sessionId);
        break;
    }
  }

  /**
   * 清理所有订阅
   */
  clear(): void {
    this.subscriptions.clear();
    console.log('[IntentSubscription] 清理所有订阅');
  }
}

// 全局单例
const subscriptionManager = new IntentEventSubscriptionManager();

/**
 * 意图事件订阅 composable
 */
export function useIntentSubscription() {
  // 当前订阅的 sessionId
  const currentSessionId = ref<string | null>(null);

  /**
   * 订阅意图事件
   * @param sessionId 会话 ID
   * @param handlers 事件处理器
   */
  const subscribe = (sessionId: string, handlers: IntentEventHandlers): void => {
    // 如果已有订阅，先取消
    if (currentSessionId.value) {
      subscriptionManager.unsubscribe(currentSessionId.value);
    }

    subscriptionManager.subscribe(sessionId, handlers);
    currentSessionId.value = sessionId;
  };

  /**
   * 取消订阅
   * @param sessionId 可选，不传则取消当前订阅
   */
  const unsubscribe = (sessionId?: string): void => {
    const targetId = sessionId || currentSessionId.value;
    if (targetId) {
      subscriptionManager.unsubscribe(targetId);
      if (targetId === currentSessionId.value) {
        currentSessionId.value = null;
      }
    }
  };

  /**
   * 检查是否已订阅
   */
  const isSubscribed = (sessionId?: string): boolean => {
    const targetId = sessionId || currentSessionId.value;
    return targetId ? subscriptionManager.isSubscribed(targetId) : false;
  };

  return {
    currentSessionId,
    subscribe,
    unsubscribe,
    isSubscribed,
  };
}

/**
 * 获取全局订阅管理器（用于 SSE 事件分发）
 */
export function getIntentSubscriptionManager(): IntentEventSubscriptionManager {
  return subscriptionManager;
}

/**
 * 判断是否为意图事件
 * @param eventType 事件类型
 */
export function isIntentEvent(eventType: string): boolean {
  return eventType.startsWith('intent:');
}
