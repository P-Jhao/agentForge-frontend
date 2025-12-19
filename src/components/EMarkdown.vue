<script setup lang="ts">
/**
 * EMarkdown - 基于 md-editor-v3 的 Markdown 编辑器组件
 * 简化版本，适用于 AgentForge 项目
 */
import { ref, computed, watch } from 'vue';
import { MdEditor, MdPreview } from 'md-editor-v3';
import type { ToolbarNames } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import { useThemeStore } from '@/stores';

// Props 定义
interface Props {
  modelValue?: string;
  mode?: 'edit' | 'preview';
  height?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  editorId?: string;
  // 工具栏排除项
  toolbarExclude?: Array<ToolbarNames>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  mode: 'edit',
  height: '300px',
  placeholder: '请输入 Markdown 内容...',
  disabled: false,
  readonly: false,
  editorId: 'e-markdown-editor',
  toolbarExclude: () => [],
});

// Emits 定义
const emit = defineEmits<{
  'update:modelValue': [value: string];
  save: [value: string, html: string];
  'html-changed': [html: string];
}>();

const themeStore = useThemeStore();

// 响应式数据
const content = ref(props.modelValue);

// 默认排除的工具栏项
const defaultExclude: ToolbarNames[] = [
  'save',
  'htmlPreview',
  'github',
  'image',
  'fullscreen',
  'pageFullscreen',
  'catalog',
  'mermaid',
  'katex',
];

// 计算工具栏排除项
const computedToolbarExclude = computed(() => {
  return [...defaultExclude, ...props.toolbarExclude] as ToolbarNames[];
});

// 计算属性
const previewOnly = computed(() => props.mode === 'preview');
const currentTheme = computed(() => (themeStore.isDark ? 'dark' : 'light'));

// 监听器
watch(
  () => props.modelValue,
  (newValue) => {
    content.value = newValue;
  }
);

watch(content, (newValue) => {
  emit('update:modelValue', newValue);
});

// 事件处理器
const handleSave = (value: string, html: Promise<string>) => {
  html.then((htmlContent) => {
    emit('save', value, htmlContent);
  });
};

const handleHtmlChanged = (html: string) => {
  emit('html-changed', html);
};
</script>

<template>
  <div class="e-markdown" :class="{ 'preview-only': previewOnly }">
    <!-- 编辑模式 -->
    <MdEditor
      v-if="!previewOnly"
      v-model="content"
      :theme="currentTheme"
      :editor-id="editorId"
      preview-theme="github"
      language="zh-CN"
      :style="{ height }"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :no-mermaid="true"
      :no-katex="true"
      code-theme="github"
      :toolbars-exclude="computedToolbarExclude"
      @on-save="handleSave"
      @on-html-changed="handleHtmlChanged"
    />

    <!-- 仅预览模式 -->
    <MdPreview
      v-else
      :editor-id="editorId"
      :model-value="content"
      :theme="currentTheme"
      preview-theme="github"
      language="zh-CN"
      :no-mermaid="true"
      :no-katex="true"
      code-theme="github"
    />
  </div>
</template>

<style scoped>
.e-markdown {
  position: relative;
  width: 100%;
}

/* 编辑器基础样式 */
:deep(.md-editor) {
  border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
}

.dark :deep(.md-editor) {
  border-color: rgba(75, 85, 99, 0.5);
}

/* 工具栏样式 */
:deep(.md-editor-toolbar) {
  border-radius: 8px 8px 0 0;
}

/* 编辑区域样式 */
:deep(.md-editor-input-wrapper) {
  border-radius: 0 0 8px 8px;
}

/* 预览区域样式 */
:deep(.md-preview) {
  padding: 16px;
}

/* 表格样式 */
:deep(.md-editor-preview table),
:deep(.md-preview table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

:deep(.md-editor-preview table th),
:deep(.md-editor-preview table td),
:deep(.md-preview table th),
:deep(.md-preview table td) {
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
}

.dark :deep(.md-editor-preview table th),
.dark :deep(.md-editor-preview table td),
.dark :deep(.md-preview table th),
.dark :deep(.md-preview table td) {
  border-color: rgba(75, 85, 99, 0.5);
}

/* 代码块样式 */
:deep(.md-editor-preview pre),
:deep(.md-preview pre) {
  border-radius: 6px;
  margin: 16px 0;
}

/* 引用块样式 */
:deep(.md-editor-preview blockquote),
:deep(.md-preview blockquote) {
  border-left: 4px solid #6172f3;
  margin: 16px 0;
  padding: 12px 16px;
  background: rgba(97, 114, 243, 0.1);
  border-radius: 0 6px 6px 0;
}
</style>
