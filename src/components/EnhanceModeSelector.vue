<script setup lang="ts">
/**
 * 增强模式选择器组件
 * 提供四个选项：关闭、快速增强、智能迭代、多角度增强
 */
import { NPopselect, NIcon, NTooltip } from 'naive-ui';
import { FlashOutline } from '@vicons/ionicons5';
import { computed } from 'vue';
import type { EnhanceMode } from '@/utils/enhanceMode';
import { enhanceModeOptions } from '@/utils/enhanceMode';

// Props
interface Props {
  // 是否禁用
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
});

// v-model
const modelValue = defineModel<EnhanceMode>({ default: 'off' });

// 选项列表（带描述）
const options = computed(() =>
  enhanceModeOptions.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }))
);

// 当前选中的标签
const currentLabel = computed(() => {
  const option = enhanceModeOptions.find((opt) => opt.value === modelValue.value);
  return option?.label ?? '关闭';
});

// 是否启用（非关闭状态）
const isActive = computed(() => modelValue.value !== 'off');

// 提示文本
const tooltipText = computed(() => {
  switch (modelValue.value) {
    case 'quick':
      return '快速增强：LLM 直接优化提示词';
    case 'smart':
      return '智能迭代：审查 → 提问 → 增强';
    case 'multi':
      return '多角度增强：三位专家分析后综合';
    default:
      return '点击选择提示词增强模式';
  }
});
</script>

<template>
  <NTooltip>
    <template #trigger>
      <NPopselect
        v-model:value="modelValue"
        :options="options"
        trigger="click"
        :disabled="disabled"
      >
        <button
          type="button"
          class="enhance-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all duration-200"
          :class="isActive ? 'enhance-btn-active' : 'enhance-btn-inactive'"
          :disabled="disabled"
        >
          <NIcon :component="FlashOutline" :size="16" />
          <span>{{ currentLabel }}</span>
        </button>
      </NPopselect>
    </template>
    {{ tooltipText }}
  </NTooltip>
</template>

<style scoped>
/* 增强模式按钮样式（与深度思考按钮风格一致） */
.enhance-btn {
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
.enhance-btn-inactive {
  background-color: rgba(128, 128, 128, 0.1);
  color: rgba(128, 128, 128, 0.8);
}

.enhance-btn-inactive:hover {
  background-color: rgba(128, 128, 128, 0.15);
  color: rgba(128, 128, 128, 1);
}

/* 选中状态 - 紫色高亮（区别于深度思考的蓝色） */
.enhance-btn-active {
  background-color: rgba(139, 92, 246, 0.15);
  color: rgb(139, 92, 246);
}

.enhance-btn-active:hover {
  background-color: rgba(139, 92, 246, 0.2);
}

/* 暗色模式适配 */
:global(.dark) .enhance-btn-inactive {
  background-color: rgba(156, 163, 175, 0.15);
  color: rgba(156, 163, 175, 0.8);
}

:global(.dark) .enhance-btn-inactive:hover {
  background-color: rgba(156, 163, 175, 0.2);
  color: rgba(156, 163, 175, 1);
}

:global(.dark) .enhance-btn-active {
  background-color: rgba(167, 139, 250, 0.2);
  color: rgb(167, 139, 250);
}

:global(.dark) .enhance-btn-active:hover {
  background-color: rgba(167, 139, 250, 0.25);
}

/* 禁用状态 */
.enhance-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
