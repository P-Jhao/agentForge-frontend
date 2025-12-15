<script setup lang="ts">
/**
 * MCP 卡片组件
 * 展示单个 MCP 的信息
 */
import { computed } from 'vue';
import { NTag, NIcon } from 'naive-ui';
import { PersonOutline, CloudOutline } from '@vicons/ionicons5';
import type { McpItem } from '@/mocks/mcp';

const props = defineProps<{
  mcp: McpItem;
}>();

// 状态颜色
const statusColor = computed(() => {
  return props.mcp.status === 'online' ? '#10b981' : '#ef4444';
});

// 来源标签配置
const sourceConfig = computed(() => {
  const configs = {
    official: { text: '官方', type: 'info' as const },
    community: { text: '云端', type: 'success' as const },
    custom: { text: '自定义', type: 'warning' as const },
  };
  return configs[props.mcp.source];
});

// 显示的工具数量（最多显示3个）
const displayTools = computed(() => props.mcp.tools.slice(0, 3));
const moreToolsCount = computed(() => Math.max(0, props.mcp.tools.length - 3));
</script>

<template>
  <div
    class="hover:border-primary-300 dark:bg-dark-700 dark:hover:border-primary-500/50 rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-md dark:border-white/10"
  >
    <!-- 头部：状态点 + 名称 -->
    <div class="mb-2 flex items-start gap-2">
      <span
        class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        :style="{ backgroundColor: statusColor }"
      ></span>
      <h3 class="text-theme flex-1 truncate text-sm font-medium">{{ mcp.name }}</h3>
    </div>

    <!-- 作者 + 来源标签 -->
    <div class="mb-3 flex items-center gap-2">
      <div class="text-theme-muted flex items-center gap-1 text-xs">
        <NIcon :component="PersonOutline" :size="12" />
        <span>{{ mcp.author }}</span>
      </div>
      <NTag size="small" :type="sourceConfig.type" round>
        <template #icon>
          <NIcon :component="CloudOutline" :size="12" />
        </template>
        {{ sourceConfig.text }}
      </NTag>
    </div>

    <!-- 描述 -->
    <p class="text-theme-secondary mb-3 line-clamp-2 text-xs">{{ mcp.description }}</p>

    <!-- 工具列表 -->
    <div class="flex flex-wrap gap-1">
      <span
        v-for="tool in displayTools"
        :key="tool"
        class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-white/10 dark:text-gray-300"
      >
        {{ tool }}
      </span>
      <span
        v-if="moreToolsCount > 0"
        class="bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400 rounded px-2 py-0.5 text-xs"
      >
        +{{ moreToolsCount }}
      </span>
    </div>
  </div>
</template>
