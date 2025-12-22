<script setup lang="ts">
/**
 * 总结消息组件
 * 科技感样式，使用 Markdown 渲染内容
 */
import EMarkdown from '@/components/EMarkdown.vue';
import type { TextMessageData } from '@/composable/task/useChat';

defineProps<{
  data: TextMessageData;
}>();
</script>

<template>
  <div class="summary-message">
    <div class="summary-header">
      <span class="summary-title">总结</span>
    </div>
    <div class="summary-content">
      <EMarkdown :model-value="data.content" mode="preview" editor-id="summary-preview" />
    </div>
  </div>
</template>

<style scoped>
/* 总结消息 - 科技感样式 */
.summary-message {
  position: relative;
  padding: 1rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
  border: 1px solid rgba(99, 102, 241, 0.3);
  backdrop-filter: blur(8px);
}

.summary-message::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #6366f1, #a855f7, #6366f1);
  border-radius: 0.75rem 0.75rem 0 0;
  animation: shimmer 2s ease-in-out infinite;
  overflow: hidden;
}

/* 确保容器裁剪溢出内容 */
.summary-message {
  overflow: hidden;
}

@keyframes shimmer {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
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
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%);
  border-color: rgba(99, 102, 241, 0.4);
}
</style>
