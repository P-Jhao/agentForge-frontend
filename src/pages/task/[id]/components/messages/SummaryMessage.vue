<script setup lang="ts">
/**
 * 总结消息组件
 * 科技感样式，带边框旋转动画，使用 Markdown 渲染内容
 */
import EMarkdown from '@/components/EMarkdown.vue';
import type { TextMessageData } from '@/composable/task/useChat';

defineProps<{
  data: TextMessageData;
}>();
</script>

<template>
  <div class="summary-wrapper">
    <div class="summary-message">
      <div class="summary-header">
        <span class="summary-title">总结</span>
      </div>
      <div class="summary-content">
        <EMarkdown :model-value="data.content" mode="preview" editor-id="summary-preview" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 外层包装器 - 边框旋转动画容器 */
.summary-wrapper {
  --border-width: 2px;
  --border-radius: 0.75rem;

  position: relative;
  padding: var(--border-width);
  border-radius: var(--border-radius);
  overflow: hidden;
}

/* 旋转渐变边框 */
.summary-wrapper::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  /* 使用对角线长度确保覆盖矩形容器 */
  width: max(200%, 200vh);
  height: max(200%, 200vh);
  background: conic-gradient(
    from 0deg,
    #6366f1,
    #a855f7,
    #ec4899,
    transparent 20%,
    transparent 80%,
    #6366f1
  );
  transform: translate(-50%, -50%);
  animation: rotate 4s linear infinite;
}

@keyframes rotate {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 内容区域 - 默认浅色模式 */
.summary-message {
  position: relative;
  padding: 1rem;
  border-radius: calc(var(--border-radius) - var(--border-width));
  background: rgb(255, 255, 255);
  margin-bottom: 1px;
  margin-right: 1px;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
}

.summary-title {
  font-weight: 600;
  font-size: 0.875rem;
  background: linear-gradient(90deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.summary-content {
  font-size: 0.875rem;
  line-height: 1.6;
}

/* 深色模式适配 */
:global(.dark) .summary-message {
  background: rgb(31, 41, 55);
}

:global(.dark) .summary-header {
  border-bottom-color: rgba(99, 102, 241, 0.3);
}
</style>
