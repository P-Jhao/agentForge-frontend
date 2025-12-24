<script setup lang="ts">
/**
 * 智能路由开关组件
 * 控制是否启用智能意图路由功能
 */
import { onMounted } from 'vue';
import { NIcon, NTooltip } from 'naive-ui';
import { FlashOutline } from '@vicons/ionicons5';

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
        class="smart-routing-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all duration-200"
        :class="enabled ? 'smart-routing-btn-active' : 'smart-routing-btn-inactive'"
        :disabled="disabled"
        @click="toggle"
      >
        <NIcon :component="FlashOutline" :size="16" />
        <span>智能路由</span>
      </button>
    </template>
    {{ enabled ? '已启用智能路由，自动匹配或创建合适的 Forge' : '点击启用智能路由' }}
  </NTooltip>
</template>

<style scoped>
/* 智能路由按钮样式 */
.smart-routing-btn {
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

.smart-routing-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 未选中状态 */
.smart-routing-btn-inactive {
  background-color: rgba(128, 128, 128, 0.1);
  color: rgba(128, 128, 128, 0.8);
}

.smart-routing-btn-inactive:hover:not(:disabled) {
  background-color: rgba(128, 128, 128, 0.15);
  color: rgba(128, 128, 128, 1);
}

/* 选中状态 - 紫色高亮 */
.smart-routing-btn-active {
  background-color: rgba(139, 92, 246, 0.15);
  color: rgb(139, 92, 246);
}

.smart-routing-btn-active:hover:not(:disabled) {
  background-color: rgba(139, 92, 246, 0.2);
}

/* 暗色模式适配 */
:global(.dark) .smart-routing-btn-inactive {
  background-color: rgba(156, 163, 175, 0.15);
  color: rgba(156, 163, 175, 0.8);
}

:global(.dark) .smart-routing-btn-inactive:hover:not(:disabled) {
  background-color: rgba(156, 163, 175, 0.2);
  color: rgba(156, 163, 175, 1);
}

:global(.dark) .smart-routing-btn-active {
  background-color: rgba(167, 139, 250, 0.2);
  color: rgb(167, 139, 250);
}

:global(.dark) .smart-routing-btn-active:hover:not(:disabled) {
  background-color: rgba(167, 139, 250, 0.25);
}
</style>
