<script setup lang="ts">
/**
 * 聊天加载状态组件
 * 展示 AI 正在生成回复的加载动画
 * 使用 CSS 类自动适配深浅主题
 */
import { computed } from 'vue';
import { NSpin, NAvatar } from 'naive-ui';
import type { TaskForge } from '@/types';

interface Props {
  // 关联的 Forge 信息（用于显示 AI 头像）
  forge?: TaskForge | null;
}

const props = withDefaults(defineProps<Props>(), {
  forge: null,
});

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
</script>

<template>
  <div class="flex gap-3">
    <!-- 头像 -->
    <div
      class="avatar-ai flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full"
    >
      <!-- 优先显示 Forge 头像，否则显示默认头像 -->
      <NAvatar :src="forgeAvatarUrl || '/favicon660x660.png'" :size="32" round object-fit="cover" />
    </div>

    <!-- 加载动画 -->
    <div class="bubble-ai rounded-2xl px-4 py-3">
      <NSpin size="small" />
    </div>
  </div>
</template>
