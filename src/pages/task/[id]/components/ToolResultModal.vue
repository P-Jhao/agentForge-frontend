<script setup lang="ts">
/**
 * 工具结果展示弹窗组件
 * 以 Markdown 格式展示工具执行结果的摘要
 */
import { computed } from 'vue';
import { NModal, NIcon, NButton } from 'naive-ui';
import { CheckmarkCircle, CloseCircle, Close } from '@vicons/ionicons5';
import EMarkdown from '@/components/EMarkdown.vue';
import { useThemeStore } from '@/stores';

interface Props {
  show: boolean;
  toolName: string;
  success: boolean;
  summarizedResult?: string;
  error?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const themeStore = useThemeStore();

// 关闭弹窗
const handleClose = () => {
  emit('update:show', false);
};

// 状态图标颜色
const statusColor = computed(() => {
  return props.success ? '#22c55e' : '#ef4444';
});

// 显示的内容
const displayContent = computed(() => {
  if (props.error) {
    return `## 执行失败\n\n${props.error}`;
  }
  if (!props.summarizedResult) {
    return '## 执行概要\n\n工具执行完成，无返回数据';
  }
  return props.summarizedResult;
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
    <div class="tool-result-modal" :style="modalStyle">
      <!-- 头部 -->
      <div class="modal-header">
        <div class="flex items-center gap-2">
          <NIcon
            :component="success ? CheckmarkCircle : CloseCircle"
            :size="20"
            :color="statusColor"
          />
          <span class="font-medium">工具 {{ toolName }} 执行结果</span>
        </div>
        <NButton quaternary circle size="small" @click="handleClose">
          <template #icon>
            <NIcon :component="Close" />
          </template>
        </NButton>
      </div>

      <!-- 内容区域 -->
      <div class="modal-content">
        <EMarkdown :model-value="displayContent" mode="preview" />
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
