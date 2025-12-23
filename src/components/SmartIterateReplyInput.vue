<script setup lang="ts">
/**
 * 智能迭代用户回复输入组件
 * 在 questioner 消息后显示，用于用户回复澄清问题
 */
import { ref } from 'vue';
import { NInput, NButton, NIcon } from 'naive-ui';
import { SendOutline } from '@vicons/ionicons5';

// Props
interface Props {
  // 是否禁用
  disabled?: boolean;
  // 是否加载中
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
});

// Emits
const emit = defineEmits<{
  submit: [answer: string];
}>();

// 回复内容
const answer = ref('');

// 提交回复
const handleSubmit = () => {
  const content = answer.value.trim();
  if (!content || props.disabled || props.loading) return;
  emit('submit', content);
  answer.value = '';
};

// 处理回车键
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
};

// 输入框主题覆盖
const inputThemeOverrides = {
  color: 'transparent',
  colorFocus: 'transparent',
};
</script>

<template>
  <div class="smart-iterate-reply">
    <!-- 提示文字 -->
    <div class="mb-2 flex items-center gap-2">
      <span class="text-sm font-medium text-amber-600 dark:text-amber-400">
        请回答上述问题以帮助优化您的提示词
      </span>
    </div>

    <!-- 输入区域 -->
    <div
      class="flex items-end gap-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-900/20"
    >
      <NInput
        v-model:value="answer"
        type="textarea"
        placeholder="输入您的回复..."
        :autosize="{ minRows: 1, maxRows: 4 }"
        :bordered="false"
        :disabled="disabled || loading"
        :theme-overrides="inputThemeOverrides"
        class="flex-1"
        @keydown="handleKeydown"
      />
      <NButton
        type="warning"
        size="medium"
        round
        :disabled="!answer.trim() || disabled"
        :loading="loading"
        @click="handleSubmit"
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
.smart-iterate-reply :deep(.n-input-wrapper) {
  padding: 0 !important;
}
</style>
