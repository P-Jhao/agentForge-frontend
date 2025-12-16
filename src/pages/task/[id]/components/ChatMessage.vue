<script setup lang="ts">
/**
 * 单条聊天消息组件
 * 展示用户或 AI 的消息
 */
import { computed } from 'vue';
import { NIcon } from 'naive-ui';
import { PersonOutline } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  message: Message;
}

const props = defineProps<Props>();

const themeStore = useThemeStore();

const isUserMessage = computed(() => props.message.role === 'user');

const containerClass = computed(() => ({
  'flex-row-reverse': isUserMessage.value,
}));

const avatarClass = computed(() => {
  if (isUserMessage.value) {
    return 'bg-primary-500 text-white';
  }
  return themeStore.isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600';
});

const messageClass = computed(() => {
  if (isUserMessage.value) {
    return 'bg-primary-500 text-white';
  }
  return themeStore.isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800';
});
</script>

<template>
  <div class="flex gap-3" :class="containerClass">
    <!-- 头像 -->
    <div
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      :class="avatarClass"
    >
      <NIcon v-if="isUserMessage" :component="PersonOutline" :size="16" />
      <span v-else class="text-sm">🤖</span>
    </div>

    <!-- 消息内容 -->
    <div class="max-w-[70%] rounded-2xl px-4 py-3" :class="messageClass">
      <p class="text-sm whitespace-pre-wrap">{{ props.message.content }}</p>
    </div>
  </div>
</template>
