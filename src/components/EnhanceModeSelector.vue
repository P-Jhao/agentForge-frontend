<script setup lang="ts">
/**
 * 增强模式选择器组件
 * 提供四个选项：关闭、快速增强、智能迭代、多角度增强
 * 每个选项带有描述说明
 */
import { ref, computed } from 'vue';
import { NPopover, NIcon } from 'naive-ui';
import { TrendingUpSharp } from '@vicons/ionicons5';
import { CheckmarkOutline } from '@vicons/ionicons5';
import type { EnhanceMode } from '@/utils/enhanceMode';

// Props
interface Props {
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
});

// v-model
const modelValue = defineModel<EnhanceMode>({ default: 'off' });

// 控制弹出层显示
const showPopover = ref(false);

// 选项列表（带描述）
const options = [
  {
    value: 'off' as const,
    label: '关闭',
    description: '不对提示词进行增强处理',
  },
  {
    value: 'quick' as const,
    label: '快速增强',
    description: 'LLM 直接优化提示词，速度快',
  },
  {
    value: 'smart' as const,
    label: '智能迭代',
    description: '审查 → 提问 → 增强，对症下药',
  },
  {
    value: 'multi' as const,
    label: '多角度增强',
    description: '三位专家分析后综合，更全面',
  },
];

// 当前选中的标签
const currentLabel = computed(() => {
  const option = options.find((opt) => opt.value === modelValue.value);
  return option?.label ?? '关闭';
});

// 是否启用（非关闭状态）
const isActive = computed(() => modelValue.value !== 'off');

// 选择选项
const selectOption = (value: EnhanceMode) => {
  modelValue.value = value;
  showPopover.value = false;
};
</script>

<template>
  <NPopover
    v-model:show="showPopover"
    trigger="click"
    placement="top-start"
    :disabled="disabled"
    raw
    :show-arrow="false"
  >
    <template #trigger>
      <button
        type="button"
        class="enhance-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all duration-200"
        :class="isActive ? 'enhance-btn-active' : 'enhance-btn-inactive'"
        :disabled="disabled"
      >
        <NIcon :component="TrendingUpSharp" :size="16" />
        <span>{{ currentLabel }}</span>
      </button>
    </template>

    <!-- 自定义下拉菜单 -->
    <div class="enhance-menu">
      <div class="menu-title">提示词增强</div>
      <div class="menu-options">
        <div
          v-for="option in options"
          :key="option.value"
          class="menu-option"
          :class="{ 'menu-option-active': modelValue === option.value }"
          @click="selectOption(option.value)"
        >
          <div class="option-header">
            <span class="option-label">{{ option.label }}</span>
            <NIcon
              v-if="modelValue === option.value"
              :component="CheckmarkOutline"
              :size="18"
              class="option-check"
            />
          </div>
          <div class="option-desc">{{ option.description }}</div>
        </div>
      </div>
    </div>
  </NPopover>
</template>

<style scoped>
/* 增强模式按钮样式 */
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

.enhance-btn-inactive {
  background-color: rgba(128, 128, 128, 0.1);
  color: rgba(128, 128, 128, 0.8);
}

.enhance-btn-inactive:hover {
  background-color: rgba(128, 128, 128, 0.15);
  color: rgba(128, 128, 128, 1);
}

.enhance-btn-active {
  background-color: rgba(139, 92, 246, 0.15);
  color: rgb(139, 92, 246);
}

.enhance-btn-active:hover {
  background-color: rgba(139, 92, 246, 0.2);
}

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

.enhance-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 下拉菜单样式 */
.enhance-menu {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  padding: 12px;
  min-width: 260px;
}

:global(.dark) .enhance-menu {
  background: #1f2937;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.menu-title {
  font-size: 12px;
  color: #9ca3af;
  padding: 0 8px 8px;
  border-bottom: 1px solid #f3f4f6;
}

:global(.dark) .menu-title {
  color: #6b7280;
  border-bottom-color: #374151;
}

.menu-options {
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-option {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.menu-option:hover {
  background-color: #f3f4f6;
}

:global(.dark) .menu-option:hover {
  background-color: #374151;
}

.menu-option-active {
  background-color: rgba(139, 92, 246, 0.1);
}

.menu-option-active:hover {
  background-color: rgba(139, 92, 246, 0.15);
}

:global(.dark) .menu-option-active {
  background-color: rgba(167, 139, 250, 0.15);
}

:global(.dark) .menu-option-active:hover {
  background-color: rgba(167, 139, 250, 0.2);
}

.option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.option-label {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

:global(.dark) .option-label {
  color: #f3f4f6;
}

.option-check {
  color: rgb(139, 92, 246);
}

:global(.dark) .option-check {
  color: rgb(167, 139, 250);
}

.option-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

:global(.dark) .option-desc {
  color: #9ca3af;
}
</style>
