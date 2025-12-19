<script setup lang="ts">
/**
 * MCP 工具选择器组件
 * 显示已选择的 MCP 及其工具，支持添加/删除
 */
import { ref, computed } from 'vue';
import {
  NButton,
  NIcon,
  NTag,
  NModal,
  NInput,
  NSpin,
  NCheckbox,
  NCheckboxGroup,
  NScrollbar,
} from 'naive-ui';
import { AddOutline, TrashOutline, ChevronForward } from '@vicons/ionicons5';
import { useThemeStore, useMCPStore } from '@/stores';
import { getMCPDetail } from '@/utils';
import type { MCPToolSelection } from '@/types';
import type { MCPTool, MCPDetail, MCP } from '@/types';

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

// 弹窗显示状态
const showModal = ref(false);

// 搜索关键词
const searchKeyword = ref('');

// 当前选中的 MCP（用于显示工具列表）
const selectedMcpId = ref<number | null>(null);

// MCP 详情缓存（mcpId -> MCPDetail）
const mcpDetails = ref<Map<number, MCPDetail>>(new Map());

// 加载工具列表状态
const loadingTools = ref(false);

// 临时选择的工具（弹窗内使用）
const tempSelectedTools = ref<string[]>([]);

// 过滤后的 MCP 列表
const filteredMcpList = computed(() => {
  if (!searchKeyword.value) return mcpStore.mcpList;
  const keyword = searchKeyword.value.toLowerCase();
  return mcpStore.mcpList.filter((mcp) => mcp.name.toLowerCase().includes(keyword));
});

// 获取 MCP 名称
const getMcpName = (mcpId: number): string => {
  const mcp = mcpStore.mcpList.find((m) => m.id === mcpId);
  return mcp?.name || `MCP ${mcpId}`;
};

// 获取 MCP 的工具列表
const getMCPTools = (mcpId: number): MCPTool[] => {
  const detail = mcpDetails.value.get(mcpId);
  return detail?.tools || [];
};

// 获取 MCP 详情（含工具列表）
const fetchMCPDetail = async (mcpId: number) => {
  if (mcpDetails.value.has(mcpId)) return;

  loadingTools.value = true;
  try {
    const detail = await getMCPDetail(mcpId);
    mcpDetails.value.set(mcpId, detail);
  } catch (error) {
    console.error(`获取 MCP ${mcpId} 详情失败:`, error);
  } finally {
    loadingTools.value = false;
  }
};

// 选择 MCP（左侧列表点击）
const handleSelectMcp = async (mcp: MCP) => {
  selectedMcpId.value = mcp.id;
  await fetchMCPDetail(mcp.id);

  // 初始化临时选择（如果已有选择则恢复）
  const existing = props.modelValue.find((s) => s.mcpId === mcp.id);
  tempSelectedTools.value = existing?.tools.map((t) => t.name) || [];
};

// 确认添加 MCP 工具
const handleConfirmAdd = () => {
  if (!selectedMcpId.value) return;

  const tools = getMCPTools(selectedMcpId.value);
  const selectedTools = tools
    .filter((t) => tempSelectedTools.value.includes(t.name))
    .map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));

  // 更新 modelValue
  const newValue = props.modelValue.filter((s) => s.mcpId !== selectedMcpId.value);
  if (selectedTools.length > 0) {
    newValue.push({ mcpId: selectedMcpId.value, tools: selectedTools });
  }

  emit('update:modelValue', newValue);
  showModal.value = false;
  selectedMcpId.value = null;
  tempSelectedTools.value = [];
};

// 删除整个 MCP
const handleRemoveMcp = (mcpId: number) => {
  const newValue = props.modelValue.filter((s) => s.mcpId !== mcpId);
  emit('update:modelValue', newValue);
};

// 删除单个工具
const handleRemoveTool = (mcpId: number, toolName: string) => {
  const newValue = props.modelValue
    .map((s) => {
      if (s.mcpId !== mcpId) return s;
      return {
        ...s,
        tools: s.tools.filter((t) => t.name !== toolName),
      };
    })
    .filter((s) => s.tools.length > 0);

  emit('update:modelValue', newValue);
};

// 打开添加弹窗
const handleOpenModal = async () => {
  showModal.value = true;
  searchKeyword.value = '';
  selectedMcpId.value = null;
  tempSelectedTools.value = [];
  await mcpStore.fetchMCPList();
};

// 全选/取消全选
const handleToggleAll = () => {
  if (!selectedMcpId.value) return;
  const tools = getMCPTools(selectedMcpId.value);

  if (tempSelectedTools.value.length === tools.length) {
    tempSelectedTools.value = [];
  } else {
    tempSelectedTools.value = tools.map((t) => t.name);
  }
};

// 判断是否全选
const isAllSelected = computed(() => {
  if (!selectedMcpId.value) return false;
  const tools = getMCPTools(selectedMcpId.value);
  return tools.length > 0 && tempSelectedTools.value.length === tools.length;
});

// 判断是否部分选中
const isIndeterminate = computed(() => {
  if (!selectedMcpId.value) return false;
  const tools = getMCPTools(selectedMcpId.value);
  return tempSelectedTools.value.length > 0 && tempSelectedTools.value.length < tools.length;
});
</script>

<template>
  <div class="mcp-tool-selector">
    <!-- 已选择的 MCP 列表 -->
    <div class="space-y-3">
      <div
        v-for="selection in modelValue"
        :key="selection.mcpId"
        class="rounded-lg border p-3"
        :class="themeStore.isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'"
      >
        <!-- MCP 标题行 -->
        <div class="mb-2 flex items-center justify-between">
          <span class="font-medium">{{ getMcpName(selection.mcpId) }}</span>
          <NButton quaternary circle size="small" @click="handleRemoveMcp(selection.mcpId)">
            <template #icon>
              <NIcon :component="TrashOutline" />
            </template>
          </NButton>
        </div>

        <!-- 工具标签 -->
        <div class="flex flex-wrap gap-2">
          <NTag
            v-for="tool in selection.tools"
            :key="tool.name"
            closable
            size="small"
            @close="handleRemoveTool(selection.mcpId, tool.name)"
          >
            {{ tool.name }}
          </NTag>
        </div>
      </div>
    </div>

    <!-- 添加 MCP 按钮 -->
    <NButton dashed block class="mt-3" @click="handleOpenModal">
      <template #icon>
        <NIcon :component="AddOutline" />
      </template>
      添加 MCP
    </NButton>

    <!-- 添加 MCP 弹窗 -->
    <NModal
      v-model:show="showModal"
      preset="card"
      title="选择 MCP 工具"
      style="width: 700px; max-width: 90vw"
      :mask-closable="false"
    >
      <div class="flex h-96 gap-4">
        <!-- 左侧：MCP 列表 -->
        <div
          class="w-48 shrink-0 overflow-hidden rounded-lg border"
          :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'"
        >
          <!-- 搜索框 -->
          <div
            class="border-b p-2"
            :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'"
          >
            <NInput v-model:value="searchKeyword" placeholder="搜索" size="small" clearable />
          </div>

          <!-- MCP 列表 -->
          <NScrollbar style="max-height: calc(100% - 48px)">
            <div v-if="mcpStore.loading" class="flex items-center justify-center py-8">
              <NSpin size="small" />
            </div>
            <div
              v-else-if="filteredMcpList.length === 0"
              class="py-8 text-center text-sm opacity-50"
            >
              暂无 MCP
            </div>
            <div v-else>
              <div
                v-for="mcp in filteredMcpList"
                :key="mcp.id"
                class="flex cursor-pointer items-center justify-between px-3 py-2 transition-colors"
                :class="[
                  selectedMcpId === mcp.id
                    ? 'bg-primary-500/10 text-primary-500'
                    : themeStore.isDark
                      ? 'hover:bg-gray-800'
                      : 'hover:bg-gray-100',
                ]"
                @click="handleSelectMcp(mcp)"
              >
                <span class="truncate text-sm">{{ mcp.name }}</span>
                <NIcon :component="ChevronForward" :size="14" class="shrink-0 opacity-50" />
              </div>
            </div>
          </NScrollbar>
        </div>

        <!-- 右侧：工具列表 -->
        <div
          class="flex-1 overflow-hidden rounded-lg border"
          :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'"
        >
          <!-- 未选择 MCP -->
          <div v-if="!selectedMcpId" class="flex h-full items-center justify-center">
            <span class="text-sm opacity-50">请选择 MCP</span>
          </div>

          <!-- 加载中 -->
          <div v-else-if="loadingTools" class="flex h-full items-center justify-center">
            <NSpin size="small" />
          </div>

          <!-- 工具列表 -->
          <template v-else>
            <!-- 全选按钮 -->
            <div
              class="flex items-center gap-2 border-b px-3 py-2"
              :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'"
            >
              <NCheckbox
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @update:checked="handleToggleAll"
              >
                全选
              </NCheckbox>
              <span class="text-xs opacity-50">
                已选 {{ tempSelectedTools.length }} / {{ getMCPTools(selectedMcpId).length }}
              </span>
            </div>

            <!-- 工具复选框 -->
            <NScrollbar style="max-height: calc(100% - 40px)">
              <NCheckboxGroup v-model:value="tempSelectedTools" class="p-2">
                <div class="space-y-1">
                  <div
                    v-for="tool in getMCPTools(selectedMcpId)"
                    :key="tool.name"
                    class="rounded-lg p-2 transition-colors"
                    :class="themeStore.isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'"
                  >
                    <NCheckbox :value="tool.name">
                      <div>
                        <div class="text-sm font-medium">{{ tool.name }}</div>
                        <div class="text-xs opacity-50">{{ tool.description || '暂无描述' }}</div>
                      </div>
                    </NCheckbox>
                  </div>
                </div>
              </NCheckboxGroup>
            </NScrollbar>
          </template>
        </div>
      </div>

      <!-- 底部按钮 -->
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" :disabled="!selectedMcpId" @click="handleConfirmAdd">
            确认
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
