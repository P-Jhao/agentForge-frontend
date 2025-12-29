/**
 * 分享模式下的对话 composable
 * 用于通过分享链接访问任务时加载数据
 */
import { ref } from 'vue';
import { getSharedMessages } from '@/utils/shareApi';
import type { FlatMessage } from '@/types';

// 复用共享类型定义
import type { RenderItem } from './types';
import { convertFlatMessage } from './useMessageManager';

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
