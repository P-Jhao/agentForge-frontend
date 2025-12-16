<script setup lang="ts">
/**
 * 聊天加载状态组件
 * 展示 AI 正在生成回复的加载动画
 */
import { computed } from 'vue';
import { NSpin } from 'naive-ui';
import { useThemeStore } from '@/stores';

const themeStore = useThemeStore();

const avatarClass = computed(() => (themeStore.isDark ? 'bg-gray-700' : 'bg-gray-200'));

const messageClass = computed(() => (themeStore.isDark ? 'bg-gray-800' : 'bg-gray-100'));
</script>

<template>
  <div class="flex gap-3">
    <!-- 头像 -->
    <div
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      :class="avatarClass"
    >
      <span class="text-sm">🤖</span>
    </div>

    <!-- 加载动画 -->
    <div class="rounded-2xl px-4 py-3" :class="messageClass">
      <NSpin size="small" />
    </div>
  </div>
</template>
