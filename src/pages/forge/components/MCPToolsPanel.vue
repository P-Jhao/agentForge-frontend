<script setup lang="ts">
/**
 * MCP 工具展示面板
 * 展示 Forge 关联的 MCP 及其启用的工具
 * 支持点击跳转到 MCP 详情页
 */
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NIcon, NEmpty, NTag } from 'naive-ui';
import { ChevronForwardOutline, ConstructOutline } from '@vicons/ionicons5';
import { useMCPStore, useThemeStore } from '@/stores';
import type { MCPToolSelection } from '@/types';

interface Props {
  mcpTools?: MCPToolSelection[];
}

const props = defineProps<Props>();

const router = useRouter();
const mcpStore = useMCPStore();
const themeStore = useThemeStore();

// 在组件挂载时加载 MCP 列表
onMounted(async () => {
  if (mcpStore.mcpList.length === 0) {
    await mcpStore.fetchMCPList();
  }
});

// 获取 MCP 信息（包括状态）
const getMCPInfo = (mcpId: number) => {
  return mcpStore.mcpList.find((m) => m.id === mcpId);
};

// MCP 状态颜色
const getStatusColor = (status: string) => {
  if (status === 'connected') return '#10b981'; // 绿色
  if (status === 'closed') return '#6b7280'; // 灰色
  return '#ef4444'; // 红色
};

// MCP 状态文本
const getStatusText = (status: string) => {
  if (status === 'connected') return '连通成功';
  if (status === 'closed') return '已关闭';
  return '连通失败';
};

// 跳转到 MCP 详情页
const handleNavigateToMCP = (mcpId: number) => {
  router.push(`/mcp/${mcpId}`);
};

// 是否有 MCP 工具
const hasMCPTools = computed(() => {
  return props.mcpTools && props.mcpTools.length > 0;
});

// 工具总数
const totalToolsCount = computed(() => {
  if (!props.mcpTools) return 0;
  return props.mcpTools.reduce((sum, selection) => sum + selection.tools.length, 0);
});
</script>

<template>
  <div
    class="mcp-tools-panel flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
  >
    <!-- 标题 -->
    <div class="mb-4 flex items-center gap-2">
      <div class="icon-bg-emerald flex h-8 w-8 items-center justify-center rounded-lg">
        <NIcon :component="ConstructOutline" :size="18" class="text-emerald-500" />
      </div>
      <h3 class="text-theme font-semibold">MCP 工具</h3>
      <span class="text-theme-muted ml-auto text-xs">{{ totalToolsCount }} 个工具</span>
    </div>

    <!-- 内容区域 -->
    <div class="min-h-0 flex-1 overflow-auto">
      <!-- 空状态 -->
      <div v-if="!hasMCPTools" class="flex h-full items-center justify-center">
        <NEmpty size="small" description="暂未配置 MCP 工具" />
      </div>

      <!-- MCP 列表 -->
      <div v-else class="space-y-3">
        <div
          v-for="selection in mcpTools"
          :key="selection.mcpId"
          class="group hover:border-primary-300 dark:hover:border-primary-500/50 cursor-pointer rounded-lg border border-gray-200 p-3 transition-all hover:shadow-md dark:border-gray-700"
          @click="handleNavigateToMCP(selection.mcpId)"
        >
          <!-- MCP 头部 -->
          <div class="mb-2 flex items-center justify-between">
            <div class="flex min-w-0 flex-1 items-center gap-2">
              <!-- 状态指示点 -->
              <span
                class="h-2 w-2 shrink-0 rounded-full"
                :style="{
                  backgroundColor: getStatusColor(
                    getMCPInfo(selection.mcpId)?.status || 'disconnected'
                  ),
                }"
                :title="getStatusText(getMCPInfo(selection.mcpId)?.status || 'disconnected')"
              ></span>
              <!-- MCP 名称 -->
              <span class="text-theme truncate text-sm font-medium">
                {{ getMCPInfo(selection.mcpId)?.name || `MCP ${selection.mcpId}` }}
              </span>
            </div>
            <!-- 跳转箭头 -->
            <NIcon
              :component="ChevronForwardOutline"
              :size="16"
              class="text-theme-muted shrink-0 transition-transform group-hover:translate-x-1"
            />
          </div>

          <!-- 工具标签 -->
          <div class="flex flex-wrap gap-1.5">
            <NTag
              v-for="tool in selection.tools"
              :key="tool.name"
              size="small"
              :bordered="false"
              class="text-xs"
              :class="
                themeStore.isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'
              "
            >
              {{ tool.name }}
            </NTag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-bg-emerald {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
}

:deep(.dark) .icon-bg-emerald {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
}
</style>
