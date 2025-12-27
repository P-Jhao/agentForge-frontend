<script setup lang="ts">
/**
 * 轮次结束操作栏组件
 * 显示复制、点赞/踩、完成时间、累积 token 消耗
 */
import { computed } from 'vue';
import { NButton, NTooltip, NIcon } from 'naive-ui';
import { CopyOutline, ThumbsUpOutline, ThumbsDownOutline } from '@vicons/ionicons5';
import type { TurnEndMessageData } from '@/composable/task/useChat';

const props = defineProps<{
  data: TurnEndMessageData;
}>();

// 格式化时间（MM-DD HH:mm:ss）
const formattedTime = computed(() => {
  try {
    const date = new Date(props.data.completedAt);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return '--';
  }
});

// 格式化 token 数字（千分位）
const formattedTokens = computed(() => {
  const total = props.data.accumulatedTokens?.totalTokens ?? 0;
  return total.toLocaleString('zh-CN');
});

// 复制功能（占位）
const handleCopy = () => {
  console.log('[TurnEndBar] 复制按钮点击');
  // TODO: 实现复制此次对话所有内容
};

// 点赞功能（占位）
const handleThumbsUp = () => {
  console.log('[TurnEndBar] 点赞按钮点击');
  // TODO: 实现点赞反馈
};

// 踩功能（占位）
const handleThumbsDown = () => {
  console.log('[TurnEndBar] 踩按钮点击');
  // TODO: 实现踩反馈
};
</script>

<template>
  <div
    class="turn-end-bar mt-2 inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500"
  >
    <!-- 操作按钮组 -->
    <NTooltip trigger="hover">
      <template #trigger>
        <NButton quaternary size="tiny" class="action-btn" @click="handleCopy">
          <template #icon>
            <NIcon :component="CopyOutline" :size="14" />
          </template>
        </NButton>
      </template>
      复制对话
    </NTooltip>

    <NTooltip trigger="hover">
      <template #trigger>
        <NButton quaternary size="tiny" class="action-btn" @click="handleThumbsUp">
          <template #icon>
            <NIcon :component="ThumbsUpOutline" :size="14" />
          </template>
        </NButton>
      </template>
      有帮助
    </NTooltip>

    <NTooltip trigger="hover">
      <template #trigger>
        <NButton quaternary size="tiny" class="action-btn" @click="handleThumbsDown">
          <template #icon>
            <NIcon :component="ThumbsDownOutline" :size="14" />
          </template>
        </NButton>
      </template>
      没帮助
    </NTooltip>

    <!-- 分隔符 -->
    <span class="separator">|</span>

    <!-- 完成时间 -->
    <span>{{ formattedTime }}</span>

    <!-- 分隔符 -->
    <span class="separator">|</span>

    <!-- Token 消耗 -->
    <span>累积 {{ formattedTokens }} tokens</span>
  </div>
</template>

<style scoped>
.turn-end-bar {
  opacity: 0.7;
}

.turn-end-bar:hover {
  opacity: 1;
}

.separator {
  margin: 0 4px;
  color: #d1d5db;
}

.action-btn {
  padding: 2px 4px !important;
  min-width: auto !important;
}

:deep(.n-button) {
  --n-text-color: inherit !important;
  --n-text-color-hover: #666 !important;
}
</style>
