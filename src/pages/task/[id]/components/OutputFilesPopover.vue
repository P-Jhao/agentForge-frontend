<script setup lang="ts">
/**
 * 输出文件列表弹出层组件
 * 显示当前会话中所有工具产生的输出文件
 */
import { computed } from 'vue';
import { NPopover, NIcon, NButton, NEmpty, NTooltip } from 'naive-ui';
import { FolderOpenOutline, DocumentText, Download } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';
import type { OutputFileInfo } from '@/types';

interface Props {
  files: OutputFileInfo[];
}

const props = defineProps<Props>();

const themeStore = useThemeStore();

// 是否有文件
const hasFiles = computed(() => props.files.length > 0);

// 根据文件扩展名获取图标颜色
const getFileIconColor = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const colorMap: Record<string, string> = {
    md: '#6366f1', // 紫色
    json: '#f59e0b', // 橙色
    txt: '#6b7280', // 灰色
    csv: '#10b981', // 绿色
    xml: '#ef4444', // 红色
    xlsx: '#22c55e', // 绿色
    xls: '#22c55e',
    pdf: '#dc2626', // 红色
    html: '#f97316', // 橙色
  };
  return colorMap[ext] || '#6b7280';
};

// 格式化文件大小
const formatSize = (size: number) => {
  if (size < 1024) {
    return `${size.toFixed(2)} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
};

// 下载文件
const handleDownload = (file: OutputFileInfo) => {
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.name;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 弹出层样式
const popoverStyle = computed(() => {
  if (themeStore.isDark) {
    return {
      background: 'rgba(30, 30, 40, 0.98)',
      border: '1px solid rgba(75, 85, 99, 0.5)',
    };
  }
  return {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
  };
});
</script>

<template>
  <NPopover trigger="click" placement="bottom-end" :style="popoverStyle">
    <template #trigger>
      <NTooltip trigger="hover">
        <template #trigger>
          <NButton quaternary circle>
            <template #icon>
              <NIcon :size="20">
                <FolderOpenOutline />
              </NIcon>
            </template>
          </NButton>
        </template>
        文件列表
      </NTooltip>
    </template>

    <!-- 弹出层内容 -->
    <div class="output-files-popover">
      <div class="popover-header">
        <span class="font-medium">文件列表</span>
        <span class="text-xs opacity-50">{{ files.length }} 个文件</span>
      </div>

      <!-- 文件列表 -->
      <div v-if="hasFiles" class="file-list">
        <div v-for="file in files" :key="file.path" class="file-item" @click="handleDownload(file)">
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <NIcon :component="DocumentText" :size="18" :color="getFileIconColor(file.name)" />
            <span class="flex-1 truncate">{{ file.name }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs whitespace-nowrap opacity-50">{{ formatSize(file.size) }}</span>
            <NIcon :component="Download" :size="14" class="opacity-50" />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <NEmpty description="暂无输出文件" size="small" />
      </div>
    </div>
  </NPopover>
</template>

<style scoped>
.output-files-popover {
  width: 320px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-item:hover {
  background: rgba(128, 128, 128, 0.1);
}

.empty-state {
  padding: 24px 16px;
}

/* 滚动条样式 */
.file-list::-webkit-scrollbar {
  width: 4px;
}

.file-list::-webkit-scrollbar-track {
  background: transparent;
}

.file-list::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.3);
  border-radius: 2px;
}
</style>
