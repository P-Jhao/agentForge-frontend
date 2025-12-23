<script setup lang="ts">
/**
 * 专家分析消息卡片组件
 * 用于渲染 expert 类型的消息
 * 显示三位专家（清晰度、完整性、创意）的分析视角
 * 流式输出时展开，结束后自动折叠（与深度思考一致）
 */
import { ref, computed, watch } from 'vue';
import { NIcon, NSpin, NTag } from 'naive-ui';
import { PeopleOutline, ChevronDown, ChevronUp } from '@vicons/ionicons5';
import EMarkdown from '@/components/EMarkdown.vue';
import { useThemeStore } from '@/stores';
import type { TextMessageData } from '@/composable/task/useChat';

const props = defineProps<{
  data: TextMessageData;
}>();

const themeStore = useThemeStore();

// 专家视角标签
const expertTags = [
  { label: '清晰度专家', color: '#3b82f6' },
  { label: '完整性专家', color: '#10b981' },
  { label: '创意专家', color: '#f59e0b' },
];

// 是否手动展开（用户点击控制）
const manualExpanded = ref<boolean | null>(null);

// 实际展开状态：流式输出时强制展开，否则看用户手动控制
const isExpanded = computed(() => {
  // 如果用户手动控制过，优先使用用户的选择
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

// 切换展开状态
const toggleExpand = () => {
  manualExpanded.value = !isExpanded.value;
};

// 是否显示加载状态
const showLoading = computed(() => !props.data.content);

// 容器样式
const containerClass = computed(() => {
  const base = 'max-w-full rounded-lg border p-3 cursor-pointer transition-colors';
  if (themeStore.isDark) {
    return `${base} border-purple-800 bg-purple-900/20 hover:bg-purple-900/30`;
  }
  return `${base} border-purple-200 bg-purple-50 hover:bg-purple-100`;
});
</script>

<template>
  <div :class="containerClass" @click="toggleExpand">
    <!-- 头部：图标 + 标题 + 专家标签 + 展开/收起图标 -->
    <div class="flex items-center gap-2">
      <NIcon :component="PeopleOutline" :size="18" class="text-purple-500" />
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ data.isStreaming ? '专家分析中...' : '多角度专家分析' }}
      </span>
      <NSpin v-if="data.isStreaming" :size="14" class="ml-1" />
      <!-- 展开/收起图标 -->
      <NIcon
        :component="isExpanded ? ChevronUp : ChevronDown"
        :size="14"
        class="ml-auto opacity-50"
      />
    </div>

    <!-- 专家视角标签（始终显示） -->
    <div class="mt-2 flex flex-wrap gap-1.5">
      <NTag v-for="tag in expertTags" :key="tag.label" :color="{ color: tag.color }" size="small">
        <span class="text-white">{{ tag.label }}</span>
      </NTag>
    </div>

    <!-- 内容区域（展开时显示，带过渡动画） -->
    <Transition name="expand">
      <div
        v-if="isExpanded"
        class="mt-3 border-t border-purple-200 pt-3 text-sm text-gray-600 dark:border-purple-700 dark:text-gray-400"
      >
        <NSpin v-if="showLoading" size="small" />
        <EMarkdown
          v-else
          :model-value="data.content"
          mode="preview"
          :editor-id="`expert-${data.id}`"
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
