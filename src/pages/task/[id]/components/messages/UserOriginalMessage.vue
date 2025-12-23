<script setup lang="ts">
/**
 * 用户原始消息组件
 * 用于渲染 user_original 类型的消息
 * 开启增强模式时的用户原始输入，带"原始"标签
 */
import { NTag } from 'naive-ui';
import type { TextMessageData } from '@/composable/task/useChat';

defineProps<{
  data: TextMessageData;
}>();
</script>

<template>
  <div>
    <!-- 原始标签 -->
    <div class="mb-1.5 flex justify-end">
      <NTag type="default" size="small" round>原始输入</NTag>
    </div>
    <!-- 消息文本 -->
    <p class="text-sm whitespace-pre-wrap">{{ data.content }}</p>
  </div>
</template>
