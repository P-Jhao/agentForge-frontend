<script setup lang="ts">
/**
 * 我的 MCP 页面
 * 展示用户自定义的所有 MCP
 */
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NIcon, NInput, NEmpty } from 'naive-ui';
import { ArrowBackOutline, SearchOutline, AddOutline } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';
import { customMcpList } from '@/mocks/mcp';
import McpCard from '../components/McpCard.vue';

const router = useRouter();
const themeStore = useThemeStore();

// 搜索关键词
const searchKeyword = ref('');

// 筛选后的列表
const filteredList = computed(() => {
  if (!searchKeyword.value.trim()) {
    return customMcpList;
  }
  const keyword = searchKeyword.value.toLowerCase();
  return customMcpList.filter(
    (mcp) =>
      mcp.name.toLowerCase().includes(keyword) || mcp.description.toLowerCase().includes(keyword)
  );
});

// 返回上一页
function handleBack() {
  router.back();
}

// 新建 MCP
function handleAdd() {
  router.push('/mcp/add');
}
</script>

<template>
  <div class="my-mcp">
    <!-- 头部：返回 + 标题 + 新建按钮 -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <NButton quaternary circle @click="handleBack">
          <template #icon>
            <NIcon :component="ArrowBackOutline" />
          </template>
        </NButton>
        <h1 class="text-theme text-2xl font-bold">我的 MCP</h1>
      </div>
      <NButton
        type="primary"
        :class="themeStore.isDark ? 'btn-glow' : 'btn-gradient'"
        @click="handleAdd"
      >
        <template #icon>
          <NIcon :component="AddOutline" />
        </template>
        新建MCP
      </NButton>
    </div>

    <!-- 搜索框 -->
    <div class="mb-6">
      <NInput
        v-model:value="searchKeyword"
        placeholder="搜索 MCP 名称、描述"
        clearable
        style="max-width: 320px"
      >
        <template #prefix>
          <NIcon :component="SearchOutline" />
        </template>
      </NInput>
    </div>

    <!-- MCP 列表 -->
    <div
      v-if="filteredList.length > 0"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <McpCard v-for="mcp in filteredList" :key="mcp.id" :mcp="mcp" />
    </div>

    <!-- 空状态 -->
    <NEmpty v-else description="暂无自定义 MCP" class="py-16">
      <template #extra>
        <NButton type="primary" @click="handleAdd">立即创建</NButton>
      </template>
    </NEmpty>
  </div>
</template>
