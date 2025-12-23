<script setup lang="ts">
/**
 * 聊天输入框组件
 * 统一的卡片式输入框，支持文件上传（点击/拖拽）
 */
import { NInput, NButton, NIcon, NTooltip, NUpload, useMessage } from 'naive-ui';
import type { UploadFileInfo } from 'naive-ui';
import {
  SendOutline,
  SparklesOutline,
  AttachOutline,
  CloseCircle,
  DocumentTextOutline,
} from '@vicons/ionicons5';
import { ref, onMounted, computed } from 'vue';
import { uploadChatFile } from '@/api/upload';
import EnhanceModeSelector from './EnhanceModeSelector.vue';
import type { EnhanceMode } from '@/utils/enhanceMode';
import { getEnhanceMode, setEnhanceMode } from '@/utils/enhanceMode';

// Props
interface Props {
  // 输入框占位符
  placeholder?: string;
  // 是否禁用
  disabled?: boolean;
  // 是否加载中
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '输入消息...',
  disabled: false,
  loading: false,
});

// v-model
const modelValue = defineModel<string>({ default: '' });

// 深度思考开关状态（默认关闭）
const enableThinking = ref(false);

// 增强模式状态（默认关闭）
const enhanceMode = ref<EnhanceMode>('off');

// 已上传的文件列表（支持多文件）
const uploadedFiles = ref<
  {
    filePath: string;
    originalName: string;
    size: number;
    url: string;
  }[]
>([]);

// 是否正在上传
const uploading = ref(false);

// 是否拖拽中
const isDragging = ref(false);

// 消息提示
const message = useMessage();

// 支持的文件扩展名（与 MCP 服务器支持的格式对应）
const SUPPORTED_EXTENSIONS = [
  // 文档格式（file-to-markdown-mcp）
  '.pdf',
  '.docx',
  '.xlsx',
  '.pptx',
  // 纯文本格式（read-text-file-mcp）
  '.txt',
  '.log',
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.py',
  '.java',
  '.c',
  '.cpp',
  '.h',
  '.go',
  '.rs',
  '.rb',
  '.php',
  '.swift',
  '.kt',
  '.cs',
  '.vue',
  '.svelte',
  '.json',
  '.yaml',
  '.yml',
  '.xml',
  '.csv',
  '.tsv',
  '.env',
  '.ini',
  '.toml',
  '.conf',
  '.config',
  '.md',
  '.markdown',
  '.rst',
  '.html',
  '.css',
  '.scss',
  '.less',
  '.sh',
  '.bash',
  '.zsh',
  '.ps1',
  '.bat',
  '.cmd',
];

// 文件大小限制（字节）
const FILE_SIZE_LIMITS: Record<string, number> = {
  // 文档格式
  '.pdf': 10 * 1024 * 1024, // 10MB
  '.docx': 10 * 1024 * 1024, // 10MB
  '.xlsx': 5 * 1024 * 1024, // 5MB
  '.pptx': 15 * 1024 * 1024, // 15MB
  // 纯文本格式默认 1MB
};
const DEFAULT_SIZE_LIMIT = 1 * 1024 * 1024; // 1MB

// Emits
const emit = defineEmits<{
  send: [
    value: string,
    enableThinking: boolean,
    enhanceMode: EnhanceMode,
    files?: { filePath: string; originalName: string; size: number; url: string }[],
  ];
}>();

// 初始化深度思考状态和增强模式
onMounted(() => {
  // 深度思考状态
  const stored = localStorage.getItem('enableThinking');
  if (stored !== null) {
    enableThinking.value = stored === 'true';
  }
  // 增强模式
  enhanceMode.value = getEnhanceMode();
});

// 监听深度思考状态变化，保存到 localStorage
const handleThinkingChange = (value: boolean) => {
  enableThinking.value = value;
  localStorage.setItem('enableThinking', String(value));
};

// 监听增强模式变化，保存到 localStorage
const handleEnhanceModeChange = (value: EnhanceMode) => {
  enhanceMode.value = value;
  setEnhanceMode(value);
};

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * 验证文件
 */
const validateFile = (file: File): string | null => {
  // 检查文件扩展名
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return `不支持的文件类型: ${ext}`;
  }

  // 检查文件大小
  const sizeLimit = FILE_SIZE_LIMITS[ext] || DEFAULT_SIZE_LIMIT;
  if (file.size > sizeLimit) {
    const limitMB = (sizeLimit / (1024 * 1024)).toFixed(0);
    return `${ext} 文件大小不能超过 ${limitMB}MB`;
  }

  return null;
};

/**
 * 处理文件上传（支持多文件追加）
 */
const handleFileUpload = async (file: File) => {
  // 验证文件
  const error = validateFile(file);
  if (error) {
    message.error(error);
    return;
  }

  // 检查是否已上传同名文件
  if (uploadedFiles.value.some((f) => f.originalName === file.name)) {
    message.warning(`文件 "${file.name}" 已存在`);
    return;
  }

  uploading.value = true;

  try {
    const result = await uploadChatFile(file);
    // 追加到文件列表
    uploadedFiles.value.push({
      filePath: result.filePath,
      originalName: result.originalName,
      size: result.size,
      url: result.url,
    });
    message.success('文件上传成功');
  } catch (err) {
    message.error((err as Error).message || '文件上传失败');
  } finally {
    uploading.value = false;
  }
};

/**
 * 处理 NUpload 的文件变化
 */
const handleUploadChange = (options: { file: UploadFileInfo }) => {
  const rawFile = options.file.file;
  if (rawFile) {
    handleFileUpload(rawFile);
  }
};

/**
 * 移除已上传的文件（按索引）
 */
const removeFile = (index: number) => {
  uploadedFiles.value.splice(index, 1);
};

/**
 * 处理拖拽进入
 */
const handleDragEnter = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = true;
};

/**
 * 处理拖拽离开
 */
const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = false;
};

/**
 * 处理拖拽悬停
 */
const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
};

/**
 * 处理拖拽放下（支持多文件）
 */
const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = false;

  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    // 处理所有拖入的文件
    Array.from(files).forEach((file) => {
      handleFileUpload(file);
    });
  }
};

/**
 * 处理发送
 */
const handleSend = () => {
  const value = modelValue.value.trim();
  if (!value || props.disabled || props.loading) return;

  // 发送消息，带上文件列表（如果有）
  const files = uploadedFiles.value.length > 0 ? [...uploadedFiles.value] : undefined;

  emit('send', value, enableThinking.value, enhanceMode.value, files);

  // 清空输入和文件列表
  modelValue.value = '';
  uploadedFiles.value = [];
};

/**
 * 处理回车键（Shift+Enter 换行，Enter 发送）
 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};

// 输入框主题覆盖（背景透明）
const inputThemeOverrides = {
  color: 'transparent',
  colorFocus: 'transparent',
  colorDisabled: 'transparent',
};

// 是否可以发送
const canSend = computed(() => {
  return modelValue.value.trim() && !props.disabled && !props.loading && !uploading.value;
});
</script>

<template>
  <div
    class="chat-input-container input-container rounded-2xl border p-4"
    :class="{ 'border-primary border-2': isDragging }"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <!-- 已上传文件预览（支持多文件） -->
    <div v-if="uploadedFiles.length > 0" class="mb-3 flex flex-wrap gap-2">
      <div
        v-for="(file, index) in uploadedFiles"
        :key="file.filePath"
        class="flex items-center gap-2 rounded-lg bg-gray-100 px-2 py-1.5 dark:bg-gray-800"
      >
        <NIcon :component="DocumentTextOutline" :size="16" class="text-gray-500" />
        <span class="max-w-32 truncate text-sm">{{ file.originalName }}</span>
        <span class="text-xs text-gray-400">{{ formatFileSize(file.size) }}</span>
        <NButton quaternary circle size="tiny" @click="removeFile(index)">
          <template #icon>
            <NIcon :component="CloseCircle" :size="14" />
          </template>
        </NButton>
      </div>
    </div>

    <!-- 拖拽提示 -->
    <div
      v-if="isDragging"
      class="bg-primary/10 pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
    >
      <span class="text-primary text-lg font-medium">释放以上传文件</span>
    </div>

    <!-- 输入区域 -->
    <NInput
      v-model:value="modelValue"
      type="textarea"
      :placeholder="placeholder"
      :autosize="{ minRows: 2, maxRows: 6 }"
      :bordered="false"
      :disabled="disabled"
      :theme-overrides="inputThemeOverrides"
      class="chat-textarea"
      @keydown="handleKeydown"
    />

    <!-- 底部功能区 -->
    <div class="mt-3 flex items-center justify-between">
      <!-- 左侧功能按钮 -->
      <div class="flex items-center gap-2">
        <!-- 深度思考按钮（DeepSeek 风格） -->
        <NTooltip>
          <template #trigger>
            <button
              type="button"
              class="thinking-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all duration-200"
              :class="enableThinking ? 'thinking-btn-active' : 'thinking-btn-inactive'"
              @click="handleThinkingChange(!enableThinking)"
            >
              <NIcon :component="SparklesOutline" :size="16" />
              <span>深度思考</span>
            </button>
          </template>
          {{ enableThinking ? '已启用深度思考，先思考后回答' : '点击启用深度思考' }}
        </NTooltip>

        <!-- 增强模式选择器 -->
        <EnhanceModeSelector
          v-model="enhanceMode"
          :disabled="disabled"
          @update:model-value="handleEnhanceModeChange"
        />

        <slot name="actions"></slot>
      </div>

      <!-- 右侧：上传文件 + 发送按钮 -->
      <div class="flex items-center gap-2">
        <!-- 文件上传按钮 -->
        <NUpload
          :show-file-list="false"
          :disabled="disabled || uploading"
          @change="handleUploadChange"
        >
          <NTooltip>
            <template #trigger>
              <NButton quaternary circle :loading="uploading" :disabled="disabled">
                <template #icon>
                  <NIcon :component="AttachOutline" :size="20" />
                </template>
              </NButton>
            </template>
            支持拖拽上传，PDF/DOCX/PPTX 最大 10-15MB，其他文件最大 1MB
          </NTooltip>
        </NUpload>

        <!-- 发送按钮 -->
        <NButton
          type="primary"
          size="large"
          round
          :disabled="!canSend"
          :loading="loading"
          class="btn-theme"
          @click="handleSend"
        >
          <template #icon>
            <NIcon :component="SendOutline" />
          </template>
        </NButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 输入框内边距调整 */
.chat-textarea :deep(.n-input-wrapper) {
  padding: 0 !important;
}

/* 容器相对定位，用于拖拽提示 */
.chat-input-container {
  position: relative;
}

/* 深度思考按钮样式（DeepSeek 风格） */
.thinking-btn {
  cursor: pointer;
  border: none;
  outline: none;
  font-weight: 500;
  display: flex;
  flex-direction: row;
  align-items: center;
  white-space: nowrap;
  transition:
    background-color 0.25s ease,
    color 0.25s ease;
}

/* 未选中状态 */
.thinking-btn-inactive {
  background-color: rgba(128, 128, 128, 0.1);
  color: rgba(128, 128, 128, 0.8);
}

.thinking-btn-inactive:hover {
  background-color: rgba(128, 128, 128, 0.15);
  color: rgba(128, 128, 128, 1);
}

/* 选中状态 - 蓝色高亮 */
.thinking-btn-active {
  background-color: rgba(59, 130, 246, 0.15);
  color: rgb(59, 130, 246);
}

.thinking-btn-active:hover {
  background-color: rgba(59, 130, 246, 0.2);
}

/* 暗色模式适配 */
:global(.dark) .thinking-btn-inactive {
  background-color: rgba(156, 163, 175, 0.15);
  color: rgba(156, 163, 175, 0.8);
}

:global(.dark) .thinking-btn-inactive:hover {
  background-color: rgba(156, 163, 175, 0.2);
  color: rgba(156, 163, 175, 1);
}

:global(.dark) .thinking-btn-active {
  background-color: rgba(96, 165, 250, 0.2);
  color: rgb(96, 165, 250);
}

:global(.dark) .thinking-btn-active:hover {
  background-color: rgba(96, 165, 250, 0.25);
}
</style>
