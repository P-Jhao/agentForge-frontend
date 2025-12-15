<script setup lang="ts">
/**
 * MCP 广场区域组件
 * Tab 筛选 + 搜索 + 卡片列表
 */
import { ref, computed } from 'vue';
import { NInput, NIcon } from 'naive-ui';
import { SearchOutline } from '@vicons/ionicons5';
import { plazaMcpList } from '@/mocks/mcp';
import McpCard from './McpCard.vue';

// 当前选中的 Tab
type TabType = 'all' | 'official' | 'community';
const activeTab = ref<TabType>('all');

// 搜索关键词
const searchKeyword = ref('');

// Tab 配置
const tabs: { key: TabType; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '📦' },
  { key: 'official', label: '官方', icon: '✨' },
  { key: 'community', label: '用户上传', icon: '👤' },
];

// 筛选后的 MCP 列表
const filteredMcpList = computed(() => {
  let list = plazaMcpList;

  // 按 Tab 筛选
  if (activeTab.value !== 'all') {
    list = list.filter((mcp) => mcp.source === activeTab.value);
  }

  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    list = list.filter(
      (mcp) =>
        mcp.name.toLowerCase().includes(keyword) ||
        mcp.author.toLowerCase().includes(keyword) ||
        mcp.description.toLowerCase().includes(keyword)
    );
  }

  return list;
});
</script>

<template>
  <div>
    <!-- 标题 -->
    <h2 class="text-theme mb-4 text-lg font-semibold">MCP广场</h2>

    <!-- Tab + 搜索 -->
    <div class="mb-4 flex items-center justify-between">
      <!-- Tab 切换 -->
      <div class="flex gap-4">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="flex items-center gap-1 pb-2 text-sm transition-colors"
          :class="
            activeTab === tab.key
              ? 'text-primary-500 border-primary-500 border-b-2 font-medium'
              : 'text-theme-secondary hover:text-theme border-b-2 border-transparent'
          "
          @click="activeTab = tab.key"
        >
          <span>{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- 搜索框 -->
      <NInput
        v-model:value="searchKeyword"
        placeholder="搜索MCP名称、创建人"
        size="small"
        style="width: 240px"
        clearable
      >
        <template #prefix>
          <NIcon :component="SearchOutline" />
        </template>
      </NInput>
    </div>

    <!-- MCP 卡片列表 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <McpCard v-for="mcp in filteredMcpList" :key="mcp.id" :mcp="mcp" />
    </div>

    <!-- 空状态 -->
    <div v-if="filteredMcpList.length === 0" class="text-theme-muted py-12 text-center">
      暂无匹配的 MCP
    </div>
  </div>
</template>
