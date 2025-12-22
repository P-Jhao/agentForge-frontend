<script setup lang="ts">
/**
 * 思考消息组件
 * DeepSeek 风格，可折叠展开
 * 流式输出时展开，结束后自动折叠
 */
import { ref, computed, watch } from 'vue';
import { NIcon } from 'naive-ui';
import { ChevronDown, ChevronUp, SparklesOutline } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';
import type { TextMessageData } from '@/composable/task/useChat';

const props = defineProps<{
  data: TextMessageData;
}>();

const themeStore = useThemeStore();

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

// 容器样式
const containerClass = computed(() => {
  const base = 'px-3 py-2 text-sm cursor-pointer transition-colors rounded-[18px] rounded-tl-[4px]';
  if (themeStore.isDark) {
    return `${base} bg-gray-800 hover:bg-gray-700`;
  }
  return `${base} bg-white hover:bg-gray-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)]`;
});
</script>

<template>
  <div :class="containerClass" @click="toggleExpand">
    <!-- 头部：图标 + 标题 -->
    <div class="flex items-center gap-2">
      <!-- 思考图标 -->
      <NIcon :component="SparklesOutline" :size="16" class="text-primary-500" />

      <!-- 标题 -->
      <span class="font-medium text-gray-600 dark:text-gray-400">
        {{ data.isStreaming ? '思考中...' : '已思考' }}
      </span>

      <!-- 展开/收起图标 -->
      <NIcon
        :component="isExpanded ? ChevronUp : ChevronDown"
        :size="14"
        class="ml-auto opacity-50"
      />
    </div>

    <!-- 思考内容（展开时显示） -->
    <div v-if="isExpanded" class="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
      <p class="text-sm whitespace-pre-wrap text-gray-500 dark:text-gray-400">
        {{ data.content }}
      </p>
    </div>
  </div>
</template>
