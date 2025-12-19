<script setup lang="ts">
/**
 * MCP 工具选择器组件
 * 支持选择 MCP 及其下的具体工具
 */
import { ref, computed, watch, onMounted } from 'vue';
import { NCollapse, NCollapseItem, NCheckbox, NCheckboxGroup, NSpin, NEmpty } from 'naive-ui';
import { useThemeStore, useMCPStore } from '@/stores';
import { getMCPDetail } from '@/utils';
import type { MCPToolSelection } from '@/types';
import type { MCPTool, MCPDetail } from '@/types';

interface Props {
  // 已选择的工具（v-model）
  modelValue: MCPToolSelection[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: MCPToolSelection[]];
}>();

const themeStore = useThemeStore();
const mcpStore = useMCPStore();

// MCP 详情缓存（mcpId -> MCPDetail）
const mcpDetails = ref<Map<number, MCPDetail>>(new Map());

// 加载状态
const loading = ref(false);

// 展开的 MCP ID 列表
const expandedNames = ref<string[]>([]);

// 加载 MCP 列表
onMounted(async () => {
  await mcpStore.fetchMCPList();
});

// 获取 MCP 详情（含工具列表）
const fetchMCPDetail = async (mcpId: number) => {
  if (mcpDetails.value.has(mcpId)) return;

  try {
    const detail = await getMCPDetail(mcpId);
    mcpDetails.value.set(mcpId, detail);
  } catch (error) {
    console.error(`获取 MCP ${mcpId} 详情失败:`, error);
  }
};

// 监听展开状态，加载对应 MCP 的工具列表
watch(expandedNames, async (names) => {
  for (const name of names) {
    const mcpId = parseInt(name, 10);
    if (!isNaN(mcpId)) {
      await fetchMCPDetail(mcpId);
    }
  }
});

// 获取 MCP 的工具列表
const getMCPTools = (mcpId: number): MCPTool[] => {
  const detail = mcpDetails.value.get(mcpId);
  return detail?.tools || [];
};

// 获取 MCP 已选择的工具名称列表
const getSelectedToolNames = (mcpId: number): string[] => {
  const selection = props.modelValue.find((s) => s.mcpId === mcpId);
  return selection?.tools.map((t) => t.name) || [];
};

// 获取 MCP 已启用的工具数量
const getEnabledToolCount = (mcpId: number): number => {
  return getSelectedToolNames(mcpId).length;
};

// 处理工具选择变化
const handleToolChange = (mcpId: number, selectedNames: string[]) => {
  const tools = getMCPTools(mcpId);
  const selectedTools = tools
    .filter((t) => selectedNames.includes(t.name))
    .map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));

  // 更新 modelValue
  const newValue = props.modelValue.filter((s) => s.mcpId !== mcpId);
  if (selectedTools.length > 0) {
    newValue.push({ mcpId, tools: selectedTools });
  }

  emit('update:modelValue', newValue);
};

// 全选/取消全选某个 MCP 的工具
const toggleAllTools = (mcpId: number) => {
  const tools = getMCPTools(mcpId);
  const currentSelected = getSelectedToolNames(mcpId);

  if (currentSelected.length === tools.length) {
    // 已全选，取消全选
    handleToolChange(mcpId, []);
  } else {
    // 未全选，全选
    handleToolChange(
      mcpId,
      tools.map((t) => t.name)
    );
  }
};

// 判断是否全选
const isAllSelected = (mcpId: number): boolean => {
  const tools = getMCPTools(mcpId);
  const selected = getSelectedToolNames(mcpId);
  return tools.length > 0 && selected.length === tools.length;
};

// 判断是否部分选中
const isIndeterminate = (mcpId: number): boolean => {
  const tools = getMCPTools(mcpId);
  const selected = getSelectedToolNames(mcpId);
  return selected.length > 0 && selected.length < tools.length;
};
</script>

<template>
  <div class="mcp-tool-selector">
    <!-- 加载状态 -->
    <div v-if="mcpStore.loading" class="flex items-center justify-center py-4">
      <NSpin size="small" />
    </div>

    <!-- 空状态 -->
    <NEmpty v-else-if="mcpStore.mcpList.length === 0" description="暂无可用的 MCP" />

    <!-- MCP 列表 -->
    <NCollapse v-else v-model:expanded-names="expandedNames" accordion>
      <NCollapseItem v-for="mcp in mcpStore.mcpList" :key="mcp.id" :name="String(mcp.id)">
        <!-- 标题：MCP 名称 + 已启用工具数 -->
        <template #header>
          <div class="flex items-center gap-2">
            <NCheckbox
              :checked="isAllSelected(mcp.id)"
              :indeterminate="isIndeterminate(mcp.id)"
              @click.stop
              @update:checked="toggleAllTools(mcp.id)"
            />
            <span class="font-medium">{{ mcp.name }}</span>
            <span v-if="getEnabledToolCount(mcp.id) > 0" class="text-primary-500 text-xs">
              已启用 {{ getEnabledToolCount(mcp.id) }} 个工具
            </span>
          </div>
        </template>

        <!-- 工具列表 -->
        <div class="pl-6">
          <!-- 加载工具中 -->
          <div v-if="!mcpDetails.has(mcp.id)" class="flex items-center gap-2 py-2">
            <NSpin size="tiny" />
            <span class="text-theme-secondary text-sm">加载工具列表...</span>
          </div>

          <!-- 无工具 -->
          <div
            v-else-if="getMCPTools(mcp.id).length === 0"
            class="text-theme-secondary py-2 text-sm"
          >
            该 MCP 暂无可用工具
          </div>

          <!-- 工具复选框组 -->
          <NCheckboxGroup
            v-else
            :value="getSelectedToolNames(mcp.id)"
            @update:value="(v) => handleToolChange(mcp.id, v as string[])"
          >
            <div class="space-y-2">
              <div
                v-for="tool in getMCPTools(mcp.id)"
                :key="tool.name"
                class="flex items-start gap-2 rounded-lg p-2 transition-colors"
                :class="themeStore.isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'"
              >
                <NCheckbox :value="tool.name" class="mt-0.5" />
                <div class="min-w-0 flex-1">
                  <div class="text-theme text-sm font-medium">{{ tool.name }}</div>
                  <div class="text-theme-secondary text-xs">
                    {{ tool.description || '暂无描述' }}
                  </div>
                </div>
              </div>
            </div>
          </NCheckboxGroup>
        </div>
      </NCollapseItem>
    </NCollapse>
  </div>
</template>
