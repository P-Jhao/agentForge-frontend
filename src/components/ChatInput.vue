<script setup lang="ts">
/**
 * 聊天输入框组件
 * 统一首页和任务页的输入框样式
 */
import { NInput, NButton, NIcon } from 'naive-ui';
import { SendOutline } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';

// Props
interface Props {
  // 输入框占位符
  placeholder?: string;
  // 是否禁用
  disabled?: boolean;
  // 是否加载中
  loading?: boolean;
  // 是否显示发送按钮文字
  showButtonText?: boolean;
  // 输入框类型：single 单行 / multi 多行
  type?: 'single' | 'multi';
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '输入消息...',
  disabled: false,
  loading: false,
  showButtonText: false,
  type: 'single',
});

// v-model
const modelValue = defineModel<string>({ default: '' });

// Emits
const emit = defineEmits<{
  send: [value: string];
}>();

const themeStore = useThemeStore();

/**
 * 处理发送
 */
const handleSend = () => {
  const value = modelValue.value.trim();
  if (!value || props.disabled || props.loading) return;
  emit('send', value);
};

/**
 * 处理回车键
 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};
</script>

<template>
  <div class="flex gap-3">
    <!-- 单行输入框 -->
    <NInput
      v-if="type === 'single'"
      v-model:value="modelValue"
      :placeholder="placeholder"
      size="large"
      round
      class="flex-1"
      :disabled="disabled"
      @keydown="handleKeydown"
    />
    <!-- 多行输入框 -->
    <NInput
      v-else
      v-model:value="modelValue"
      type="textarea"
      :placeholder="placeholder"
      :autosize="{ minRows: 1, maxRows: 4 }"
      class="flex-1"
      :disabled="disabled"
      @keydown="handleKeydown"
    />
    <!-- 发送按钮 -->
    <NButton
      type="primary"
      :size="type === 'single' ? 'large' : 'medium'"
      :round="type === 'single'"
      :disabled="!modelValue.trim() || disabled"
      :loading="loading"
      :class="type === 'single' ? (themeStore.isDark ? 'btn-glow' : 'btn-gradient') : ''"
      @click="handleSend"
    >
      <template #icon>
        <NIcon :component="SendOutline" />
      </template>
      <span v-if="showButtonText">发送</span>
    </NButton>
  </div>
</template>
