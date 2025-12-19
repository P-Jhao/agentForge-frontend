<script setup lang="ts">
/**
 * 工具调用展示组件
 * 显示工具调用的状态和结果
 */
import { ref, computed } from 'vue';
import { NIcon, NSpin } from 'naive-ui';
import { CheckmarkCircle, CloseCircle, ChevronDown, ChevronUp } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';

// 工具调用状态
export type ToolCallStatus = 'running' | 'success' | 'failed';

interface Props {
  callId: string;
  toolName: string;
  status: ToolCallStatus;
  arguments?: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

const props = defineProps<Props>();

const themeStore = useThemeStore();

// 是否展开详情
const expanded = ref(false);

// 切换展开状态
const toggleExpand = () => {
  // 只有完成状态才能展开
  if (props.status !== 'running') {
    expanded.value = !expanded.value;
  }
};

// 容器样式
const containerClass = computed(() => {
  const base = 'rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors';
  if (themeStore.isDark) {
    return `${base} bg-gray-700/50 hover:bg-gray-700`;
  }
  return `${base} bg-gray-100 hover:bg-gray-200`;
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

// 格式化结果显示
const formattedResult = computed(() => {
  if (props.error) {
    return props.error;
  }
  if (props.result === undefined || props.result === null) {
    return '无返回结果';
  }
  if (typeof props.result === 'string') {
    return props.result;
  }
  try {
    return JSON.stringify(props.result, null, 2);
  } catch {
    return String(props.result);
  }
});

// 格式化参数显示
const formattedArgs = computed(() => {
  if (!props.arguments || Object.keys(props.arguments).length === 0) {
    return '无参数';
  }
  try {
    return JSON.stringify(props.arguments, null, 2);
  } catch {
    return String(props.arguments);
  }
});
</script>

<template>
  <div :class="containerClass" @click="toggleExpand">
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

      <!-- 展开/收起图标 -->
      <NIcon
        v-if="status !== 'running'"
        :component="expanded ? ChevronUp : ChevronDown"
        :size="14"
        class="ml-auto opacity-50"
      />
    </div>

    <!-- 详情区域（展开时显示） -->
    <div v-if="expanded && status !== 'running'" class="mt-2 space-y-2">
      <!-- 参数 -->
      <div v-if="arguments && Object.keys(arguments).length > 0">
        <div class="mb-1 text-xs opacity-60">参数:</div>
        <pre
          class="overflow-x-auto rounded bg-black/10 p-2 text-xs whitespace-pre-wrap dark:bg-white/10"
        >{{ formattedArgs }}</pre
        >
      </div>

      <!-- 结果 -->
      <div>
        <div class="mb-1 text-xs opacity-60">{{ error ? '错误:' : '结果:' }}</div>
        <pre
          class="max-h-40 overflow-x-auto overflow-y-auto rounded p-2 text-xs whitespace-pre-wrap"
          :class="error ? 'bg-red-500/10 text-red-500' : 'bg-black/10 dark:bg-white/10'"
        >{{ formattedResult }}</pre
        >
      </div>
    </div>
  </div>
</template>
