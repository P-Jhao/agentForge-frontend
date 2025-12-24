<script setup lang="ts">
/**
 * 推荐示例卡片组件
 * 展示推荐示例，hover 时显示操作按钮
 * 使用 data-* 属性 + 事件委托处理点击
 */
import { computed } from 'vue';
import type { FeaturedTask } from '@/types';

const props = defineProps<{
  featured: FeaturedTask;
}>();

// 默认封面图（使用现有的 favicon）
const defaultCover = '/favicon660x660nobackground.png';

// 封面图 URL
const coverUrl = computed(() => {
  if (!props.featured.coverImage) return defaultCover;
  // coverImage 格式为 /uploads/images/xxx.png，需要加上 /api 前缀
  if (props.featured.coverImage.startsWith('/uploads')) {
    return `/api${props.featured.coverImage}`;
  }
  if (props.featured.coverImage.startsWith('/')) {
    return props.featured.coverImage;
  }
  return props.featured.coverImage;
});
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
        <button
          type="button"
          class="w-28 cursor-pointer rounded-full border-2 border-transparent bg-white px-4 py-2 text-center text-sm font-medium text-gray-800 transition-all hover:border-gray-300 hover:shadow-md"
          :data-replay="featured.taskUuid"
        >
          查看回放
        </button>
        <button
          type="button"
          class="bg-primary-500 hover:bg-primary-600 w-28 cursor-pointer rounded-full border-2 border-transparent px-4 py-2 text-center text-sm font-medium text-white transition-all hover:shadow-md"
          :data-clone="featured.clonePrompt || ''"
        >
          一键做同款
        </button>
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
    </div>
  </div>
</template>
