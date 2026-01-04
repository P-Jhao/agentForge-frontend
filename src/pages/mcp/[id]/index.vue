<script setup lang="ts">
/**
 * MCP 详情页面
 * 显示 MCP 详细信息、关联的 Forge 列表、工具列表
 * 管理员可以关闭、编辑、删除 MCP，配置工具路径类型
 * 所有用户可以重连 MCP
 * 普通用户可以申请公开自己创建的 MCP
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NButton,
  NIcon,
  NTag,
  NSpin,
  NEmpty,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NCollapse,
  NCollapseItem,
  NSelect,
  NModal,
  NResult,
  useMessage,
  useDialog,
} from 'naive-ui';
import {
  ArrowBackOutline,
  RefreshOutline,
  CreateOutline,
  TrashOutline,
  CloseCircleOutline,
  PlayOutline,
  CloudOutline,
  TerminalOutline,
  ServerOutline,
  SaveOutline,
  GlobeOutline,
  TimeOutline,
  CheckmarkCircleOutline,
  CloseOutline,
} from '@vicons/ionicons5';
import { useUserStore, useMCPStore } from '@/stores';
import { requestPublicMCP } from '@/utils/mcpApi';
import ForgeCard from '../components/ForgeCard.vue';
import type { ToolPathConfig, ToolPathType } from '@/types';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const dialog = useDialog();
const userStore = useUserStore();
const mcpStore = useMCPStore();

// MCP ID
const mcpId = computed(() => Number(route.params.id));

// 操作加载状态
const actionLoading = ref(false);

// 工具路径配置相关
const saveConfigLoading = ref(false);
const localToolPathConfig = ref<ToolPathConfig>({});

// 申请公开相关
const showRequestPublicModal = ref(false);
const requestPublicLoading = ref(false);

// 路径类型选项
const pathTypeOptions: Array<{ value: string | null; label: string }> = [
  { value: null, label: '无' },
  { value: 'output', label: '输出路径' },
  { value: 'input', label: '输入路径' },
];

// 检测配置是否有变化
const configChanged = computed(() => {
  const original = mcp.value?.toolPathConfig || {};
  return JSON.stringify(localToolPathConfig.value) !== JSON.stringify(original);
});

// MCP 状态变化事件详情
interface MCPStatusChangeDetail {
  mcpId: number;
  status: 'connected' | 'disconnected' | 'closed';
  name?: string;
}

function handleMCPStatusChange(event: Event) {
  const customEvent = event as unknown as { detail: MCPStatusChangeDetail };
  const { mcpId: eventMcpId, status } = customEvent.detail;
  // 只处理当前 MCP 的状态变化
  if (eventMcpId === mcpId.value) {
    console.log(`[MCP详情] 收到状态变化: ${status}`);
    // 如果当前状态是 closed，忽略 disconnected 的推送（避免关闭操作被覆盖）
    if (mcp.value?.status === 'closed' && status === 'disconnected') {
      console.log('[MCP详情] 已关闭状态，忽略 disconnected 推送');
      return;
    }
    // 刷新详情数据
    mcpStore.fetchMCPDetail(mcpId.value);
    // 显示提示
    if (status === 'disconnected') {
      message.warning('MCP 连接已断开');
    }
  }
}

// 当前 MCP
const mcp = computed(() => mcpStore.currentMCP);

// 初始化
onMounted(async () => {
  // 加载 MCP 详情
  await mcpStore.fetchMCPDetail(mcpId.value);
  // 初始化本地工具路径配置
  if (mcp.value?.toolPathConfig) {
    localToolPathConfig.value = JSON.parse(JSON.stringify(mcp.value.toolPathConfig));
  }
  // 监听 MCP 状态变化事件
  window.addEventListener('mcp:status_change', handleMCPStatusChange);
});

// 监听 mcp 变化，同步工具路径配置
watch(
  () => mcp.value?.toolPathConfig,
  (newConfig) => {
    if (newConfig) {
      localToolPathConfig.value = JSON.parse(JSON.stringify(newConfig));
    } else {
      localToolPathConfig.value = {};
    }
  }
);

// 清理
onUnmounted(() => {
  window.removeEventListener('mcp:status_change', handleMCPStatusChange);
});

// 连接状态颜色
const statusColor = computed(() => {
  if (mcp.value?.status === 'connected') return '#10b981'; // 绿色
  if (mcp.value?.status === 'closed') return '#6b7280'; // 灰色
  return '#ef4444'; // 红色
});

// 连接状态文本
const statusText = computed(() => {
  if (mcp.value?.status === 'connected') return '连通成功';
  if (mcp.value?.status === 'closed') return '已关闭';
  return '连通失败';
});

// 是否已关闭（管理员主动关闭）
const isClosed = computed(() => mcp.value?.status === 'closed');

// 是否为当前用户创建的 MCP
const isOwner = computed(() => mcp.value?.userId === userStore.userInfo?.id);

// 是否可以申请公开（当前用户创建的私有 MCP，且未在审核中）
const canRequestPublic = computed(() => {
  if (!mcp.value || userStore.isAdmin) return false;
  return isOwner.value && !mcp.value.isPublic && mcp.value.publicApprovalStatus !== 'pending';
});

// 普通用户是否可以编辑（自己创建的非 stdio 类型 MCP）
const canEdit = computed(() => {
  if (!mcp.value) return false;
  // 管理员可以编辑所有
  if (userStore.isAdmin) return true;
  // 普通用户只能编辑自己创建的非 stdio 类型 MCP
  return isOwner.value && mcp.value.transportType !== 'stdio';
});

// 公开审核状态配置
const approvalStatusConfig = computed(() => {
  if (!mcp.value) return null;
  const configs = {
    none: null,
    pending: { text: '审核中', type: 'warning' as const, icon: TimeOutline },
    approved: { text: '已通过', type: 'success' as const, icon: CheckmarkCircleOutline },
    rejected: { text: '已拒绝', type: 'error' as const, icon: CloseOutline },
    cancelled: { text: '已取消', type: 'default' as const, icon: CloseOutline },
  };
  return configs[mcp.value.publicApprovalStatus];
});

// 传输方式配置
const transportConfig = computed(() => {
  if (!mcp.value) return null;
  const configs = {
    stdio: { text: 'Stdio', icon: TerminalOutline, type: 'warning' as const },
    sse: { text: 'SSE', icon: CloudOutline, type: 'info' as const },
    streamableHttp: { text: 'StreamableHTTP', icon: ServerOutline, type: 'success' as const },
  };
  return configs[mcp.value.transportType];
});

// 格式化创建时间
const formattedTime = computed(() => {
  if (!mcp.value) return '';
  const date = new Date(mcp.value.createdAt);
  return date.toLocaleString('zh-CN');
});

// 返回上一页
function handleBack() {
  router.back();
}

// 重连 MCP
async function handleReconnect() {
  actionLoading.value = true;
  try {
    const result = await mcpStore.reconnectMCP(mcpId.value);
    if (result.status === 'connected') {
      message.success('重连成功');
      // 重新获取详情（包含工具列表）
      await mcpStore.fetchMCPDetail(mcpId.value);
    } else {
      message.warning('重连失败，请检查连接配置');
    }
  } catch {
    message.error('重连失败');
  } finally {
    actionLoading.value = false;
  }
}

// 关闭 MCP（仅管理员）
async function handleClose() {
  actionLoading.value = true;
  try {
    await mcpStore.closeMCP(mcpId.value);
    message.success('已关闭 MCP');
    // store 中已更新状态，无需重新获取
  } catch {
    message.error('关闭失败');
  } finally {
    actionLoading.value = false;
  }
}

// 开启 MCP（仅管理员，调用 reconnect API）
async function handleOpen() {
  actionLoading.value = true;
  try {
    const result = await mcpStore.reconnectMCP(mcpId.value);
    if (result.status === 'connected') {
      message.success('开启成功');
      // 重新获取详情（包含工具列表）
      await mcpStore.fetchMCPDetail(mcpId.value);
    } else {
      message.warning('开启失败，请检查连接配置');
      // 失败也要更新状态
      await mcpStore.fetchMCPDetail(mcpId.value);
    }
  } catch {
    message.error('开启失败');
  } finally {
    actionLoading.value = false;
  }
}

// 编辑 MCP（仅管理员）
function handleEdit() {
  router.push(`/mcp/${mcpId.value}/edit`);
}

// 删除 MCP（仅管理员）
function handleDelete() {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除 MCP "${mcp.value?.name}" 吗？删除后将从所有关联的 Forge 中移除。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      actionLoading.value = true;
      try {
        const affectedCount = await mcpStore.deleteMCP(mcpId.value);
        message.success(`删除成功，影响了 ${affectedCount} 个 Forge`);
        router.push('/mcp');
      } catch {
        message.error('删除失败');
      } finally {
        actionLoading.value = false;
      }
    },
  });
}

// ========== 工具路径配置相关方法 ==========

// 获取参数的路径类型
function getParamPathType(toolName: string, paramName: string): ToolPathType {
  return localToolPathConfig.value[toolName]?.[paramName] || null;
}

// 设置参数的路径类型
function setParamPathType(toolName: string, paramName: string, value: ToolPathType) {
  if (!localToolPathConfig.value[toolName]) {
    localToolPathConfig.value[toolName] = {};
  }
  if (value === null) {
    delete localToolPathConfig.value[toolName][paramName];
    // 如果工具下没有配置了，删除工具键
    if (Object.keys(localToolPathConfig.value[toolName]).length === 0) {
      delete localToolPathConfig.value[toolName];
    }
  } else {
    localToolPathConfig.value[toolName][paramName] = value;
  }
}

// 保存工具路径配置
async function handleSaveConfig() {
  saveConfigLoading.value = true;
  try {
    const configToSave =
      Object.keys(localToolPathConfig.value).length > 0 ? localToolPathConfig.value : null;
    await mcpStore.updateToolPathConfig(mcpId.value, configToSave);
    message.success('配置已保存');
  } catch {
    message.error('保存失败');
  } finally {
    saveConfigLoading.value = false;
  }
}

// 格式化参数 schema 显示
function formatParamSchema(schema: unknown): string {
  if (!schema || typeof schema !== 'object') return '未知类型';
  const s = schema as Record<string, unknown>;
  const type = s.type || '未知';
  const desc = s.description ? ` - ${s.description}` : '';
  return `${type}${desc}`;
}

// 获取工具的参数列表
function getToolParams(tool: {
  inputSchema?: Record<string, unknown>;
}): Array<{ name: string; schema: unknown; required: boolean }> {
  if (!tool.inputSchema) return [];
  const properties = tool.inputSchema.properties as Record<string, unknown> | undefined;
  if (!properties) return [];
  const required = (tool.inputSchema.required as string[]) || [];
  return Object.entries(properties).map(([name, schema]) => ({
    name,
    schema,
    required: required.includes(name),
  }));
}

// ========== 申请公开相关方法 ==========

// 打开申请公开确认弹窗
function handleRequestPublicClick() {
  showRequestPublicModal.value = true;
}

// 确认申请公开
async function handleConfirmRequestPublic() {
  requestPublicLoading.value = true;
  try {
    await requestPublicMCP(mcpId.value);
    message.success('申请已提交，请等待管理员审核');
    showRequestPublicModal.value = false;
    // 刷新详情
    await mcpStore.fetchMCPDetail(mcpId.value);
  } catch (error) {
    // 显示后端返回的具体错误信息
    const err = error as { message?: string };
    message.error(err.message || '申请提交失败');
  } finally {
    requestPublicLoading.value = false;
  }
}
</script>

<template>
  <div class="mcp-detail">
    <!-- 加载状态 -->
    <NSpin v-if="mcpStore.loading" class="flex justify-center py-16" />

    <!-- MCP 详情 -->
    <template v-else-if="mcp">
      <!-- 头部：返回 + 标题 + 操作按钮 -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NButton quaternary circle @click="handleBack">
            <template #icon>
              <NIcon :component="ArrowBackOutline" />
            </template>
          </NButton>
          <div class="flex items-center gap-3">
            <h1 class="text-theme text-2xl font-bold">{{ mcp.name }}</h1>
            <span
              class="h-2.5 w-2.5 rounded-full"
              :style="{ backgroundColor: statusColor }"
              :title="statusText"
            ></span>
            <span class="text-theme-muted text-sm">{{ statusText }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center gap-2">
          <!-- 申请公开按钮（普通用户，自己创建的私有 MCP） -->
          <NButton v-if="canRequestPublic" type="info" @click="handleRequestPublicClick">
            <template #icon>
              <NIcon :component="GlobeOutline" />
            </template>
            申请公开
          </NButton>

          <!-- 审核状态标签（待审核/已拒绝时显示） -->
          <NTag
            v-if="isOwner && approvalStatusConfig && mcp.publicApprovalStatus !== 'approved'"
            :type="approvalStatusConfig.type"
            size="medium"
          >
            <template #icon>
              <NIcon :component="approvalStatusConfig.icon" :size="14" />
            </template>
            {{ approvalStatusConfig.text }}
          </NTag>

          <!-- 已关闭状态：显示开启按钮（仅管理员可见此 MCP） -->
          <template v-if="isClosed">
            <NButton
              v-if="userStore.isAdmin"
              type="success"
              :loading="actionLoading"
              @click="handleOpen"
            >
              <template #icon>
                <NIcon :component="PlayOutline" />
              </template>
              开启
            </NButton>
          </template>

          <!-- 非关闭状态（connected 或 disconnected）：显示重连和关闭按钮 -->
          <template v-else>
            <!-- 重连（所有用户可见） -->
            <NButton :loading="actionLoading" @click="handleReconnect">
              <template #icon>
                <NIcon :component="RefreshOutline" />
              </template>
              重连
            </NButton>
            <!-- 关闭（仅管理员） -->
            <NButton v-if="userStore.isAdmin" :loading="actionLoading" @click="handleClose">
              <template #icon>
                <NIcon :component="CloseCircleOutline" />
              </template>
              关闭
            </NButton>
          </template>

          <!-- 编辑按钮（管理员或普通用户自己的非 stdio MCP） -->
          <NButton v-if="canEdit" type="primary" class="btn-theme" @click="handleEdit">
            <template #icon>
              <NIcon :component="CreateOutline" />
            </template>
            编辑
          </NButton>

          <!-- 删除按钮（仅管理员） -->
          <NButton v-if="userStore.isAdmin" type="error" @click="handleDelete">
            <template #icon>
              <NIcon :component="TrashOutline" />
            </template>
            删除
          </NButton>
        </div>
      </div>

      <!-- 基本信息 -->
      <NCard title="基本信息" class="mb-6">
        <NDescriptions :column="2" label-placement="left">
          <NDescriptionsItem label="传输方式">
            <NTag v-if="transportConfig" size="small" :type="transportConfig.type">
              <template #icon>
                <NIcon :component="transportConfig.icon" :size="12" />
              </template>
              {{ transportConfig.text }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem label="创建时间">{{ formattedTime }}</NDescriptionsItem>
          <NDescriptionsItem v-if="mcp.creator?.nickname" label="创建者">
            {{ mcp.creator.nickname }}
          </NDescriptionsItem>
          <NDescriptionsItem v-if="mcp.timeout" label="超时时间">
            {{ mcp.timeout }} 秒
          </NDescriptionsItem>
          <NDescriptionsItem v-if="mcp.description" label="描述" :span="2">
            {{ mcp.description }}
          </NDescriptionsItem>
          <NDescriptionsItem v-if="mcp.remarks" label="备注" :span="2">
            {{ mcp.remarks }}
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <!-- 使用说明（MCP 示例） -->
      <NCard v-if="mcp.example" title="使用说明" class="mb-6">
        <pre class="text-theme-secondary text-sm whitespace-pre-wrap">{{ mcp.example }}</pre>
      </NCard>

      <!-- 关联的 Forge 列表 -->
      <NCard title="使用此 MCP 的 Forge" class="mb-6">
        <div
          v-if="mcp.associatedForges.length > 0"
          class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <ForgeCard v-for="forge in mcp.associatedForges" :key="forge.id" :forge="forge" />
        </div>
        <NEmpty v-else description="暂无 Forge 使用此 MCP" />
      </NCard>

      <!-- 工具列表 -->
      <NCard title="工具列表">
        <template #header-extra>
          <!-- 保存配置按钮（仅管理员且有变化时显示） -->
          <NButton
            v-if="userStore.isAdmin && configChanged"
            type="primary"
            size="small"
            :loading="saveConfigLoading"
            @click="handleSaveConfig"
          >
            <template #icon>
              <NIcon :component="SaveOutline" />
            </template>
            保存配置
          </NButton>
        </template>
        <div v-if="mcp.tools.length > 0">
          <NCollapse>
            <NCollapseItem v-for="tool in mcp.tools" :key="tool.name" :name="tool.name">
              <template #header>
                <span class="text-theme font-medium">{{ tool.name }}</span>
              </template>
              <!-- 工具详情：描述 + 参数列表 -->
              <div class="space-y-4">
                <!-- 工具描述 -->
                <div class="text-theme-secondary text-sm">{{ tool.description }}</div>
                <!-- 参数信息 -->
                <div v-if="getToolParams(tool).length > 0">
                  <div class="text-theme-muted mb-2 text-sm font-medium">📋 参数信息：</div>
                  <div class="space-y-2">
                    <div
                      v-for="param in getToolParams(tool)"
                      :key="param.name"
                      class="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-white/5"
                    >
                      <div class="flex-1">
                        <div class="flex items-center gap-2">
                          <span class="text-theme font-medium">{{ param.name }}</span>
                          <NTag v-if="param.required" type="error" size="tiny">必填</NTag>
                        </div>
                        <div class="text-theme-muted mt-1 text-sm">
                          {{ formatParamSchema(param.schema) }}
                        </div>
                      </div>
                      <!-- 管理员可配置路径类型 -->
                      <div v-if="userStore.isAdmin" class="ml-4 shrink-0">
                        <NSelect
                          :value="getParamPathType(tool.name, param.name)"
                          :options="pathTypeOptions as any"
                          size="small"
                          style="width: 110px"
                          placeholder="路径类型"
                          @update:value="
                            (v: ToolPathType) => setParamPathType(tool.name, param.name, v)
                          "
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-theme-muted text-sm">无参数</div>
              </div>
            </NCollapseItem>
          </NCollapse>
        </div>
        <NEmpty v-else description="暂无工具" />
      </NCard>
    </template>

    <!-- 未找到 -->
    <NEmpty v-else description="MCP 不存在" class="py-16">
      <template #extra>
        <NButton @click="handleBack">返回</NButton>
      </template>
    </NEmpty>

    <!-- 申请公开确认弹窗 -->
    <NModal v-model:show="showRequestPublicModal" preset="card" style="width: 480px">
      <template #header>
        <div class="flex items-center gap-2">
          <NIcon :component="GlobeOutline" :size="20" class="text-blue-500" />
          <span>申请公开 MCP</span>
        </div>
      </template>
      <div class="space-y-4">
        <NResult status="info" title="需要管理员审核" size="small">
          <template #default>
            <div class="text-theme-secondary space-y-2 text-sm">
              <p>公开 MCP 后，其他用户将可以看到并使用此 MCP。</p>
              <p>为了保证平台内容质量，您的公开申请需要经过管理员审核。</p>
              <p class="text-theme-muted">
                审核通常会在 1-2 个工作日内完成，届时您将收到审核结果通知。
              </p>
            </div>
          </template>
        </NResult>
        <!-- 如果之前被拒绝过，显示拒绝原因 -->
        <div
          v-if="mcp?.publicApprovalStatus === 'rejected' && mcp?.publicApprovalNote"
          class="rounded-lg bg-red-50 p-3 dark:bg-red-900/20"
        >
          <div class="text-theme-muted mb-1 text-xs">上次拒绝原因：</div>
          <div class="text-sm text-red-600 dark:text-red-400">{{ mcp.publicApprovalNote }}</div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton @click="showRequestPublicModal = false">取消</NButton>
          <NButton
            type="primary"
            :loading="requestPublicLoading"
            @click="handleConfirmRequestPublic"
          >
            确认申请
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
