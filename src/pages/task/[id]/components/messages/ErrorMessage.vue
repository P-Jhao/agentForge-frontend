<script setup lang="ts">
/**
 * 错误消息组件
 * 显示错误信息，带有红色样式
 */
import type { TextMessageData } from '@/composable/task/useChat';

defineProps<{
  data: TextMessageData;
}>();
</script>

<template>
  <p class="text-sm whitespace-pre-wrap text-red-500">
    <span>❌</span>
    {{ data.content }}
  </p>
</template>
