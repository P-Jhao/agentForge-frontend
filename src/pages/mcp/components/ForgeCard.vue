<script setup lang="ts">
/**
 * MCP 详情页 Forge 卡片组件
 * 展示关联的 Forge 信息
 * - 点击卡片跳转到 Forge 详情页
 * - 鼠标悬停时右上角显示"新建任务"文字链接
 */
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { NTag, NIcon } from 'naive-ui';
import { FlameOutline, CogOutline } from '@vicons/ionicons5';
import type { MCPAssociatedForge } from '@/types';

const props = defineProps<{
  forge: MCPAssociatedForge;
}>();

const router = useRouter();

// 鼠标悬停状态
const isHovered = ref(false);

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

// 点击卡片跳转到 Forge 详情页
function handleCardClick() {
  router.push(`/forge/${props.forge.id}`);
}

// 点击新建任务
function handleNewTask(e: Event) {
  e.stopPropagation();
  router.push(`/forge/${props.forge.id}/task`);
}
</script>

<template>
  <div
    class="forge-card hover:border-primary-300 dark:bg-dark-700 dark:hover:border-primary-500/50 relative cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-colors duration-200 hover:shadow-md dark:border-white/10"
    @click="handleCardClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- 头部：头像 + 名称 + 新建任务链接 -->
    <div class="mb-3 flex items-start gap-3">
      <!-- 头像 -->
      <div
        class="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30"
      >
        <img
          v-if="forge.avatar"
          :src="forge.avatar"
          :alt="forge.displayName"
          class="h-full w-full object-cover"
        />
        <div v-else class="text-theme-muted flex h-full w-full items-center justify-center">
          <NIcon :component="CogOutline" :size="24" />
        </div>
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
      <!-- 新建任务链接（悬停时显示） -->
      <span
        v-show="isHovered"
        class="text-primary-500 hover:text-primary-600 shrink-0 text-sm"
        @click="handleNewTask"
      >
        新建任务 &gt;
      </span>
    </div>

    <!-- 描述 -->
    <p class="text-theme-secondary line-clamp-2 text-sm">
      {{ forge.description || '暂无描述' }}
    </p>
  </div>
</template>
