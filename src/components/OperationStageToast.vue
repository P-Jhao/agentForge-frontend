<script setup lang="ts">
/**
 * 操作阶段提示组件
 * 固定在页面右上角显示当前自动操作阶段
 */
import { computed } from 'vue';
import { NIcon, NSpin } from 'naive-ui';
import { CloseOutline } from '@vicons/ionicons5';
import { useAutoOperationStore } from '@/stores';
import { storeToRefs } from 'pinia';

// 获取 store
const autoOperationStore = useAutoOperationStore();
const { isActive, stageText } = storeToRefs(autoOperationStore);

// 是否显示
const visible = computed(() => isActive.value && stageText.value);

/**
 * 取消操作
 */
const handleCancel = () => {
  autoOperationStore.cancelOperation();
};
</script>

<template>
  <Transition name="toast-slide">
    <div
      v-if="visible"
      class="operation-stage-toast fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg"
    >
      <!-- 加载动画 -->
      <NSpin :size="16" />

      <!-- 阶段文本 -->
      <span class="text-sm font-medium">{{ stageText }}</span>

      <!-- 取消按钮 -->
      <button
        type="button"
        class="cancel-btn ml-2 rounded-full p-1 transition-colors"
        title="点击取消"
        @click="handleCancel"
      >
        <NIcon :component="CloseOutline" :size="16" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
/* Toast 容器样式 */
.operation-stage-toast {
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
}

/* 暗色模式 */
:global(.dark) .operation-stage-toast {
  background-color: rgba(30, 30, 30, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

/* 取消按钮 */
.cancel-btn {
  color: rgba(128, 128, 128, 0.8);
}

.cancel-btn:hover {
  background-color: rgba(128, 128, 128, 0.1);
  color: rgba(128, 128, 128, 1);
}

:global(.dark) .cancel-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 滑入滑出动画 */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
