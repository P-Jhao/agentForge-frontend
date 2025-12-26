<script setup lang="ts">
/**
 * 聊天输入框组件
 * 统一的卡片式输入框，支持文件上传（点击/拖拽）
 */
import { NInput, NButton, NIcon, NTooltip, NUpload, useMessage } from 'naive-ui';
import type { UploadFileInfo } from 'naive-ui';
import {
  SendOutline,
  AttachOutline,
  CloseCircle,
  DocumentTextOutline,
  StopCircleOutline,
} from '@vicons/ionicons5';
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { uploadChatFile } from '@/api/upload';
import EnhanceModeSelector from './EnhanceModeSelector.vue';
import SmartRoutingToggle from './SmartRoutingToggle.vue';
import type { EnhanceMode } from '@/utils/enhanceMode';
import { getUserSettings, updateUserSetting } from '@/utils/userSettings';
import { useUserStore } from '@/stores';

// Props
interface Props {
  // 输入框占位符
  placeholder?: string;
  // 是否禁用
  disabled?: boolean;
  // 是否加载中（禁用输入）
  loading?: boolean;
  // 是否显示停止按钮（LLM 正在生成时）
  showStopButton?: boolean;
  // 是否高亮发送按钮
  highlightSend?: boolean;
  // 是否显示智能路由开关
  showSmartRouting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '输入消息...',
  disabled: false,
  loading: false,
  showStopButton: false,
  highlightSend: false,
  showSmartRouting: false,
});

// v-model
const modelValue = defineModel<string>({ default: '' });

// 深度思考开关状态（默认关闭）
const enableThinking = ref(false);

// 增强模式状态（默认关闭）
const enhanceMode = ref<EnhanceMode>('off');

// 智能路由开关状态
const smartRoutingEnabled = ref(false);

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
    smartRouting?: boolean,
  ];
  cancel: [];
}>();

/**
 * 处理取消/中断
 */
const handleCancel = () => {
  emit('cancel');
};

// 用户 store
const userStore = useUserStore();

// 加载用户设置
function loadUserSettings() {
  const userId = userStore.userInfo?.id;
  if (userId) {
    const settings = getUserSettings(userId);
    enableThinking.value = settings.enableThinking;
    enhanceMode.value = settings.enhanceMode;
    smartRoutingEnabled.value = settings.smartRoutingEnabled;
  }
}

// 初始化用户设置
onMounted(() => {
  loadUserSettings();

  // 监听设置变更事件（用于一键做同款同步设置）
  window.addEventListener('userSettingsChanged', loadUserSettings);
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('userSettingsChanged', loadUserSettings);
});

// 监听用户登录状态变化，重新加载设置
watch(
  () => userStore.userInfo?.id,
  (userId) => {
    if (userId) {
      loadUserSettings();
    }
  }
);

// 监听深度思考状态变化，保存到 localStorage
const handleThinkingChange = (value: boolean) => {
  enableThinking.value = value;
  const userId = userStore.userInfo?.id;
  if (userId) {
    updateUserSetting(userId, 'enableThinking', value);
  }
};

// 监听增强模式变化，保存到 localStorage
watch(enhanceMode, (value) => {
  const userId = userStore.userInfo?.id;
  if (userId) {
    updateUserSetting(userId, 'enhanceMode', value);
  }
});

// 监听智能路由状态变化，保存到 localStorage
watch(smartRoutingEnabled, (value) => {
  const userId = userStore.userInfo?.id;
  if (userId) {
    updateUserSetting(userId, 'smartRoutingEnabled', value);
  }
});

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * 根据文件名获取图标类型
 * 返回 iconpark 图标名称，如果是通用文件则返回 null
 */
const getFileIconName = (fileName: string): string | null => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'doc':
    case 'docx':
      return 'file-word';
    case 'pdf':
      return 'file-pdf';
    case 'xls':
    case 'xlsx':
      return 'file-excel';
    case 'txt':
    case 'log':
    case 'md':
    case 'markdown':
    case 'json':
    case 'yaml':
    case 'yml':
    case 'xml':
    case 'csv':
    case 'ini':
    case 'toml':
    case 'conf':
    case 'config':
    case 'env':
      return 'file-text-jef5n3ke';
    default:
      return null;
  }
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

  // 发送消息，带上文件列表（如果有）和智能路由状态
  const files = uploadedFiles.value.length > 0 ? [...uploadedFiles.value] : undefined;
  const isSmartRouting = props.showSmartRouting && smartRoutingEnabled.value;

  emit('send', value, enableThinking.value, enhanceMode.value, files, isSmartRouting || undefined);

  // 智能路由模式下不清空输入框，让用户看到原始输入
  if (!isSmartRouting) {
    modelValue.value = '';
    uploadedFiles.value = [];
  }
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
        <!-- 根据文件类型显示不同图标 -->
        <iconpark-icon
          v-if="getFileIconName(file.originalName)"
          :name="getFileIconName(file.originalName)"
          size="16"
          class="text-gray-500"
        />
        <NIcon v-else :component="DocumentTextOutline" :size="16" class="text-gray-500" />
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
      data-auto-chat-input
      @keydown="handleKeydown"
    />

    <!-- 底部功能区 -->
    <div class="mt-3 flex items-center justify-between">
      <!-- 左侧功能按钮 -->
      <div class="flex items-center gap-2">
        <!-- 智能路由开关（仅在首页显示） -->
        <SmartRoutingToggle
          v-if="showSmartRouting"
          v-model="smartRoutingEnabled"
          :disabled="disabled"
        />

        <!-- 深度思考按钮（DeepSeek 风格） -->
        <NTooltip>
          <template #trigger>
            <button
              type="button"
              class="flex cursor-pointer items-center gap-1.5 border-none whitespace-nowrap outline-none"
              :class="enableThinking ? 'toggle-btn-active-blue' : 'toggle-btn-inactive'"
              @click="handleThinkingChange(!enableThinking)"
            >
              <iconpark-icon name="smart-optimization" size="16" />
              <span>深度思考</span>
            </button>
          </template>
          {{ enableThinking ? '已启用深度思考，先思考后回答' : '点击启用深度思考' }}
        </NTooltip>

        <!-- 增强模式选择器 -->
        <EnhanceModeSelector v-model="enhanceMode" :disabled="disabled" />

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

        <!-- 发送/停止按钮 -->
        <NButton
          v-if="!showStopButton"
          type="primary"
          size="large"
          round
          :disabled="!canSend"
          :class="['btn-theme', { 'send-btn-glow': highlightSend && canSend }]"
          data-auto-send-btn
          @click="handleSend"
        >
          <template #icon>
            <NIcon :component="SendOutline" />
          </template>
        </NButton>
        <!-- 停止按钮（LLM 正在生成时显示） -->
        <NTooltip v-else>
          <template #trigger>
            <NButton type="error" size="large" round class="stop-btn" @click="handleCancel">
              <template #icon>
                <NIcon :component="StopCircleOutline" />
              </template>
            </NButton>
          </template>
          停止生成
        </NTooltip>
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

/* 发送按钮发光动画效果 */
.send-btn-glow {
  animation: send-glow 1.5s ease-in-out infinite;
}

@keyframes send-glow {
  0%,
  100% {
    box-shadow:
      0 0 5px rgba(99, 102, 241, 0.5),
      0 0 10px rgba(139, 92, 246, 0.3);
  }
  50% {
    box-shadow:
      0 0 15px rgba(99, 102, 241, 0.8),
      0 0 25px rgba(139, 92, 246, 0.5),
      0 0 35px rgba(168, 85, 247, 0.3);
  }
}

/* 停止按钮样式 */
.stop-btn {
  animation: stop-pulse 1.5s ease-in-out infinite;
}

@keyframes stop-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
