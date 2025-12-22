<script setup lang="ts">
/**
 * AI 文本消息组件
 * 使用 Markdown 渲染内容，内容为空时显示加载状态
 */
import { computed } from 'vue';
import { NSpin } from 'naive-ui';
import EMarkdown from '@/components/EMarkdown.vue';
import type { TextMessageData } from '@/composable/task/useChat';

const props = defineProps<{
  data: TextMessageData;
}>();

// 是否显示加载状态（内容为空时）
const showLoading = computed(() => !props.data.content);
</script>

<template>
  <NSpin v-if="showLoading" size="small" />
  <EMarkdown v-else :model-value="data.content" mode="preview" editor-id="chat-preview" />
</template>
