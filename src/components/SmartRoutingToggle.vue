<script setup lang="ts">
/**
 * 智能路由开关组件
 * 控制是否启用智能意图路由功能
 */
import { onMounted } from 'vue';
import { NTooltip } from 'naive-ui';

// Props
interface Props {
  // 是否禁用
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
});

// localStorage 存储键
const STORAGE_KEY = 'smartRoutingEnabled';

// 开关状态
const enabled = defineModel<boolean>({ default: false });

// 初始化状态
onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) {
    enabled.value = stored === 'true';
  }
});

/**
 * 切换开关状态
 */
const toggle = () => {
  enabled.value = !enabled.value;
  localStorage.setItem(STORAGE_KEY, String(enabled.value));
};
</script>

<template>
  <NTooltip>
    <template #trigger>
      <button
        type="button"
        class="flex cursor-pointer items-center gap-1.5 border-none whitespace-nowrap outline-none"
        :class="enabled ? 'toggle-btn-active' : 'toggle-btn-inactive'"
        :disabled="disabled"
        @click="toggle"
      >
        <iconpark-icon name="circle-four" size="16" />
        <span>智能路由</span>
      </button>
    </template>
    {{
      enabled
        ? '已启用智能路由，自动匹配或创建合适的 Forge'
        : '智能路由：根据你的问题自动识别意图，匹配最合适的 Forge 或创建新对话'
    }}
  </NTooltip>
</template>

<style scoped>
/* 无需额外样式，使用全局 toggle-btn-* 工具类 */
</style>
