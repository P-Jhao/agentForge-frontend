<script setup lang="ts">
/**
 * AI 文本消息组件
 * 显示 AI 回复的文本内容，内容为空时显示加载状态
 */
import { computed } from 'vue';
import { NSpin } from 'naive-ui';
import type { TextMessageData } from '@/composable/task/useChat';

const props = defineProps<{
  data: TextMessageData;
}>();

// 是否显示加载状态（内容为空时）
const showLoading = computed(() => !props.data.content);
</script>

<template>
  <NSpin v-if="showLoading" size="small" />
  <p v-else class="text-sm whitespace-pre-wrap">{{ data.content }}</p>
</template>
