<script setup lang="ts">
/**
 * 思考消息组件
 * DeepSeek 风格，可折叠展开
 * 流式输出时展开，结束后自动折叠
 * 使用 Markdown 渲染内容
 */
import { ref, computed, watch } from 'vue';
import { NIcon } from 'naive-ui';
import { ChevronDown, ChevronUp } from '@vicons/ionicons5';
import EMarkdown from '@/components/EMarkdown.vue';
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
      <iconpark-icon name="smart-optimization" size="16" class="text-primary-500" />

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

    <!-- 思考内容（展开时显示，使用 Markdown 渲染） -->
    <Transition name="expand">
      <div
        v-if="isExpanded"
        class="thinking-content mt-2 border-t border-gray-200 pt-2 dark:border-gray-700"
      >
        <EMarkdown :model-value="data.content" mode="preview" :editor-id="`thinking-${data.id}`" />
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
  max-height: 2000px;
}
</style>

<!-- 思考内容样式 - 非 scoped，确保能覆盖 md-editor 的样式 -->
<style>
/* 思考内容样式 - 更灰、更小，与正常聊天区分 */
.thinking-content {
  transition: all 0.2s ease;
}

.thinking-content .md-editor-preview-wrapper,
.thinking-content .md-editor-preview,
.thinking-content .md-preview-wrapper,
.thinking-content .md-preview {
  font-size: 12px !important;
  line-height: 1.6 !important;
  color: rgb(156 163 175) !important;
  transition: color 0.2s ease;
}

.thinking-content .md-editor-preview p,
.thinking-content .md-editor-preview li,
.thinking-content .md-preview p,
.thinking-content .md-preview li {
  font-size: 12px !important;
  color: rgb(156 163 175) !important;
  margin: 6px 0 !important;
  transition: color 0.2s ease;
}

.thinking-content .md-editor-preview h1,
.thinking-content .md-editor-preview h2,
.thinking-content .md-editor-preview h3,
.thinking-content .md-editor-preview h4,
.thinking-content .md-editor-preview h5,
.thinking-content .md-editor-preview h6,
.thinking-content .md-preview h1,
.thinking-content .md-preview h2,
.thinking-content .md-preview h3,
.thinking-content .md-preview h4,
.thinking-content .md-preview h5,
.thinking-content .md-preview h6 {
  font-size: 13px !important;
  color: rgb(107 114 128) !important;
  margin-top: 12px !important;
  margin-bottom: 6px !important;
  transition: color 0.2s ease;
}

.thinking-content .md-editor-preview strong,
.thinking-content .md-preview strong {
  color: rgb(107 114 128) !important;
  transition: color 0.2s ease;
}

.thinking-content .md-editor-preview code,
.thinking-content .md-preview code {
  font-size: 11px !important;
  background: rgba(0, 0, 0, 0.05) !important;
  color: rgb(107 114 128) !important;
}

.thinking-content .md-editor-preview pre,
.thinking-content .md-preview pre {
  font-size: 11px !important;
  background: rgba(0, 0, 0, 0.03) !important;
}

.thinking-content .md-editor-preview hr,
.thinking-content .md-preview hr {
  border-color: rgb(229 231 235) !important;
  margin: 12px 0 !important;
}

.thinking-content .md-editor-preview blockquote,
.thinking-content .md-preview blockquote {
  font-size: 12px !important;
  color: rgb(156 163 175) !important;
  border-left-color: rgb(209 213 219) !important;
}

/* Hover 效果 - 变清晰 */
.thinking-content:hover .md-editor-preview-wrapper,
.thinking-content:hover .md-editor-preview,
.thinking-content:hover .md-preview-wrapper,
.thinking-content:hover .md-preview,
.thinking-content:hover .md-editor-preview p,
.thinking-content:hover .md-editor-preview li,
.thinking-content:hover .md-preview p,
.thinking-content:hover .md-preview li,
.thinking-content:hover .md-editor-preview blockquote,
.thinking-content:hover .md-preview blockquote {
  color: rgb(75 85 99) !important;
}

.thinking-content:hover .md-editor-preview h1,
.thinking-content:hover .md-editor-preview h2,
.thinking-content:hover .md-editor-preview h3,
.thinking-content:hover .md-editor-preview h4,
.thinking-content:hover .md-editor-preview h5,
.thinking-content:hover .md-editor-preview h6,
.thinking-content:hover .md-preview h1,
.thinking-content:hover .md-preview h2,
.thinking-content:hover .md-preview h3,
.thinking-content:hover .md-preview h4,
.thinking-content:hover .md-preview h5,
.thinking-content:hover .md-preview h6,
.thinking-content:hover .md-editor-preview strong,
.thinking-content:hover .md-preview strong {
  color: rgb(31 41 55) !important;
}

/* 深色模式 */
html.dark .thinking-content .md-editor-preview-wrapper,
html.dark .thinking-content .md-editor-preview,
html.dark .thinking-content .md-preview-wrapper,
html.dark .thinking-content .md-preview,
html.dark .thinking-content .md-editor-preview p,
html.dark .thinking-content .md-editor-preview li,
html.dark .thinking-content .md-preview p,
html.dark .thinking-content .md-preview li {
  color: rgb(107 114 128) !important;
}

html.dark .thinking-content .md-editor-preview h1,
html.dark .thinking-content .md-editor-preview h2,
html.dark .thinking-content .md-editor-preview h3,
html.dark .thinking-content .md-editor-preview h4,
html.dark .thinking-content .md-editor-preview h5,
html.dark .thinking-content .md-editor-preview h6,
html.dark .thinking-content .md-preview h1,
html.dark .thinking-content .md-preview h2,
html.dark .thinking-content .md-preview h3,
html.dark .thinking-content .md-preview h4,
html.dark .thinking-content .md-preview h5,
html.dark .thinking-content .md-preview h6,
html.dark .thinking-content .md-editor-preview strong,
html.dark .thinking-content .md-preview strong {
  color: rgb(156 163 175) !important;
}

html.dark .thinking-content .md-editor-preview code,
html.dark .thinking-content .md-preview code {
  background: rgba(255, 255, 255, 0.05) !important;
  color: rgb(156 163 175) !important;
}

html.dark .thinking-content .md-editor-preview pre,
html.dark .thinking-content .md-preview pre {
  background: rgba(255, 255, 255, 0.03) !important;
}

html.dark .thinking-content .md-editor-preview hr,
html.dark .thinking-content .md-preview hr {
  border-color: rgb(55 65 81) !important;
}

html.dark .thinking-content .md-editor-preview blockquote,
html.dark .thinking-content .md-preview blockquote {
  border-left-color: rgb(75 85 99) !important;
}

/* 深色模式 Hover 效果 */
html.dark .thinking-content:hover .md-editor-preview-wrapper,
html.dark .thinking-content:hover .md-editor-preview,
html.dark .thinking-content:hover .md-preview-wrapper,
html.dark .thinking-content:hover .md-preview,
html.dark .thinking-content:hover .md-editor-preview p,
html.dark .thinking-content:hover .md-editor-preview li,
html.dark .thinking-content:hover .md-preview p,
html.dark .thinking-content:hover .md-preview li,
html.dark .thinking-content:hover .md-editor-preview blockquote,
html.dark .thinking-content:hover .md-preview blockquote {
  color: rgb(209 213 219) !important;
}

html.dark .thinking-content:hover .md-editor-preview h1,
html.dark .thinking-content:hover .md-editor-preview h2,
html.dark .thinking-content:hover .md-editor-preview h3,
html.dark .thinking-content:hover .md-editor-preview h4,
html.dark .thinking-content:hover .md-editor-preview h5,
html.dark .thinking-content:hover .md-editor-preview h6,
html.dark .thinking-content:hover .md-preview h1,
html.dark .thinking-content:hover .md-preview h2,
html.dark .thinking-content:hover .md-preview h3,
html.dark .thinking-content:hover .md-preview h4,
html.dark .thinking-content:hover .md-preview h5,
html.dark .thinking-content:hover .md-preview h6,
html.dark .thinking-content:hover .md-editor-preview strong,
html.dark .thinking-content:hover .md-preview strong {
  color: rgb(243 244 246) !important;
}
</style>
