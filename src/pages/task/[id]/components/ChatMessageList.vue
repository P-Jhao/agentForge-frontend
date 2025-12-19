<script setup lang="ts">
/**
 * 聊天消息列表组件
 * 展示所有消息和加载状态
 */
import { ref, computed, nextTick } from 'vue';
import { useThemeStore } from '@/stores';
import ChatMessage from './ChatMessage.vue';
import ChatLoadingState from './ChatLoadingState.vue';
import type { MessageSegment, TaskForge } from '@/types';
import type { ToolCallStatus } from './ToolCallItem.vue';

// 消息类型（与 useChat 中的 ChatMessage 一致）
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | MessageSegment[];
}

interface Props {
  messages: Message[];
  isLoading: boolean;
  // 正在进行的工具调用状态（callId -> status）
  toolCallStates?: Map<string, ToolCallStatus>;
  // 关联的 Forge 信息（用于显示 AI 头像）
  forge?: TaskForge | null;
}

const props = withDefaults(defineProps<Props>(), {
  toolCallStates: () => new Map(),
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
// 如果最后一条消息是空的 assistant 消息，则不显示（因为该消息会显示加载动画）
const showLoadingState = computed(() => {
  if (!props.isLoading) return false;
  const lastMsg = props.messages[props.messages.length - 1];
  // 如果最后一条是 assistant 消息，不显示独立的加载状态
  if (lastMsg && lastMsg.role === 'assistant') return false;
  return true;
});
</script>

<template>
  <div ref="containerRef" class="flex-1 space-y-4 overflow-y-auto p-6">
    <!-- 空状态 -->
    <div v-if="messages.length === 0 && !isLoading" class="flex h-full items-center justify-center">
      <p :class="emptyStateClass">开始你的对话吧</p>
    </div>

    <!-- 消息列表 -->
    <ChatMessage
      v-for="msg in messages"
      :key="msg.id"
      :message="msg"
      :tool-call-states="toolCallStates"
      :forge="forge"
    />

    <!-- 加载状态（仅在没有空的 assistant 消息时显示） -->
    <ChatLoadingState v-if="showLoadingState" :forge="forge" />
  </div>
</template>
