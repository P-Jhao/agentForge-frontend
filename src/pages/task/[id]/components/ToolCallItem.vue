<script setup lang="ts">
/**
 * 工具调用展示组件
 * 显示工具调用的状态，点击可查看 Markdown 格式的结果摘要
 */
import { ref, computed } from 'vue';
import { NIcon, NSpin } from 'naive-ui';
import { CheckmarkCircle, CloseCircle } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';
import ToolResultModal from './ToolResultModal.vue';

// 工具调用状态
export type ToolCallStatus = 'running' | 'success' | 'failed';

interface Props {
  callId: string;
  toolName: string;
  status: ToolCallStatus;
  success: boolean;
  summarizedResult?: string;
}

const props = defineProps<Props>();

const themeStore = useThemeStore();

// 弹窗显示状态
const showModal = ref(false);

// 点击打开结果弹窗
const handleClick = () => {
  // 只有完成状态才能打开弹窗
  if (props.status !== 'running') {
    showModal.value = true;
  }
};

// 容器样式 - iMessage 风格
const containerClass = computed(() => {
  const base = 'px-3 py-2 text-sm cursor-pointer transition-colors';
  const borderRadius = 'rounded-[18px] rounded-tl-[4px]';
  if (themeStore.isDark) {
    return `${base} ${borderRadius} tool-call-dark`;
  }
  return `${base} ${borderRadius} bg-white hover:bg-gray-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)]`;
});

// 状态图标颜色
const statusColor = computed(() => {
  switch (props.status) {
    case 'success':
      return '#22c55e'; // green-500
    case 'failed':
      return '#ef4444'; // red-500
    default:
      return undefined;
  }
});
</script>

<template>
  <div :class="containerClass" @click="handleClick">
    <!-- 头部：状态图标 + 工具名 -->
    <div class="flex items-center gap-2">
      <!-- 状态图标 -->
      <NSpin v-if="status === 'running'" :size="14" />
      <NIcon
        v-else-if="status === 'success'"
        :component="CheckmarkCircle"
        :size="16"
        :color="statusColor"
      />
      <NIcon v-else :component="CloseCircle" :size="16" :color="statusColor" />

      <!-- 工具名称 -->
      <span class="font-medium">调用工具: {{ toolName }}</span>

      <!-- 运行中提示 -->
      <span v-if="status === 'running'" class="text-xs opacity-60">运行中...</span>

      <!-- 点击查看提示 -->
      <span v-else class="ml-auto text-xs opacity-50">点击查看结果</span>
    </div>
  </div>

  <!-- 结果弹窗 -->
  <ToolResultModal
    v-model:show="showModal"
    :tool-name="toolName"
    :success="success"
    :summarized-result="summarizedResult"
  />
</template>

<style scoped>
/* 深色模式工具调用样式 */
.tool-call-dark {
  background: linear-gradient(135deg, rgba(97, 114, 243, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%);
  border: 1px solid rgba(97, 114, 243, 0.25);
  box-shadow:
    0 0 12px rgba(97, 114, 243, 0.1),
    0 0 24px rgba(97, 114, 243, 0.05);
}

.tool-call-dark:hover {
  background: linear-gradient(135deg, rgba(97, 114, 243, 0.18) 0%, rgba(168, 85, 247, 0.12) 100%);
  border-color: rgba(97, 114, 243, 0.35);
}
</style>
