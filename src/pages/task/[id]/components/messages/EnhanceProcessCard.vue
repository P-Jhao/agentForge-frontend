<script setup lang="ts">
/**
 * 增强过程消息卡片组件
 * 用于渲染 reviewer（审查者）和 questioner（提问者）类型的消息
 * 带有对应的图标和样式
 * 流式输出时展开，结束后自动折叠（与深度思考一致）
 */
import { ref, computed, watch } from 'vue';
import { NIcon, NSpin } from 'naive-ui';
import { SearchOutline, HelpCircleOutline, ChevronDown, ChevronUp } from '@vicons/ionicons5';
import EMarkdown from '@/components/EMarkdown.vue';
import type { TextMessageData } from '@/composable/task/useChat';

const props = defineProps<{
  data: TextMessageData;
}>();

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
      hoverBgColor: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
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
    hoverBgColor: 'hover:bg-amber-100 dark:hover:bg-amber-900/30',
  };
});

// 是否支持折叠（只有 reviewer 类型支持折叠，questioner 始终展开）
const canCollapse = computed(() => props.data.type === 'reviewer');

// 是否手动展开（用户点击控制）
const manualExpanded = ref<boolean | null>(null);

// 实际展开状态
const isExpanded = computed(() => {
  // questioner 类型始终展开
  if (!canCollapse.value) {
    return true;
  }
  // reviewer 类型：如果用户手动控制过，优先使用用户的选择
  if (manualExpanded.value !== null) {
    return manualExpanded.value;
  }
  // 否则根据流式状态决定：流式中展开，结束后折叠
  return props.data.isStreaming ?? false;
});

// 监听流式状态变化，当从 true 变为 false 时重置手动状态
watch(
  () => props.data.isStreaming,
  (newVal, oldVal) => {
    if (oldVal === true && newVal === false) {
      // 流式结束，重置手动状态，让它自动折叠
      manualExpanded.value = null;
    }
  }
);

// 切换展开状态（只有 reviewer 类型可以切换）
const toggleExpand = () => {
  if (canCollapse.value) {
    manualExpanded.value = !isExpanded.value;
  }
};

// 是否显示加载状态
const showLoading = computed(() => !props.data.content);

// 容器样式
const containerClass = computed(() => {
  const base = 'max-w-full rounded-lg border p-3 transition-colors';
  const cursor = canCollapse.value ? 'cursor-pointer' : '';
  const hover = canCollapse.value ? config.value.hoverBgColor : '';
  return `${base} ${cursor} ${config.value.borderColor} ${config.value.bgColor} ${hover}`;
});
</script>

<template>
  <div :class="containerClass" @click="toggleExpand">
    <!-- 头部：图标 + 标题 + 展开/收起图标 -->
    <div class="flex items-center gap-2">
      <NIcon :component="config.icon" :size="18" :class="config.color" />
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ data.isStreaming ? config.streamingTitle : config.title }}
      </span>
      <NSpin v-if="data.isStreaming" :size="14" class="ml-1" />
      <!-- 展开/收起图标（只有 reviewer 类型显示） -->
      <NIcon
        v-if="canCollapse"
        :component="isExpanded ? ChevronUp : ChevronDown"
        :size="14"
        class="ml-auto opacity-50"
      />
    </div>

    <!-- 内容区域（展开时显示，带过渡动画） -->
    <Transition name="expand">
      <div
        v-if="isExpanded"
        class="mt-3 border-t pt-3 text-sm text-gray-600 dark:text-gray-400"
        :class="config.borderColor"
      >
        <NSpin v-if="showLoading" size="small" />
        <EMarkdown
          v-else
          :model-value="data.content"
          mode="preview"
          :editor-id="`enhance-${data.id}`"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 展开/收起过渡动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 1000px;
}
</style>
