<script setup lang="ts">
/**
 * 输出文件卡片组件
 * 显示工具输出的文件信息，点击可查看详情或下载
 */
import { computed } from 'vue';
import { NIcon } from 'naive-ui';
import { DocumentText, CodeSlash, Image, Document, Archive, FileTrayFull } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';
import type { OutputFileInfo } from '@/types';

interface Props {
  file: OutputFileInfo;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [file: OutputFileInfo];
}>();

const themeStore = useThemeStore();

// 根据文件扩展名获取图标
const fileIcon = computed(() => {
  const ext = props.file.name.split('.').pop()?.toLowerCase() || '';
  // 代码文件
  if (['js', 'ts', 'jsx', 'tsx', 'vue', 'py', 'java', 'c', 'cpp', 'h', 'go', 'rs'].includes(ext)) {
    return CodeSlash;
  }
  // 图片文件
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
    return Image;
  }
  // 压缩文件
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
    return Archive;
  }
  // 文本/文档文件
  if (['txt', 'md', 'json', 'xml', 'yaml', 'yml', 'csv', 'log'].includes(ext)) {
    return DocumentText;
  }
  // PDF 等文档
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
    return FileTrayFull;
  }
  // 默认图标
  return Document;
});

// 格式化文件大小
const formattedSize = computed(() => {
  const size = props.file.size;
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
});

// 容器样式
const containerClass = computed(() => {
  const base =
    'inline-flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer transition-all rounded-lg';
  if (themeStore.isDark) {
    return `${base} bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700/50`;
  }
  return `${base} bg-gray-100 hover:bg-gray-200 border border-gray-200`;
});

// 点击处理
const handleClick = () => {
  emit('click', props.file);
};
</script>

<template>
  <div :class="containerClass" @click="handleClick">
    <NIcon :component="fileIcon" :size="16" class="opacity-70" />
    <span class="max-w-[150px] truncate">{{ file.name }}</span>
    <span class="text-xs opacity-50">{{ formattedSize }}</span>
  </div>
</template>
