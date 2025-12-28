<script setup lang="ts">
/**
 * 分享模式下的任务头部组件
 * 展示任务标题、Forge 信息和任务所有者
 */
import { computed } from 'vue';
import { NAvatar, NTooltip } from 'naive-ui';
import { useThemeStore } from '@/stores';

const props = defineProps<{
  title: string;
  forge?: {
    displayName: string;
    avatar?: string | null;
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

// Forge 显示名称
const forgeName = computed(() => props.forge?.displayName || 'AgentForge');

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
    <!-- 左侧：头像和 Forge 名称 -->
    <div class="flex min-w-0 flex-1 items-center gap-3">
      <NAvatar
        :src="forgeAvatarUrl || '/favicon660x660nobackground.png'"
        :size="36"
        round
        object-fit="cover"
        class="shrink-0"
      />
      <NTooltip :delay="500">
        <template #trigger>
          <span class="max-w-[400px] truncate font-medium" :class="titleClass">
            {{ forgeName }}
          </span>
        </template>
        {{ forgeName }}
      </NTooltip>
    </div>

    <!-- 右侧：任务所有者 -->
    <div class="shrink-0 text-sm text-gray-500 dark:text-gray-400">
      来自
      <span class="font-medium text-gray-700 dark:text-gray-300">
        {{ ownerName || '未知用户' }}
      </span>
      的分享
    </div>
  </div>
</template>
