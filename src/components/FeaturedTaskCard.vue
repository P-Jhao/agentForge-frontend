<script setup lang="ts">
/**
 * 推荐示例卡片组件
 * 展示推荐示例，hover 时显示操作按钮
 */
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { NButton } from 'naive-ui';
import type { FeaturedTask } from '@/types';

const props = defineProps<{
  featured: FeaturedTask;
}>();

const router = useRouter();

// 默认封面图（使用现有的 favicon）
const defaultCover = '/favicon660x660nobackground.png';

// 封面图 URL
const coverUrl = computed(() => {
  if (!props.featured.coverImage) return defaultCover;
  if (props.featured.coverImage.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE || '';
    const baseUrl = apiBase.replace(/\/api$/, '');
    return `${baseUrl}${props.featured.coverImage}`;
  }
  return props.featured.coverImage;
});

// 查看回放
function handleReplay() {
  router.push(`/task/${props.featured.taskUuid}/replay`);
}

// 一键做同款
function handleClone() {
  console.log('一键做同款:', props.featured.taskUuid, props.featured.title);
}
</script>

<template>
  <div
    class="card-theme-gradient group relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-lg"
  >
    <!-- 封面图区域 -->
    <div class="relative aspect-16/10 overflow-hidden">
      <img
        :src="coverUrl"
        :alt="featured.title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        @error="($event.target as HTMLImageElement).src = defaultCover"
      />
      <!-- hover 遮罩和按钮 -->
      <div
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
      >
        <NButton
          type="default"
          round
          class="bg-white! text-gray-800! hover:bg-gray-100!"
          @click.stop="handleReplay"
        >
          查看回放
        </NButton>
        <NButton type="primary" round @click.stop="handleClone">一键做同款</NButton>
      </div>
    </div>
    <!-- 内容区域 -->
    <div class="p-4">
      <h3 class="text-theme mb-1 truncate text-base font-medium">
        {{ featured.title }}
      </h3>
      <p v-if="featured.description" class="text-theme-secondary truncate text-sm">
        {{ featured.description }}
      </p>
      <p v-else class="text-theme-muted truncate text-sm">
        {{ featured.task?.title || '暂无描述' }}
      </p>
    </div>
  </div>
</template>
