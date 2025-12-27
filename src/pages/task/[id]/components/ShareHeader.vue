<script setup lang="ts">
/**
 * 分享模式下的任务头部组件
 * 展示 Forge 信息和任务所有者
 */
import { computed } from 'vue';
import { NAvatar } from 'naive-ui';
import { useThemeStore } from '@/stores';

const props = defineProps<{
  title: string;
  forge?: {
    displayName: string;
    avatar?: string;
  } | null;
  ownerName?: string;
}>();

const themeStore = useThemeStore();

// 获取 Forge 头像完整 URL
const forgeAvatarUrl = computed(() => {
  if (!props.forge?.avatar) return '';
  if (props.forge.avatar.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE || '';
    const baseUrl = apiBase.replace(/\/api$/, '');
    return `${baseUrl}${props.forge.avatar}`;
  }
  return props.forge.avatar;
});

// 显示的名称
const displayName = computed(() => props.forge?.displayName || 'AgentForge');

const headerClass = computed(() => ({
  'border-gray-700': themeStore.isDark,
  'border-gray-200': !themeStore.isDark,
}));

const titleClass = computed(() => ({
  'text-white': themeStore.isDark,
  'text-gray-900': !themeStore.isDark,
}));
</script>

<template>
  <div class="flex items-center justify-between border-b px-6 py-3" :class="headerClass">
    <!-- 左侧：头像和名称 -->
    <div class="flex items-center gap-3">
      <NAvatar
        :src="forgeAvatarUrl || '/favicon660x660nobackground.png'"
        :size="36"
        round
        object-fit="cover"
      />
      <span class="font-medium" :class="titleClass">{{ displayName }}</span>
    </div>

    <!-- 右侧：任务所有者 -->
    <div class="text-sm text-gray-500 dark:text-gray-400">
      来自
      <span class="font-medium text-gray-700 dark:text-gray-300">
        {{ ownerName || '未知用户' }}
      </span>
      的分享
    </div>
  </div>
</template>
