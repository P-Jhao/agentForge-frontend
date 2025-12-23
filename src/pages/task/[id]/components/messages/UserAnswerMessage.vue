<script setup lang="ts">
/**
 * 用户回复消息组件
 * 用于渲染 user_answer 类型的消息
 * 智能迭代中用户对澄清问题的回复
 */
import type { TextMessageData } from '@/composable/task/useChat';

defineProps<{
  data: TextMessageData;
}>();
</script>

<template>
  <!-- 消息文本 -->
  <p class="text-sm whitespace-pre-wrap">{{ data.content }}</p>
</template>
