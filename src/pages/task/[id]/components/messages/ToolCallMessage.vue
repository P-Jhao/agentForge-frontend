<script setup lang="ts">
/**
 * 工具调用消息组件
 * 包装 ToolCallItem，传递工具调用数据
 */
import type { ToolCallMessageData } from '@/composable/task/useChat';
import ToolCallItem from '../ToolCallItem.vue';

defineProps<{
  data: ToolCallMessageData;
}>();
</script>

<template>
  <ToolCallItem
    :call-id="data.callId"
    :tool-name="data.toolName"
    :status="data.status"
    :success="data.success"
    :summarized-result="data.summarizedResult"
  />
</template>
