<script setup lang="ts">
/**
 * 操作阶段提示组件
 * 先在页面中央显示1秒，然后移动到右上角
 * 点击任意位置可取消操作
 */
import { ref, watch, onUnmounted } from 'vue';
import { NIcon, NSpin } from 'naive-ui';
import { CloseOutline } from '@vicons/ionicons5';
import { useAutoOperationStore } from '@/stores';
import { storeToRefs } from 'pinia';

// 获取 store
const autoOperationStore = useAutoOperationStore();
const { isActive, stageText } = storeToRefs(autoOperationStore);

// 是否已移动到角落（初始在中央）
const isInCorner = ref(false);

// 是否已启用点击取消监听
const clickListenerEnabled = ref(false);

// 定时器
let moveTimer: ReturnType<typeof setTimeout> | null = null;
let clickEnableTimer: ReturnType<typeof setTimeout> | null = null;

// 点击取消处理函数
const handleGlobalClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  // 点击 toast 内部不处理
  if (target.closest('.operation-stage-toast')) {
    return;
  }

  // 只处理用户真实点击（isTrusted 为 true），忽略程序触发的点击
  if (!e.isTrusted) {
    return;
  }

  // 点击其他任意位置取消操作
  if (clickListenerEnabled.value && isActive.value) {
    e.preventDefault();
    e.stopPropagation();
    autoOperationStore.cancelOperation();
  }
};

// 清理所有定时器和监听器
const cleanup = () => {
  if (moveTimer) {
    clearTimeout(moveTimer);
    moveTimer = null;
  }
  if (clickEnableTimer) {
    clearTimeout(clickEnableTimer);
    clickEnableTimer = null;
  }
  document.removeEventListener('click', handleGlobalClick, true);
};

// 监听 isActive 变化（只在操作开始/结束时触发）
watch(
  isActive,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      // 操作刚开始（从 false 变为 true）
      isInCorner.value = false;
      clickListenerEnabled.value = false;

      // 短暂延迟后启用点击取消（避免触发发送的点击被拦截）
      clickEnableTimer = setTimeout(() => {
        clickListenerEnabled.value = true;
        document.addEventListener('click', handleGlobalClick, true);
      }, 300);

      // 1秒后移动到角落
      moveTimer = setTimeout(() => {
        isInCorner.value = true;
      }, 1000);
    } else if (!newVal && oldVal) {
      // 操作结束（从 true 变为 false）
      isInCorner.value = false;
      clickListenerEnabled.value = false;
      cleanup();
    }
  },
  { immediate: true }
);

// 组件卸载时清理
onUnmounted(() => {
  cleanup();
});

/**
 * 取消操作（按钮点击）
 */
const handleCancel = () => {
  autoOperationStore.cancelOperation();
};
</script>

<template>
  <Teleport to="body">
    <Transition name="toast-fade">
      <div
        v-if="isActive && stageText"
        class="operation-stage-toast text-theme dark:bg-dark-700/98 fixed z-9999 flex items-center gap-3 rounded-xl border border-indigo-400/30 bg-white/98 shadow-2xl backdrop-blur-xl dark:border-violet-500/40"
        :class="[
          isInCorner
            ? 'is-corner top-4 right-4 px-5 py-3.5'
            : 'is-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-5',
        ]"
      >
        <!-- 加载动画 -->
        <NSpin :size="isInCorner ? 18 : 22" />

        <!-- 阶段文本 -->
        <span class="font-medium whitespace-nowrap" :class="isInCorner ? 'text-sm' : 'text-base'">
          {{ stageText }}
        </span>

        <!-- 取消按钮 -->
        <button
          type="button"
          class="ml-1 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-500/15 hover:text-red-500 dark:hover:bg-white/10 dark:hover:text-red-400"
          title="点击取消"
          @click.stop="handleCancel"
        >
          <NIcon :component="CloseOutline" :size="isInCorner ? 16 : 18" />
        </button>

        <!-- 提示文字（始终显示） -->
        <span class="text-xs text-gray-500/80">点击任意处取消</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Toast 容器样式 - 位置过渡动画 */
.operation-stage-toast {
  transition:
    top 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    left 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    right 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.3s ease;
}

/* 中央状态 - 更大更醒目 */
.operation-stage-toast.is-center {
  box-shadow:
    0 12px 48px rgba(99, 102, 241, 0.25),
    0 0 0 2px rgba(99, 102, 241, 0.15);
  animation: pulse-glow 1.5s ease-in-out infinite;
}

/* 角落状态 */
.operation-stage-toast.is-corner {
  box-shadow:
    0 4px 20px rgba(99, 102, 241, 0.15),
    0 0 0 1px rgba(99, 102, 241, 0.1);
}

/* 脉冲发光动画 - 浅色模式 */
@keyframes pulse-glow {
  0%,
  100% {
    box-shadow:
      0 12px 48px rgba(99, 102, 241, 0.25),
      0 0 0 2px rgba(99, 102, 241, 0.15);
  }
  50% {
    box-shadow:
      0 12px 48px rgba(99, 102, 241, 0.35),
      0 0 0 4px rgba(99, 102, 241, 0.1),
      0 0 20px rgba(139, 92, 246, 0.3);
  }
}

/* 暗色模式阴影 */
:root.dark .operation-stage-toast.is-center {
  box-shadow:
    0 12px 48px rgba(139, 92, 246, 0.3),
    0 0 0 2px rgba(139, 92, 246, 0.2);
  animation: pulse-glow-dark 1.5s ease-in-out infinite;
}

:root.dark .operation-stage-toast.is-corner {
  box-shadow:
    0 4px 20px rgba(139, 92, 246, 0.2),
    0 0 0 1px rgba(139, 92, 246, 0.15);
}

/* 脉冲发光动画 - 暗色模式 */
@keyframes pulse-glow-dark {
  0%,
  100% {
    box-shadow:
      0 12px 48px rgba(139, 92, 246, 0.3),
      0 0 0 2px rgba(139, 92, 246, 0.2);
  }
  50% {
    box-shadow:
      0 12px 48px rgba(139, 92, 246, 0.4),
      0 0 0 4px rgba(139, 92, 246, 0.15),
      0 0 20px rgba(168, 85, 247, 0.35);
  }
}

/* 淡入淡出动画 */
.toast-fade-enter-active {
  animation: toast-scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-fade-leave-active {
  animation: toast-fade-out 0.2s ease-out;
}

@keyframes toast-scale-in {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes toast-fade-out {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(0.95);
  }
}
</style>
