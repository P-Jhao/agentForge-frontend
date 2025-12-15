<script setup lang="ts">
/**
 * 自定义 MCP 区域组件
 */
import { useRouter } from 'vue-router';
import { customMcpList } from '@/mocks/mcp';
import McpCard from './McpCard.vue';

const router = useRouter();

// 查看更多
function handleViewMore() {
  router.push('/mcp/my');
}
</script>

<template>
  <div class="mb-8">
    <!-- 标题 + 查看更多 -->
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-theme text-lg font-semibold">自定义MCP</h2>
      <button
        class="text-primary-500 hover:text-primary-600 text-sm transition-colors"
        @click="handleViewMore"
      >
        查看更多 &gt;
      </button>
    </div>

    <!-- MCP 卡片列表 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <McpCard v-for="mcp in customMcpList" :key="mcp.id" :mcp="mcp" />
    </div>

    <!-- 空状态 -->
    <div
      v-if="customMcpList.length === 0"
      class="text-theme-muted rounded-xl border border-dashed border-gray-300 py-12 text-center dark:border-white/20"
    >
      暂无自定义 MCP，点击右上角"新建MCP"添加
    </div>
  </div>
</template>
