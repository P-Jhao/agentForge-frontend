<script setup lang="ts">
/**
 * 用户消息组件
 * 显示用户发送的文本和文件附件
 */
import { NIcon } from 'naive-ui';
import { DocumentTextOutline } from '@vicons/ionicons5';
import type { UserMessageData } from '@/composable/task/useChat';

defineProps<{
  data: UserMessageData;
}>();

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
</script>

<template>
  <div>
    <!-- 文件附件（如果有） -->
    <div v-if="data.files && data.files.length > 0" class="mb-2 flex flex-wrap gap-2">
      <div
        v-for="file in data.files"
        :key="file.filePath"
        class="flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-xs"
      >
        <NIcon :component="DocumentTextOutline" :size="16" />
        <span class="max-w-[150px] truncate">{{ file.originalName }}</span>
        <span class="opacity-70">{{ formatFileSize(file.size) }}</span>
      </div>
    </div>
    <!-- 消息文本 -->
    <p class="text-sm whitespace-pre-wrap">{{ data.content }}</p>
  </div>
</template>
