<script setup lang="ts">
/**
 * MCP 卡片组件
 * 展示单个 MCP 的信息：名称、描述、来源标签、连接状态、创建时间
 * 标签逻辑：
 * - 内置（管理员创建 + 公开）
 * - 用户名（普通用户创建 + 公开）
 * - 私有（不公开）
 */
import { computed } from 'vue';
import { NTag, NIcon } from 'naive-ui';
import { LockClosedOutline, GlobeOutline, ShieldCheckmarkOutline } from '@vicons/ionicons5';
import { useUserStore } from '@/stores';
import type { MCP } from '@/types';

const props = defineProps<{
  mcp: MCP;
}>();

defineEmits<{
  click: [];
}>();

const userStore = useUserStore();

// 连接状态颜色
const statusColor = computed(() => {
  return props.mcp.status === 'connected' ? '#10b981' : '#ef4444';
});

// 连接状态文本
const statusText = computed(() => {
  return props.mcp.status === 'connected' ? '连通成功' : '连通失败';
});

// 来源标签配置
// - 内置：管理员创建 + 公开
// - 用户名：普通用户创建 + 公开
// - 私有：不公开
const sourceConfig = computed(() => {
  const { source, isPublic, user, userId } = props.mcp;

  if (!isPublic) {
    // 私有 MCP
    return {
      text: '私有',
      icon: LockClosedOutline,
      type: 'default' as const,
    };
  }

  if (source === 'builtin') {
    // 管理员创建的公开 MCP
    return {
      text: '内置',
      icon: ShieldCheckmarkOutline,
      type: 'success' as const,
    };
  }

  // 普通用户创建的公开 MCP
  // 如果是当前用户创建的，显示"我的"
  if (userId === userStore.userInfo?.id) {
    return {
      text: '我的',
      icon: GlobeOutline,
      type: 'info' as const,
    };
  }

  // 其他用户创建的，显示用户名
  return {
    text: user?.nickname || '其他用户',
    icon: GlobeOutline,
    type: 'warning' as const,
  };
});

// 格式化创建时间
const formattedTime = computed(() => {
  const date = new Date(props.mcp.createdAt);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
});
</script>

<template>
  <div
    class="hover:border-primary-300 dark:bg-dark-700 dark:hover:border-primary-500/50 cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-md dark:border-white/10"
    @click="$emit('click')"
  >
    <!-- 头部：状态点 + 名称 -->
    <div class="mb-2 flex items-start gap-2">
      <span
        class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        :style="{ backgroundColor: statusColor }"
        :title="statusText"
      ></span>
      <h3 class="text-theme flex-1 truncate text-sm font-medium">{{ mcp.name }}</h3>
    </div>

    <!-- 来源标签 + 创建时间 -->
    <div class="mb-3 flex items-center gap-2">
      <NTag size="small" :type="sourceConfig.type" round>
        <template #icon>
          <NIcon :component="sourceConfig.icon" :size="12" />
        </template>
        {{ sourceConfig.text }}
      </NTag>
      <span class="text-theme-muted text-xs">{{ formattedTime }}</span>
    </div>

    <!-- 描述 -->
    <p class="text-theme-secondary line-clamp-2 text-xs">
      {{ mcp.description || '暂无描述' }}
    </p>
  </div>
</template>
