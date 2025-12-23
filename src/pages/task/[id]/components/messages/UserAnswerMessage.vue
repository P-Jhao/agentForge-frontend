<script setup lang="ts">
/**
 * 用户回复消息组件
 * 用于渲染 user_answer 类型的消息
 * 智能迭代中用户对澄清问题的回复，带"回复"标签
 */
import { NTag } from 'naive-ui';
import type { TextMessageData } from '@/composable/task/useChat';

defineProps<{
  data: TextMessageData;
}>();
</script>

<template>
  <div>
    <!-- 回复标签 -->
    <div class="mb-1.5 flex justify-end">
      <NTag type="info" size="small" round>回复</NTag>
    </div>
    <!-- 消息文本 -->
    <p class="text-sm whitespace-pre-wrap">{{ data.content }}</p>
  </div>
</template>
