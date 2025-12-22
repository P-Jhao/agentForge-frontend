<script setup lang="ts">
/**
 * 思考消息组件
 * 显示 AI 的思考过程，带有特殊前缀和样式
 */
import type { TextMessageData } from '@/composable/task/useChat';

defineProps<{
  data: TextMessageData;
}>();
</script>

<template>
  <p class="text-thinking text-sm whitespace-pre-wrap">
    <span>💭</span>
    {{ data.content }}
  </p>
</template>
