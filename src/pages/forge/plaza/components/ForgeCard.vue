<script setup lang="ts">
/**
 * Forge 卡片组件
 * 展示单个 Forge 的信息
 */
import { computed } from 'vue';
import { NTag, NIcon, NButton } from 'naive-ui';
import { StarOutline, Star, FlameOutline } from '@vicons/ionicons5';
import type { Forge } from '@/types';

const props = defineProps<{
  forge: Forge;
}>();

const emit = defineEmits<{
  click: [];
  favorite: [favorite: boolean];
}>();

// 来源标签配置
const sourceConfig = computed(() => {
  return props.forge.source === 'builtin'
    ? { text: '内置', type: 'info' as const }
    : { text: '用户', type: 'success' as const };
});

// 格式化使用次数
const formattedUsageCount = computed(() => {
  const count = props.forge.usageCount;
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
});

// 处理收藏点击
const handleFavoriteClick = (e: Event) => {
  e.stopPropagation();
  emit('favorite', !props.forge.isFavorite);
};

// 获取头像完整 URL
const getAvatarUrl = (avatar: string | null) => {
  if (!avatar) return '';
  // 如果是相对路径，拼接 API 基础路径
  if (avatar.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE || '';
    // 移除 /api 前缀
    const baseUrl = apiBase.replace(/\/api$/, '');
    return `${baseUrl}${avatar}`;
  }
  return avatar;
};
</script>

<template>
  <div
    class="hover:border-primary-300 dark:bg-dark-700 dark:hover:border-primary-500/50 cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-md dark:border-white/10"
    @click="emit('click')"
  >
    <!-- 头部：头像 + 名称 + 收藏按钮 -->
    <div class="mb-3 flex items-start gap-3">
      <!-- 头像 -->
      <div
        class="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30"
      >
        <img
          v-if="forge.avatar"
          :src="getAvatarUrl(forge.avatar)"
          :alt="forge.displayName"
          class="h-full w-full object-cover"
        />
        <div v-else class="flex h-full w-full items-center justify-center text-2xl">🤖</div>
      </div>
      <!-- 名称和来源 -->
      <div class="min-w-0 flex-1">
        <h3 class="text-theme truncate font-medium">{{ forge.displayName }}</h3>
        <div class="mt-1 flex items-center gap-2">
          <NTag size="tiny" :type="sourceConfig.type" round>
            {{ sourceConfig.text }}
          </NTag>
          <span class="text-theme-muted flex items-center gap-1 text-xs">
            <NIcon :component="FlameOutline" :size="12" />
            {{ formattedUsageCount }}
          </span>
        </div>
      </div>
      <!-- 收藏按钮 -->
      <NButton
        quaternary
        circle
        size="small"
        :type="forge.isFavorite ? 'warning' : 'default'"
        @click="handleFavoriteClick"
      >
        <template #icon>
          <NIcon :component="forge.isFavorite ? Star : StarOutline" />
        </template>
      </NButton>
    </div>

    <!-- 描述 -->
    <p class="text-theme-secondary line-clamp-2 text-sm">
      {{ forge.description || '暂无描述' }}
    </p>
  </div>
</template>
