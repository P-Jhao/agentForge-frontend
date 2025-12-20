<script setup lang="ts">
/**
 * 聊天消息列表组件
 * 展示所有消息和加载状态
 */
import { ref, computed, nextTick } from 'vue';
import { useThemeStore } from '@/stores';
import ChatMessage from './ChatMessage.vue';
import ChatLoadingState from './ChatLoadingState.vue';
import type { TaskForge } from '@/types';
import type { RenderItem } from '@/composable/task/useChat';

interface Props {
  renderItems: RenderItem[];
  isLoading: boolean;
  // 关联的 Forge 信息（用于显示 AI 头像）
  forge?: TaskForge | null;
}

const props = withDefaults(defineProps<Props>(), {
  forge: null,
});

const themeStore = useThemeStore();

// 滚动容器引用
const containerRef = ref<HTMLElement | null>(null);

// 滚动到底部（带平滑过渡效果）
const scrollToBottom = async (smooth = true) => {
  await nextTick();
  if (containerRef.value) {
    containerRef.value.scrollTo({
      top: containerRef.value.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant',
    });
  }
};

// 暴露方法给父组件
defineExpose({
  scrollToBottom,
});

const emptyStateClass = computed(() => (themeStore.isDark ? 'text-gray-500' : 'text-gray-400'));

// 判断是否需要显示独立的加载状态
const showLoadingState = computed(() => {
  if (!props.isLoading) return false;
  const lastItem = props.renderItems[props.renderItems.length - 1];
  // 如果最后一条是 assistant 消息（非 user），不显示独立的加载状态
  if (lastItem && lastItem.type !== 'user') return false;
  return true;
});
</script>

<template>
  <div ref="containerRef" class="flex-1 space-y-4 overflow-y-auto p-6">
    <!-- 空状态 -->
    <div
      v-if="renderItems.length === 0 && !isLoading"
      class="flex h-full items-center justify-center"
    >
      <p :class="emptyStateClass">开始你的对话吧</p>
    </div>

    <!-- 消息列表 -->
    <ChatMessage v-for="item in renderItems" :key="item.id" :data="item.data" :forge="forge" />

    <!-- 加载状态（仅在没有 assistant 消息时显示） -->
    <ChatLoadingState v-if="showLoadingState" :forge="forge" />
  </div>
</template>
