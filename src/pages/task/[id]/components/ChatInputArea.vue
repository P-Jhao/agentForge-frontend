<script setup lang="ts">
/**
 * 聊天输入区域组件
 * 包含输入框和发送功能
 */
import { computed } from 'vue';
import { useThemeStore } from '@/stores';
import ChatInput from '@/components/ChatInput.vue';

interface Props {
  inputValue: string;
  isLoading: boolean;
}

interface Emits {
  (e: 'update:inputValue', value: string): void;
  (e: 'send'): void;
}

defineProps<Props>();
defineEmits<Emits>();

const themeStore = useThemeStore();

const borderClass = computed(() => (themeStore.isDark ? 'border-gray-700' : 'border-gray-200'));
</script>

<template>
  <div class="border-t p-4" :class="borderClass">
    <ChatInput
      :model-value="inputValue"
      placeholder="输入消息..."
      type="multi"
      :loading="isLoading"
      @update:model-value="$emit('update:inputValue', $event)"
      @send="$emit('send')"
    />
  </div>
</template>
