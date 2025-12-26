<script setup lang="ts">
/**
 * 增强模式选择器组件
 * 提供四个选项：关闭、快速增强、智能迭代、多角度增强
 * 每个选项带有描述说明
 */
import { ref, computed } from 'vue';
import { NPopover, NIcon, NTooltip } from 'naive-ui';
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
  <NTooltip :disabled="showPopover">
    <template #trigger>
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
            class="flex cursor-pointer items-center gap-1.5 border-none whitespace-nowrap outline-none"
            :class="isActive ? 'toggle-btn-active' : 'toggle-btn-inactive'"
            :disabled="disabled"
          >
            <NIcon :component="TrendingUpSharp" :size="16" />
            <span>{{ currentLabel }}</span>
          </button>
        </template>

        <!-- 自定义下拉菜单 -->
        <div class="dropdown-menu min-w-[260px] p-3">
          <div class="dropdown-menu-title border-b px-2 pb-2">提示词增强</div>
          <div class="flex flex-col gap-1 pt-2">
            <div
              v-for="option in options"
              :key="option.value"
              class="dropdown-menu-option rounded-lg"
              :class="{ 'dropdown-menu-option-active': modelValue === option.value }"
              @click="selectOption(option.value)"
            >
              <div class="flex items-center justify-between">
                <span class="dropdown-menu-label">{{ option.label }}</span>
                <NIcon
                  v-if="modelValue === option.value"
                  :component="CheckmarkOutline"
                  :size="18"
                  class="dropdown-menu-check"
                />
              </div>
              <div class="dropdown-menu-desc">{{ option.description }}</div>
            </div>
          </div>
        </div>
      </NPopover>
    </template>
    提示词增强：优化你的输入，让 AI 更好地理解你的意图
  </NTooltip>
</template>

<style scoped>
/* 无需额外样式，使用全局主题工具类 */
</style>
