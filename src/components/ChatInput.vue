<script setup lang="ts">
/**
 * 聊天输入框组件
 * 统一的卡片式输入框，发送按钮在右下角
 * 使用 CSS 类自动适配深浅主题
 */
import { NInput, NButton, NIcon, NSwitch, NTooltip } from 'naive-ui';
import { SendOutline, SparklesOutline } from '@vicons/ionicons5';
import { ref, onMounted } from 'vue';

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

// 深度思考开关状态
const enableThinking = ref(true);

// Emits
const emit = defineEmits<{
  send: [value: string];
}>();

// 初始化深度思考状态
onMounted(() => {
  const stored = localStorage.getItem('enableThinking');
  if (stored !== null) {
    enableThinking.value = stored === 'true';
  }
});

// 监听深度思考状态变化，保存到 localStorage
const handleThinkingChange = (value: boolean) => {
  enableThinking.value = value;
  localStorage.setItem('enableThinking', String(value));
};

/**
 * 处理发送
 */
const handleSend = () => {
  const value = modelValue.value.trim();
  if (!value || props.disabled || props.loading) return;
  emit('send', value);
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
</script>

<template>
  <div class="chat-input-container input-container rounded-2xl border p-4">
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
        <NTooltip>
          <template #trigger>
            <div
              class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <NIcon :component="SparklesOutline" :size="18" />
              <span class="text-sm">深度思考</span>
              <NSwitch :value="enableThinking" size="small" @update:value="handleThinkingChange" />
            </div>
          </template>
          {{ enableThinking ? '已启用深度思考' : '已禁用深度思考' }}
        </NTooltip>
        <slot name="actions"></slot>
      </div>
      <!-- 右侧发送按钮 -->
      <NButton
        type="primary"
        size="large"
        round
        :disabled="!modelValue.trim() || disabled"
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
</template>

<style scoped>
/* 输入框内边距调整 */
.chat-textarea :deep(.n-input-wrapper) {
  padding: 0 !important;
}
</style>
