<script setup lang="ts">
/**
 * 任务对话页面头部
 * 展示 Forge 信息或默认信息，以及收藏按钮
 */
import { computed } from 'vue';
import { NAvatar, NButton, NIcon } from 'naive-ui';
import { StarOutline, Star } from '@vicons/ionicons5';
import { useThemeStore, useTaskStore } from '@/stores';

const themeStore = useThemeStore();
const taskStore = useTaskStore();

// 当前任务
const currentTask = computed(() => taskStore.currentTask);

// 当前任务关联的 Forge 信息
const forge = computed(() => currentTask.value?.agent || null);

// 是否已收藏
const isFavorite = computed(() => currentTask.value?.favorite || false);

// 获取 Forge 头像完整 URL
const forgeAvatarUrl = computed(() => {
  if (!forge.value?.avatar) return '';
  if (forge.value.avatar.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE || '';
    const baseUrl = apiBase.replace(/\/api$/, '');
    return `${baseUrl}${forge.value.avatar}`;
  }
  return forge.value.avatar;
});

// 显示的名称
const displayName = computed(() => forge.value?.displayName || 'AgentForge');

// 切换收藏状态
const handleToggleFavorite = async () => {
  if (!currentTask.value) return;
  await taskStore.toggleFavorite(currentTask.value.uuid);
};

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
  <div class="flex items-center border-b px-6 py-3" :class="headerClass">
    <!-- 头像 -->
    <NAvatar
      :src="forgeAvatarUrl || '/favicon660x660nobackground.png'"
      :size="36"
      round
      object-fit="cover"
    />
    <!-- 名称 -->
    <span class="ml-3 font-medium" :class="titleClass">{{ displayName }}</span>
    <!-- 收藏按钮（紧跟名称，稍有间隔） -->
    <NButton
      v-if="currentTask"
      quaternary
      circle
      size="small"
      class="ml-2"
      @click="handleToggleFavorite"
    >
      <template #icon>
        <NIcon :size="18" :class="isFavorite ? 'text-yellow-500' : ''">
          <Star v-if="isFavorite" />
          <StarOutline v-else />
        </NIcon>
      </template>
    </NButton>
  </div>
</template>
