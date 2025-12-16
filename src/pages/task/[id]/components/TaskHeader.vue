<script setup lang="ts">
/**
 * 任务对话页面头部
 * 展示任务标题和 ID
 */
import { computed } from 'vue';
import { useThemeStore } from '@/stores';

interface Props {
  taskId: string;
}

defineProps<Props>();

const themeStore = useThemeStore();

const headerClass = computed(() => ({
  'border-gray-700': themeStore.isDark,
  'border-gray-200': !themeStore.isDark,
}));

const titleClass = computed(() => ({
  'text-white': themeStore.isDark,
  'text-gray-900': !themeStore.isDark,
}));

const subtitleClass = computed(() => ({
  'text-gray-500': themeStore.isDark,
  'text-gray-400': !themeStore.isDark,
}));
</script>

<template>
  <div class="flex items-center justify-between border-b px-6 py-4" :class="headerClass">
    <div>
      <h1 class="text-lg font-semibold" :class="titleClass">AI 对话</h1>
      <p class="text-xs" :class="subtitleClass">任务 ID: {{ taskId }}</p>
    </div>
  </div>
</template>
