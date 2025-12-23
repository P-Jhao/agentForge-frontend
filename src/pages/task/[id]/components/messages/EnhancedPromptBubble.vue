<script setup lang="ts">
/**
 * 增强提示词气泡组件
 * 用于渲染 enhancer 类型的消息
 * 使用旋转边框特效表达"增强"概念，绿色渐变主题
 */
import { computed } from 'vue';
import { NSpin } from 'naive-ui';
import type { TextMessageData } from '@/composable/task/useChat';

const props = defineProps<{
  data: TextMessageData;
}>();

// 是否显示加载状态
const showLoading = computed(() => !props.data.content);
</script>

<template>
  <div class="enhanced-wrapper">
    <div class="enhanced-bubble">
      <NSpin v-if="showLoading" size="small" />
      <p v-else class="text-sm whitespace-pre-wrap">{{ data.content }}</p>
    </div>
  </div>
</template>

<style scoped>
/* 外层包装器 - 边框旋转动画容器 */
.enhanced-wrapper {
  --border-width: 3px;
  --border-radius: 18px;
  --corner-radius: 4px;

  position: relative;
  padding: var(--border-width);
  border-radius: var(--border-radius);
  /* 用户消息风格：右上角小圆角 */
  border-top-right-radius: var(--corner-radius);
  overflow: hidden;
  max-width: 100%;
}

/* 旋转渐变边框 - 更鲜艳的绿色/青色主题 */
.enhanced-wrapper::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  /* 使用对角线长度确保覆盖矩形容器 */
  width: max(200%, 200vh);
  height: max(200%, 200vh);
  background: conic-gradient(
    from 0deg,
    #22c55e,
    #10b981,
    #06b6d4,
    #0ea5e9,
    transparent 25%,
    transparent 75%,
    #22c55e
  );
  transform: translate(-50%, -50%);
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 内容区域 - 绿色渐变背景 */
.enhanced-bubble {
  position: relative;
  padding: 0.75rem 1rem;
  border-radius: calc(var(--border-radius) - var(--border-width));
  border-top-right-radius: calc(var(--corner-radius) - var(--border-width));
  /* 绿色渐变背景 */
  background: linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #0d9488 100%);
  color: white;
  margin-bottom: 1px;
  margin-right: 1px;
}
</style>

<!-- 非 scoped 样式用于暗黑模式 -->
<style>
.dark .enhanced-bubble {
  /* 暗色模式下稍微调暗 */
  background: linear-gradient(135deg, #059669 0%, #0d9488 50%, #0f766e 100%) !important;
}
</style>
