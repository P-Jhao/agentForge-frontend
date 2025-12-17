<script setup lang="ts">
/**
 * MCP 管理页面
 * 展示所有 MCP 列表，支持搜索
 * 管理员可以新建、编辑、删除 MCP
 */
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NIcon, NInput, NEmpty, NSpin } from 'naive-ui';
import { AddOutline, SearchOutline } from '@vicons/ionicons5';
import { useThemeStore, useUserStore, useMCPStore } from '@/stores';
import McpCard from './components/McpCard.vue';

const router = useRouter();
const themeStore = useThemeStore();
const userStore = useUserStore();
const mcpStore = useMCPStore();

// 搜索关键词
const searchKeyword = ref('');

// 搜索防抖定时器
let searchTimer: ReturnType<typeof setTimeout> | null = null;

// 初始化加载 MCP 列表
onMounted(async () => {
  await mcpStore.fetchMCPList();
});

// 搜索 MCP（防抖）
function handleSearch() {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  searchTimer = setTimeout(async () => {
    await mcpStore.fetchMCPList(searchKeyword.value);
  }, 300);
}

// 跳转到新建 MCP 页面
function handleAddMcp() {
  router.push('/mcp/create');
}

// 跳转到 MCP 详情页
function handleMcpClick(id: number) {
  router.push(`/mcp/${id}`);
}
</script>

<template>
  <div class="mcp-manage">
    <!-- 页面头部 -->
    <div class="mb-6 flex items-start justify-between">
      <div>
        <h1 class="text-theme mb-2 text-2xl font-bold">MCP 管理</h1>
        <p class="text-theme-secondary text-sm leading-relaxed">
          MCP（Model Context Protocol）用于集成 LLM 工具，扩展 Forge 的能力。
        </p>
      </div>
      <!-- 新建按钮（仅管理员可见） -->
      <NButton
        v-if="userStore.isAdmin"
        type="primary"
        :class="themeStore.isDark ? 'btn-glow' : 'btn-gradient'"
        @click="handleAddMcp"
      >
        <template #icon>
          <NIcon :component="AddOutline" />
        </template>
        新建 MCP
      </NButton>
    </div>

    <!-- 搜索框 -->
    <div class="mb-6">
      <NInput
        v-model:value="searchKeyword"
        placeholder="搜索 MCP 名称、描述"
        clearable
        style="max-width: 320px"
        @input="handleSearch"
        @clear="handleSearch"
      >
        <template #prefix>
          <NIcon :component="SearchOutline" />
        </template>
      </NInput>
    </div>

    <!-- 加载状态 -->
    <NSpin v-if="mcpStore.loading" class="flex justify-center py-16" />

    <!-- MCP 列表 -->
    <div
      v-else-if="mcpStore.mcpList.length > 0"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <McpCard
        v-for="mcp in mcpStore.mcpList"
        :key="mcp.id"
        :mcp="mcp"
        @click="handleMcpClick(mcp.id)"
      />
    </div>

    <!-- 空状态 -->
    <NEmpty v-else description="暂无 MCP" class="py-16">
      <template v-if="userStore.isAdmin" #extra>
        <NButton type="primary" @click="handleAddMcp">立即创建</NButton>
      </template>
    </NEmpty>
  </div>
</template>
