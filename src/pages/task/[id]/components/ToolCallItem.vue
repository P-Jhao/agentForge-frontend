<script setup lang="ts">
/**
 * 工具调用展示组件
 * 显示工具调用的状态，点击可查看 Markdown 格式的结果摘要
 * 支持显示输出文件卡片
 */
import { ref, computed } from 'vue';
import { NIcon, NSpin } from 'naive-ui';
import { CheckmarkCircle, CloseCircle } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';
import ToolResultModal from './ToolResultModal.vue';
import OutputFileCard from './OutputFileCard.vue';
import type { OutputFileInfo } from '@/types';

// 工具调用状态
export type ToolCallStatus = 'running' | 'success' | 'failed';

interface Props {
  callId: string;
  toolName: string;
  status: ToolCallStatus;
  success: boolean;
  summarizedResult?: string;
  outputFiles?: OutputFileInfo[];
}

const props = defineProps<Props>();

const themeStore = useThemeStore();

// 弹窗显示状态
const showModal = ref(false);
// 弹窗模式
const modalMode = ref<'tool' | 'file'>('tool');
// 当前选中的文件（文件模式）
const selectedFile = ref<OutputFileInfo | null>(null);

// 点击工具调用项打开结果弹窗
const handleToolClick = () => {
  // 只有完成状态才能打开弹窗
  if (props.status !== 'running') {
    modalMode.value = 'tool';
    selectedFile.value = null;
    showModal.value = true;
  }
};

// 点击文件卡片打开文件预览弹窗
const handleFileClick = (file: OutputFileInfo) => {
  modalMode.value = 'file';
  selectedFile.value = file;
  showModal.value = true;
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

// 是否有输出文件
const hasOutputFiles = computed(() => {
  return props.outputFiles && props.outputFiles.length > 0;
});
</script>

<template>
  <div class="tool-call-wrapper">
    <!-- 工具调用主体 -->
    <div :class="containerClass" @click="handleToolClick">
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

    <!-- 输出文件卡片列表 -->
    <div v-if="hasOutputFiles" class="output-files-container">
      <OutputFileCard
        v-for="file in outputFiles"
        :key="file.path"
        :file="file"
        @click="handleFileClick"
      />
    </div>
  </div>

  <!-- 结果/文件预览弹窗 -->
  <ToolResultModal
    v-model:show="showModal"
    :mode="modalMode"
    :tool-name="toolName"
    :success="success"
    :summarized-result="summarizedResult"
    :file="selectedFile || undefined"
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

/* 工具调用包装器 */
.tool-call-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 输出文件容器 */
.output-files-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 4px;
}
</style>
