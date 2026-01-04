<script setup lang="ts">
/**
 * 工具结果/文件预览弹窗组件
 * 支持两种模式：
 * - tool: 展示工具执行结果的 Markdown 摘要
 * - file: 展示输出文件的预览内容或下载提示
 */
import { computed, ref } from 'vue';
import { NModal, NIcon, NButton } from 'naive-ui';
import {
  CheckmarkCircle,
  CloseCircle,
  Close,
  Download,
  DocumentText,
  Expand,
  Contract,
} from '@vicons/ionicons5';
import EMarkdown from '@/components/EMarkdown.vue';
import { useThemeStore } from '@/stores';
import type { OutputFileInfo } from '@/types';

// 弹窗模式
type ModalMode = 'tool' | 'file';

interface Props {
  show: boolean;
  mode?: ModalMode;
  // 工具模式属性
  toolName?: string;
  success?: boolean;
  summarizedResult?: string;
  error?: string;
  callId?: string; // 工具调用 ID，用于下载
  // 文件模式属性
  file?: OutputFileInfo;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'tool',
  success: true,
  toolName: '',
  summarizedResult: undefined,
  error: undefined,
  callId: undefined,
  file: undefined,
});

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const themeStore = useThemeStore();

// 全屏状态
const isFullscreen = ref(false);

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

// 关闭弹窗
const handleClose = () => {
  isFullscreen.value = false; // 关闭时重置全屏状态
  emit('update:show', false);
};

// 下载文件（文件模式）
const handleDownload = () => {
  if (!props.file?.url) return;
  // 创建隐藏的 a 标签触发下载
  const link = document.createElement('a');
  link.href = props.file.url;
  link.download = props.file.name;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 下载工具执行结果（工具模式）
const handleDownloadToolResult = () => {
  if (!props.callId) return;
  // 通过 API 下载工具执行结果
  const link = document.createElement('a');
  link.href = `/api/files/tool-result/${props.callId}`;
  link.download = `${props.toolName}_${props.callId}.md`;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 状态图标颜色（工具模式）
const statusColor = computed(() => {
  return props.success ? '#22c55e' : '#ef4444';
});

// 工具模式显示的内容
const toolDisplayContent = computed(() => {
  if (props.error) {
    return `## 执行失败\n\n${props.error}`;
  }
  if (!props.summarizedResult) {
    return '## 执行概要\n\n工具执行完成，无返回数据';
  }
  return props.summarizedResult;
});

// 文件模式显示的内容
const fileDisplayContent = computed(() => {
  if (props.file?.previewContent) {
    return props.file.previewContent;
  }
  return null;
});

// 是否为大文件（没有预览内容且文件大小超过 1MB）
const isLargeFile = computed(() => {
  if (!props.file) return false;
  // 没有预览内容且文件大小超过 1MB
  return !props.file.previewContent && props.file.size > 1024 * 1024;
});

// 格式化文件大小
const formattedFileSize = computed(() => {
  if (!props.file) return '';
  const size = props.file.size;
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
});

// 弹窗样式
const modalStyle = computed(() => {
  if (themeStore.isDark) {
    return {
      background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.98) 0%, rgba(20, 20, 30, 0.98) 100%)',
      border: '1px solid rgba(97, 114, 243, 0.3)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px rgba(97, 114, 243, 0.15)',
    };
  }
  return {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  };
});
</script>

<template>
  <NModal
    :show="show"
    :mask-closable="true"
    :close-on-esc="true"
    @update:show="emit('update:show', $event)"
  >
    <div
      class="tool-result-modal"
      :class="{ 'tool-result-modal--fullscreen': isFullscreen }"
      :style="modalStyle"
    >
      <!-- 头部 -->
      <div class="modal-header">
        <!-- 工具模式头部 -->
        <template v-if="mode === 'tool'">
          <div class="flex items-center gap-2">
            <NIcon
              :component="success ? CheckmarkCircle : CloseCircle"
              :size="20"
              :color="statusColor"
            />
            <span class="font-medium">工具 {{ toolName }} 执行结果</span>
          </div>
        </template>

        <!-- 文件模式头部 -->
        <template v-else>
          <div class="flex items-center gap-2">
            <NIcon :component="DocumentText" :size="20" class="opacity-70" />
            <span class="max-w-[400px] truncate font-medium">{{ file?.name }}</span>
            <span class="text-xs opacity-50">{{ formattedFileSize }}</span>
          </div>
        </template>

        <!-- 操作按钮 -->
        <div class="flex items-center gap-1">
          <!-- 工具模式下载按钮 -->
          <NButton
            v-if="mode === 'tool' && callId"
            quaternary
            circle
            size="small"
            @click="handleDownloadToolResult"
          >
            <template #icon>
              <NIcon :component="Download" />
            </template>
          </NButton>
          <!-- 文件模式下载按钮 -->
          <NButton
            v-if="mode === 'file' && file?.url"
            quaternary
            circle
            size="small"
            @click="handleDownload"
          >
            <template #icon>
              <NIcon :component="Download" />
            </template>
          </NButton>
          <!-- 全屏按钮 -->
          <NButton quaternary circle size="small" @click="toggleFullscreen">
            <template #icon>
              <NIcon :component="isFullscreen ? Contract : Expand" />
            </template>
          </NButton>
          <!-- 关闭按钮 -->
          <NButton quaternary circle size="small" @click="handleClose">
            <template #icon>
              <NIcon :component="Close" />
            </template>
          </NButton>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="modal-content">
        <!-- 工具模式内容 -->
        <template v-if="mode === 'tool'">
          <EMarkdown :model-value="toolDisplayContent" mode="preview" />
        </template>

        <!-- 文件模式内容 -->
        <template v-else>
          <!-- 有预览内容 -->
          <template v-if="fileDisplayContent">
            <EMarkdown :model-value="fileDisplayContent" mode="preview" />
          </template>
          <!-- 大文件无法预览 -->
          <template v-else-if="isLargeFile">
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <NIcon :component="DocumentText" :size="48" class="mb-4 opacity-30" />
              <p class="mb-2 text-lg opacity-70">文件过大，无法预览</p>
              <p class="mb-6 text-sm opacity-50">文件大小超过 1MB，请下载后查看</p>
              <NButton type="primary" @click="handleDownload">
                <template #icon>
                  <NIcon :component="Download" />
                </template>
                下载文件
              </NButton>
            </div>
          </template>
          <!-- 不支持预览的文件类型 -->
          <template v-else>
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <NIcon :component="DocumentText" :size="48" class="mb-4 opacity-30" />
              <p class="mb-2 text-lg opacity-70">无法预览此类型文件</p>
              <p class="mb-6 text-sm opacity-50">点击下方按钮下载文件查看</p>
              <NButton type="primary" @click="handleDownload">
                <template #icon>
                  <NIcon :component="Download" />
                </template>
                下载文件
              </NButton>
            </div>
          </template>
        </template>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.tool-result-modal {
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 全屏模式 */
.tool-result-modal--fullscreen {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  max-height: 100vh !important;
  border-radius: 0 !important;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 滚动条样式 */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: transparent;
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.3);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.5);
}
</style>
