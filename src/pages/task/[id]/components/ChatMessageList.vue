<script setup lang="ts">
/**
 * 聊天消息列表组件
 * 展示所有消息和加载状态
 * 监听滚动事件控制自动滚动
 */
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import ChatMessage from './ChatMessage.vue';
import ChatLoadingState from './ChatLoadingState.vue';
import type { TaskForge } from '@/types';
import type { RenderItem, TextMessageData } from '@/composable/task/useChat';

interface Props {
  renderItems: RenderItem[];
  isLoading: boolean;
  // 关联的 Forge 信息（用于显示 AI 头像）
  forge?: TaskForge | null;
}

const props = withDefaults(defineProps<Props>(), {
  forge: null,
});

// 滚动容器引用
const containerRef = ref<HTMLElement | null>(null);
// 是否允许自动滚动（用户在底部时为 true）
const autoScrollEnabled = ref(true);
// 判断是否接近底部的阈值（像素）
const BOTTOM_THRESHOLD = 100;

// 检查是否接近底部
const isNearBottom = () => {
  if (!containerRef.value) return true;
  const { scrollTop, scrollHeight, clientHeight } = containerRef.value;
  return scrollHeight - scrollTop - clientHeight < BOTTOM_THRESHOLD;
};

// 用户滚轮事件处理（只有用户主动滚动才会触发）
const handleWheel = () => {
  // 延迟检查，等滚动完成后再判断位置
  setTimeout(() => {
    autoScrollEnabled.value = isNearBottom();
  }, 50);
};

onMounted(() => {
  containerRef.value?.addEventListener('wheel', handleWheel, { passive: true });
});

onBeforeUnmount(() => {
  containerRef.value?.removeEventListener('wheel', handleWheel);
});

// 滚动到底部（带平滑过渡效果）
const scrollToBottom = async (smooth = true) => {
  await nextTick();
  // 只有当自动滚动启用时才滚动
  if (containerRef.value && autoScrollEnabled.value) {
    containerRef.value.scrollTo({
      top: containerRef.value.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant',
    });
  }
};

// 强制滚动到底部（忽略 autoScrollEnabled 状态，用于用户发送消息后）
const forceScrollToBottom = async (smooth = true) => {
  await nextTick();
  if (containerRef.value) {
    containerRef.value.scrollTo({
      top: containerRef.value.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant',
    });
    // 滚动后重新启用自动滚动
    autoScrollEnabled.value = true;
  }
};

// 暴露方法和状态给父组件
defineExpose({
  scrollToBottom,
  forceScrollToBottom,
  autoScrollEnabled,
});

// 判断是否需要显示独立的加载状态
const showLoadingState = computed(() => {
  if (!props.isLoading) return false;
  const lastItem = props.renderItems[props.renderItems.length - 1];
  // 如果最后一条是 assistant 消息（非 user），不显示独立的加载状态
  if (lastItem && lastItem.type !== 'user') return false;
  return true;
});

/**
 * 获取指定 turn_end 消息对应的 chat 内容
 * 从当前 turn_end 往前找，收集所有 chat 类型的消息内容，直到遇到上一个 turn_end 或列表开头
 */
const getChatContentForTurnEnd = (turnEndIndex: number): string => {
  const chatContents: string[] = [];

  // 从 turn_end 前一个位置开始往前遍历
  for (let i = turnEndIndex - 1; i >= 0; i--) {
    const item = props.renderItems[i];
    if (!item) continue;

    // 遇到上一个 turn_end，停止
    if (item.type === 'turn_end') break;

    // 只收集 chat 类型的内容
    if (item.type === 'chat') {
      const data = item.data as TextMessageData;
      if (data.content) {
        chatContents.unshift(data.content); // 插入到开头，保持顺序
      }
    }
  }

  return chatContents.join('\n\n');
};

// 为每个消息计算 chatContent（仅 turn_end 类型需要）
const getItemChatContent = (item: RenderItem, index: number): string => {
  if (item.type === 'turn_end') {
    return getChatContentForTurnEnd(index);
  }
  return '';
};
</script>

<template>
  <div ref="containerRef" class="flex-1 space-y-4 overflow-y-auto p-6">
    <!-- 空状态 -->
    <div
      v-if="renderItems.length === 0 && !isLoading"
      class="flex h-full items-center justify-center"
    >
      <p class="text-empty">开始你的对话吧</p>
    </div>

    <!-- 消息列表 -->
    <ChatMessage
      v-for="(item, index) in renderItems"
      :key="item.id"
      :data="item.data"
      :forge="forge"
      :chat-content="getItemChatContent(item, index)"
    />

    <!-- 加载状态（仅在没有 assistant 消息时显示） -->
    <ChatLoadingState v-if="showLoadingState" :forge="forge" />
  </div>
</template>
