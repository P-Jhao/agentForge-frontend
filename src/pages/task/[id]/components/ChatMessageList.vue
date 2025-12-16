<script setup lang="ts">
/**
 * 聊天消息列表组件
 * 展示所有消息和加载状态
 */
import { computed } from 'vue';
import { useThemeStore } from '@/stores';
import ChatMessage from './ChatMessage.vue';
import ChatLoadingState from './ChatLoadingState.vue';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  messages: Message[];
  isLoading: boolean;
  containerRef?: HTMLElement | null;
}

defineProps<Props>();

const themeStore = useThemeStore();

const emptyStateClass = computed(() => (themeStore.isDark ? 'text-gray-500' : 'text-gray-400'));
</script>

<template>
  <div class="flex-1 space-y-4 overflow-y-auto p-6">
    <!-- 空状态 -->
    <div v-if="messages.length === 0 && !isLoading" class="flex h-full items-center justify-center">
      <p :class="emptyStateClass">开始你的对话吧</p>
    </div>

    <!-- 消息列表 -->
    <ChatMessage v-for="msg in messages" :key="msg.id" :message="msg" />

    <!-- 加载状态 -->
    <ChatLoadingState v-if="isLoading" />
  </div>
</template>
