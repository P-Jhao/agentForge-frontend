<script setup lang="ts">
/**
 * MCP 详情页面
 * 显示 MCP 详细信息、关联的 Forge 列表、工具列表
 * 管理员可以关闭、编辑、删除 MCP
 * 所有用户可以重连 MCP
 */
import { ref, computed, onMounted } from 'vue';
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
} from '@vicons/ionicons5';
import { useThemeStore, useUserStore, useMCPStore } from '@/stores';
import ForgeCard from '../components/ForgeCard.vue';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const dialog = useDialog();
const themeStore = useThemeStore();
const userStore = useUserStore();
const mcpStore = useMCPStore();

// MCP ID
const mcpId = computed(() => Number(route.params.id));

// 操作加载状态
const actionLoading = ref(false);

// 初始化加载 MCP 详情
onMounted(async () => {
  await mcpStore.fetchMCPDetail(mcpId.value);
});

// 当前 MCP
const mcp = computed(() => mcpStore.currentMCP);

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

// 格式化命令参数（JSON 数组转多行显示）
const formattedArgs = computed(() => {
  if (!mcp.value?.args) return '';
  try {
    const argsArray = JSON.parse(mcp.value.args);
    if (Array.isArray(argsArray)) {
      return argsArray.join('\n');
    }
  } catch {
    // 解析失败，直接返回原值
  }
  return mcp.value.args;
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
    // 重新获取详情更新状态
    await mcpStore.fetchMCPDetail(mcpId.value);
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

          <!-- 管理员操作 -->
          <template v-if="userStore.isAdmin">
            <NButton
              type="primary"
              :class="themeStore.isDark ? 'btn-glow' : 'btn-gradient'"
              @click="handleEdit"
            >
              <template #icon>
                <NIcon :component="CreateOutline" />
              </template>
              编辑
            </NButton>
            <NButton type="error" @click="handleDelete">
              <template #icon>
                <NIcon :component="TrashOutline" />
              </template>
              删除
            </NButton>
          </template>
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
          <!-- stdio 类型显示命令、参数、环境变量 -->
          <template v-if="mcp.transportType === 'stdio'">
            <NDescriptionsItem label="启动命令" :span="2">
              <code class="text-theme-secondary text-sm">{{ mcp.command }}</code>
            </NDescriptionsItem>
            <NDescriptionsItem v-if="mcp.args" label="命令参数" :span="2">
              <code class="text-theme-secondary text-sm whitespace-pre-wrap">
                {{ formattedArgs }}
              </code>
            </NDescriptionsItem>
            <NDescriptionsItem v-if="mcp.env" label="环境变量" :span="2">
              <code class="text-theme-secondary text-sm">{{ mcp.env }}</code>
            </NDescriptionsItem>
          </template>
          <!-- sse/http 类型显示 URL、请求头 -->
          <template v-else>
            <NDescriptionsItem label="连接地址" :span="2">
              <code class="text-theme-secondary text-sm">{{ mcp.url }}</code>
            </NDescriptionsItem>
            <NDescriptionsItem v-if="mcp.headers" label="请求头" :span="2">
              <code class="text-theme-secondary text-sm">{{ mcp.headers }}</code>
            </NDescriptionsItem>
          </template>
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
        <div v-if="mcp.tools.length > 0" class="space-y-3">
          <div
            v-for="tool in mcp.tools"
            :key="tool.name"
            class="rounded-lg border border-gray-200 p-3 dark:border-white/10"
          >
            <div class="text-theme mb-1 font-medium">{{ tool.name }}</div>
            <div class="text-theme-secondary text-sm">{{ tool.description }}</div>
          </div>
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
  </div>
</template>
