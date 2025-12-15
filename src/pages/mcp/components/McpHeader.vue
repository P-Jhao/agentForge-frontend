<script setup lang="ts">
/**
 * MCP 页面头部组件
 * 标题 + 描述 + 新建按钮
 */
import { useRouter } from 'vue-router';
import { NButton, NIcon } from 'naive-ui';
import { AddOutline } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';

const router = useRouter();
const themeStore = useThemeStore();

// 跳转到新建 MCP 页面
function handleAddMcp() {
  router.push('/mcp/add');
}
</script>

<template>
  <div class="mb-6 flex items-start justify-between">
    <div>
      <h1 class="text-theme mb-2 text-2xl font-bold">MCP管理</h1>
      <p class="text-theme-secondary text-sm leading-relaxed">
        MCP广场支持sse云端、sse客户端、stdio本地mcp三种模式的安装和使用。MCP模型上下文协议允许与本地的MCP服务器通信，您可以自定义提供额外的工具和资源来扩展技能的能力。Web端仅支持查看和使用sse云端模式，桌面端支持sse云端、sse客户端和stdio本地三种模式，您可以点击此处下载桌面端。
      </p>
    </div>
    <NButton
      type="primary"
      :class="themeStore.isDark ? 'btn-glow' : 'btn-gradient'"
      @click="handleAddMcp"
    >
      <template #icon>
        <NIcon :component="AddOutline" />
      </template>
      新建MCP
    </NButton>
  </div>
</template>
