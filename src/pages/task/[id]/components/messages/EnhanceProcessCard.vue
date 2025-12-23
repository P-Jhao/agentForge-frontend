<script setup lang="ts">
/**
 * 增强过程消息卡片组件
 * 用于渲染 reviewer（审查者）和 questioner（提问者）类型的消息
 * 带有对应的图标和样式
 */
import { computed } from 'vue';
import { NIcon, NSpin } from 'naive-ui';
import { SearchOutline, HelpCircleOutline } from '@vicons/ionicons5';
import EMarkdown from '@/components/EMarkdown.vue';
import { useThemeStore } from '@/stores';
import type { TextMessageData } from '@/composable/task/useChat';

const props = defineProps<{
  data: TextMessageData;
}>();

const themeStore = useThemeStore();

// 根据类型获取配置
const config = computed(() => {
  if (props.data.type === 'reviewer') {
    return {
      icon: SearchOutline,
      title: '审查分析',
      streamingTitle: '正在审查...',
      color: 'text-blue-500',
      borderColor: 'border-blue-200 dark:border-blue-800',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    };
  }
  // questioner
  return {
    icon: HelpCircleOutline,
    title: '澄清问题',
    streamingTitle: '正在生成问题...',
    color: 'text-amber-500',
    borderColor: 'border-amber-200 dark:border-amber-800',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  };
});

// 是否显示加载状态
const showLoading = computed(() => !props.data.content);

// 容器样式
const containerClass = computed(() => {
  const base = 'rounded-lg border p-3 transition-colors';
  return `${base} ${config.value.borderColor} ${config.value.bgColor}`;
});
</script>

<template>
  <div :class="containerClass" class="max-w-full">
    <!-- 头部：图标 + 标题 -->
    <div class="mb-2 flex items-center gap-2">
      <NIcon :component="config.icon" :size="18" :class="config.color" />
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ data.isStreaming ? config.streamingTitle : config.title }}
      </span>
      <NSpin v-if="data.isStreaming" :size="14" class="ml-1" />
    </div>

    <!-- 内容区域 -->
    <div class="text-sm text-gray-600 dark:text-gray-400">
      <NSpin v-if="showLoading" size="small" />
      <EMarkdown
        v-else
        :model-value="data.content"
        mode="preview"
        :editor-id="`enhance-${data.id}`"
      />
    </div>
  </div>
</template>
