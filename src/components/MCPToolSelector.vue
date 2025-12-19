<script setup lang="ts">
/**
 * MCP 工具选择器组件
 * 显示已选择的 MCP 及其工具，支持添加/删除
 * 科技感设计风格
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
import { AddOutline, TrashOutline, ChevronForward, CloseOutline } from '@vicons/ionicons5';
import { useMCPStore, useThemeStore } from '@/stores';
import { getMCPDetail } from '@/utils';
import type { MCPToolSelection } from '@/types';
import type { MCPTool, MCPDetail, MCP } from '@/types';

interface Props {
  modelValue: MCPToolSelection[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: MCPToolSelection[]];
}>();

const mcpStore = useMCPStore();
const themeStore = useThemeStore();

// 弹窗显示状态
const showModal = ref(false);

// 搜索关键词
const searchKeyword = ref('');

// 当前选中的 MCP
const selectedMcpId = ref<number | null>(null);

// MCP 详情缓存
const mcpDetails = ref<Map<number, MCPDetail>>(new Map());

// 加载工具列表状态
const loadingTools = ref(false);

// 临时选择的工具
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

// 获取 MCP 详情
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

// 选择 MCP
const handleSelectMcp = async (mcp: MCP) => {
  selectedMcpId.value = mcp.id;
  await fetchMCPDetail(mcp.id);

  const existing = props.modelValue.find((s) => s.mcpId === mcp.id);
  tempSelectedTools.value = existing?.tools.map((t) => t.name) || [];
};

// 确认添加
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
      return { ...s, tools: s.tools.filter((t) => t.name !== toolName) };
    })
    .filter((s) => s.tools.length > 0);

  emit('update:modelValue', newValue);
};

// 打开弹窗
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
    <div class="space-y-4">
      <div
        v-for="selection in modelValue"
        :key="selection.mcpId"
        class="group relative rounded-lg border p-4 transition-all"
        :class="
          themeStore.isDark
            ? 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50 hover:bg-gray-800/50'
            : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
        "
        style="backdrop-filter: blur(8px)"
      >
        <!-- MCP 标题行 -->
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div
              class="h-2 w-2 rounded-full bg-emerald-500"
              :style="themeStore.isDark ? 'box-shadow: 0 0 8px rgba(16, 185, 129, 0.6)' : ''"
            ></div>
            <span class="text-theme font-medium">{{ getMcpName(selection.mcpId) }}</span>
          </div>
          <button
            class="flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100"
            :class="
              themeStore.isDark
                ? 'text-gray-500 hover:bg-red-500/20 hover:text-red-400'
                : 'text-gray-400 hover:bg-red-100 hover:text-red-500'
            "
            @click="handleRemoveMcp(selection.mcpId)"
          >
            <NIcon :component="TrashOutline" :size="16" />
          </button>
        </div>

        <!-- 工具标签 -->
        <div class="flex flex-wrap gap-2">
          <NTag
            v-for="tool in selection.tools"
            :key="tool.name"
            closable
            size="small"
            :bordered="false"
            :class="
              themeStore.isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-200 text-gray-700'
            "
            @close="handleRemoveTool(selection.mcpId, tool.name)"
          >
            {{ tool.name }}
          </NTag>
        </div>
      </div>
    </div>

    <!-- 添加 MCP 按钮 -->
    <button
      class="hover:border-primary-500/50 hover:bg-primary-500/10 hover:text-primary-500 mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-3 text-sm transition-all"
      :class="themeStore.isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'"
      @click="handleOpenModal"
    >
      <NIcon :component="AddOutline" :size="16" />
      <span>添加 MCP</span>
    </button>

    <!-- 添加 MCP 弹窗 -->
    <NModal v-model:show="showModal" :mask-closable="false" transform-origin="center">
      <div
        class="w-[720px] max-w-[90vw] overflow-hidden rounded-xl border"
        :class="themeStore.isDark ? 'border-gray-700/50 bg-gray-900' : 'border-gray-200 bg-white'"
        :style="
          themeStore.isDark
            ? 'box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : 'box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15)'
        "
      >
        <!-- 弹窗头部 -->
        <div
          class="flex items-center justify-between border-b px-6 py-4"
          :class="themeStore.isDark ? 'border-gray-700/50' : 'border-gray-200'"
        >
          <h3 class="text-theme text-lg font-semibold">选择 MCP 工具</h3>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            :class="
              themeStore.isDark
                ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            "
            @click="showModal = false"
          >
            <NIcon :component="CloseOutline" :size="20" />
          </button>
        </div>

        <!-- 弹窗内容 -->
        <div class="flex h-[400px]">
          <!-- 左侧：MCP 列表 -->
          <div
            class="w-56 shrink-0 border-r"
            :class="themeStore.isDark ? 'border-gray-700/50' : 'border-gray-200'"
          >
            <div
              class="border-b p-3"
              :class="themeStore.isDark ? 'border-gray-700/50' : 'border-gray-200'"
            >
              <NInput
                v-model:value="searchKeyword"
                placeholder="搜索 MCP..."
                size="small"
                clearable
              />
            </div>

            <NScrollbar style="height: calc(100% - 56px)">
              <div v-if="mcpStore.loading" class="flex h-full items-center justify-center py-8">
                <NSpin size="small" />
              </div>
              <div
                v-else-if="filteredMcpList.length === 0"
                class="py-8 text-center text-sm text-gray-500"
              >
                暂无可用 MCP
              </div>
              <div v-else class="p-2">
                <div
                  v-for="mcp in filteredMcpList"
                  :key="mcp.id"
                  class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 transition-all"
                  :class="
                    selectedMcpId === mcp.id
                      ? 'bg-primary-500/20 text-primary-500'
                      : themeStore.isDark
                        ? 'hover:bg-gray-800'
                        : 'hover:bg-gray-100'
                  "
                  @click="handleSelectMcp(mcp)"
                >
                  <div
                    class="h-1.5 w-1.5 rounded-full"
                    :class="selectedMcpId === mcp.id ? 'bg-primary-500' : 'bg-gray-400'"
                    :style="
                      selectedMcpId === mcp.id && themeStore.isDark
                        ? 'box-shadow: 0 0 6px rgba(99, 102, 241, 0.6)'
                        : ''
                    "
                  ></div>
                  <span class="text-theme flex-1 truncate text-sm">{{ mcp.name }}</span>
                  <NIcon
                    :component="ChevronForward"
                    :size="14"
                    class="shrink-0"
                    :class="selectedMcpId === mcp.id ? 'opacity-100' : 'opacity-30'"
                  />
                </div>
              </div>
            </NScrollbar>
          </div>

          <!-- 右侧：工具列表 -->
          <div class="flex flex-1 flex-col">
            <!-- 未选择 MCP -->
            <div
              v-if="!selectedMcpId"
              class="flex h-full flex-col items-center justify-center gap-2 text-gray-500"
            >
              <div class="text-3xl opacity-50">🔧</div>
              <span class="text-sm">请选择 MCP</span>
            </div>

            <!-- 加载中 -->
            <div v-else-if="loadingTools" class="flex h-full items-center justify-center">
              <NSpin size="small" />
            </div>

            <!-- 工具列表 -->
            <template v-else>
              <div
                class="flex items-center justify-between border-b px-3 py-2"
                :class="themeStore.isDark ? 'border-gray-700/50' : 'border-gray-200'"
              >
                <NCheckbox
                  :checked="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @update:checked="handleToggleAll"
                >
                  <span class="text-sm">全选</span>
                </NCheckbox>
                <span class="text-xs text-gray-500">
                  {{ tempSelectedTools.length }} / {{ getMCPTools(selectedMcpId).length }}
                </span>
              </div>

              <NScrollbar style="flex: 1">
                <NCheckboxGroup v-model:value="tempSelectedTools">
                  <div class="space-y-1 p-3">
                    <div
                      v-for="tool in getMCPTools(selectedMcpId)"
                      :key="tool.name"
                      class="rounded-lg p-3 transition-all"
                      :class="[
                        tempSelectedTools.includes(tool.name)
                          ? 'bg-primary-500/10 ring-primary-500/30 ring-1'
                          : '',
                        themeStore.isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
                      ]"
                    >
                      <NCheckbox :value="tool.name" class="w-full">
                        <div class="ml-1">
                          <div
                            class="text-sm font-medium"
                            :class="themeStore.isDark ? 'text-gray-200' : 'text-gray-800'"
                          >
                            {{ tool.name }}
                          </div>
                          <div class="mt-0.5 text-xs text-gray-500">
                            {{ tool.description || '暂无描述' }}
                          </div>
                        </div>
                      </NCheckbox>
                    </div>
                  </div>
                </NCheckboxGroup>
              </NScrollbar>
            </template>
          </div>
        </div>

        <!-- 弹窗底部 -->
        <div
          class="flex justify-end gap-3 border-t px-6 py-4"
          :class="themeStore.isDark ? 'border-gray-700/50' : 'border-gray-200'"
        >
          <NButton @click="showModal = false">取消</NButton>
          <NButton
            type="primary"
            :disabled="!selectedMcpId || tempSelectedTools.length === 0"
            @click="handleConfirmAdd"
          >
            确认添加
          </NButton>
        </div>
      </div>
    </NModal>
  </div>
</template>
