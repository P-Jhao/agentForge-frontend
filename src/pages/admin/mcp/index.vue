<script setup lang="ts">
/**
 * 后台管理 - MCP 管理页面
 */
import { ref, computed, onMounted, h } from 'vue';
import {
  NDataTable,
  NInput,
  NSelect,
  NButton,
  NIcon,
  NPopconfirm,
  NTag,
  NModal,
  NForm,
  NFormItem,
  NInputNumber,
  NSwitch,
  useMessage,
  type DataTableColumns,
} from 'naive-ui';
import { SearchOutline, RefreshOutline } from '@vicons/ionicons5';
import {
  getAdminMcpList,
  updateAdminMcp,
  deleteAdminMcp,
  type AdminMcpItem,
  type AdminMcpListParams,
} from '@/utils/adminApi';

const message = useMessage();

// 加载状态
const loading = ref(false);

// MCP 列表
const mcpList = ref<AdminMcpItem[]>([]);

// 分页信息
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
});

// 搜索关键词
const keyword = ref('');

// 状态筛选
const statusFilter = ref<'all' | 'connected' | 'disconnected' | 'closed'>('all');
const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '已连接', value: 'connected' },
  { label: '未连接', value: 'disconnected' },
  { label: '已关闭', value: 'closed' },
];

// 来源筛选
const sourceFilter = ref<'all' | 'builtin' | 'user'>('all');
const sourceOptions = [
  { label: '全部来源', value: 'all' },
  { label: '内置', value: 'builtin' },
  { label: '用户创建', value: 'user' },
];

// 编辑弹窗
const showEditModal = ref(false);
const editingMcp = ref<AdminMcpItem | null>(null);
const editForm = ref({
  name: '',
  description: '',
  transportType: 'stdio' as 'stdio' | 'sse' | 'streamableHttp',
  command: '',
  args: '',
  env: '',
  url: '',
  isPublic: false,
  timeout: 30 as number | null,
  remarks: '',
  status: 'disconnected' as 'connected' | 'disconnected' | 'closed',
});

// 获取状态标签配置
function getStatusTag(status: string) {
  switch (status) {
    case 'connected':
      return { type: 'success' as const, text: '已连接' };
    case 'disconnected':
      return { type: 'warning' as const, text: '未连接' };
    case 'closed':
      return { type: 'error' as const, text: '已关闭' };
    default:
      return { type: 'default' as const, text: status };
  }
}

// 获取来源标签配置
function getSourceTag(source: string) {
  switch (source) {
    case 'builtin':
      return { type: 'info' as const, text: '内置' };
    case 'user':
      return { type: 'default' as const, text: '用户' };
    default:
      return { type: 'default' as const, text: source };
  }
}

// 格式化日期时间
function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 查看 MCP 详情（新标签页打开）
function handleViewDetail(mcp: AdminMcpItem) {
  window.open(`/mcp/${mcp.id}`, '_blank');
}

// 表格列定义
const columns = computed<DataTableColumns<AdminMcpItem>>(() => [
  {
    title: 'MCP 名称',
    key: 'name',
    width: 160,
    ellipsis: { tooltip: true },
    render: (row) =>
      h(
        'span',
        {
          style: 'color: var(--primary-color); cursor: pointer;',
          onClick: () => handleViewDetail(row),
        },
        row.name
      ),
  },
  {
    title: '传输方式',
    key: 'transportType',
    width: 100,
    render: (row) => h(NTag, { size: 'small', bordered: false }, () => row.transportType),
  },
  {
    title: '来源',
    key: 'source',
    width: 80,
    render: (row) => {
      const { type, text } = getSourceTag(row.source);
      return h(NTag, { type, size: 'small' }, () => text);
    },
  },
  {
    title: '公开',
    key: 'isPublic',
    width: 70,
    render: (row) =>
      row.isPublic
        ? h(NTag, { type: 'success', size: 'small' }, () => '是')
        : h(NTag, { type: 'default', size: 'small' }, () => '否'),
  },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render: (row) => {
      const { type, text } = getStatusTag(row.status);
      return h(NTag, { type, size: 'small' }, () => text);
    },
  },
  {
    title: '创建者',
    key: 'creator',
    width: 100,
    ellipsis: { tooltip: true },
    render: (row) => row.creator.nickname || row.creator.username,
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 140,
    render: (row) => formatDateTime(row.createdAt),
  },
  {
    title: '备注',
    key: 'remarks',
    width: 120,
    ellipsis: { tooltip: true },
    render: (row) => row.remarks || '-',
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row) =>
      h('div', { style: 'display: flex; gap: 12px;' }, [
        h(NButton, { text: true, type: 'primary', onClick: () => handleEdit(row) }, () => '编辑'),
        h(
          NPopconfirm,
          { onPositiveClick: () => handleDelete(row) },
          {
            trigger: () => h(NButton, { text: true, type: 'error' }, () => '删除'),
            default: () => '确定要删除这个 MCP 吗？此操作不可恢复。',
          }
        ),
      ]),
  },
]);

// 获取 MCP 列表
async function fetchMcpList() {
  loading.value = true;
  try {
    const params: AdminMcpListParams = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    };

    if (keyword.value) {
      params.keyword = keyword.value;
    }
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value;
    }
    if (sourceFilter.value !== 'all') {
      params.source = sourceFilter.value;
    }

    const res = await getAdminMcpList(params);
    mcpList.value = res.mcps;
    pagination.value.total = res.pagination.total;
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '获取 MCP 列表失败');
  } finally {
    loading.value = false;
  }
}

// 处理分页变化
function handlePageChange(page: number) {
  pagination.value.page = page;
  fetchMcpList();
}

// 处理每页数量变化
function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
  fetchMcpList();
}

// 搜索
function handleSearch() {
  pagination.value.page = 1;
  fetchMcpList();
}

// 重置筛选
function handleReset() {
  keyword.value = '';
  statusFilter.value = 'all';
  sourceFilter.value = 'all';
  pagination.value.page = 1;
  fetchMcpList();
}

// 编辑 MCP
function handleEdit(mcp: AdminMcpItem) {
  editingMcp.value = mcp;
  editForm.value = {
    name: mcp.name,
    description: mcp.description || '',
    transportType: mcp.transportType,
    command: mcp.command || '',
    args: mcp.args || '',
    env: mcp.env || '',
    url: mcp.url || '',
    isPublic: mcp.isPublic,
    timeout: mcp.timeout,
    remarks: mcp.remarks || '',
    status: mcp.status,
  };
  showEditModal.value = true;
}

// 提交编辑
async function handleEditSubmit() {
  if (!editingMcp.value) return;

  try {
    await updateAdminMcp(editingMcp.value.id, {
      name: editForm.value.name,
      description: editForm.value.description || null,
      transportType: editForm.value.transportType,
      command: editForm.value.command || null,
      args: editForm.value.args || null,
      env: editForm.value.env || null,
      url: editForm.value.url || null,
      isPublic: editForm.value.isPublic,
      timeout: editForm.value.timeout,
      remarks: editForm.value.remarks || null,
      status: editForm.value.status,
    });
    message.success('更新成功');
    showEditModal.value = false;
    fetchMcpList();
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '更新失败');
  }
}

// 删除 MCP
async function handleDelete(mcp: AdminMcpItem) {
  try {
    await deleteAdminMcp(mcp.id);
    message.success('删除成功');
    fetchMcpList();
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '删除失败');
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchMcpList();
});
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <h1 class="text-theme mb-3 text-xl font-bold">MCP 管理</h1>

    <!-- 筛选栏 -->
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <NInput
        v-model:value="keyword"
        placeholder="搜索 MCP 名称、描述..."
        style="width: 220px"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <NIcon :component="SearchOutline" />
        </template>
      </NInput>

      <NSelect v-model:value="statusFilter" :options="statusOptions" style="width: 120px" />

      <NSelect v-model:value="sourceFilter" :options="sourceOptions" style="width: 130px" />

      <NButton type="primary" @click="handleSearch">
        <template #icon>
          <NIcon :component="SearchOutline" />
        </template>
        搜索
      </NButton>

      <NButton @click="handleReset">
        <template #icon>
          <NIcon :component="RefreshOutline" />
        </template>
        重置
      </NButton>
    </div>

    <!-- MCP 表格 -->
    <NDataTable
      :columns="columns"
      :data="mcpList"
      :loading="loading"
      :pagination="{
        page: pagination.page,
        pageSize: pagination.pageSize,
        pageCount: Math.ceil(pagination.total / pagination.pageSize),
        showSizePicker: pagination.showSizePicker,
        pageSizes: pagination.pageSizes,
        onUpdatePage: handlePageChange,
        onUpdatePageSize: handlePageSizeChange,
      }"
      :scroll-x="1100"
      remote
    />

    <!-- 编辑弹窗 -->
    <NModal
      v-model:show="showEditModal"
      preset="dialog"
      title="编辑 MCP"
      positive-text="保存"
      negative-text="取消"
      style="width: 600px"
      @positive-click="handleEditSubmit"
    >
      <NForm :model="editForm" label-placement="left" label-width="90px">
        <NFormItem label="名称" path="name">
          <NInput v-model:value="editForm.name" placeholder="请输入 MCP 名称" />
        </NFormItem>
        <NFormItem label="描述" path="description">
          <NInput
            v-model:value="editForm.description"
            type="textarea"
            placeholder="请输入描述"
            :rows="2"
          />
        </NFormItem>
        <NFormItem label="传输方式" path="transportType">
          <NSelect
            v-model:value="editForm.transportType"
            :options="[
              { label: 'stdio', value: 'stdio' },
              { label: 'sse', value: 'sse' },
              { label: 'streamableHttp', value: 'streamableHttp' },
            ]"
          />
        </NFormItem>
        <template v-if="editForm.transportType === 'stdio'">
          <NFormItem label="启动命令" path="command">
            <NInput v-model:value="editForm.command" placeholder="如: node, python" />
          </NFormItem>
          <NFormItem label="命令参数" path="args">
            <NInput
              v-model:value="editForm.args"
              type="textarea"
              placeholder="JSON 数组格式，如: [&quot;index.js&quot;, &quot;--port&quot;, &quot;3000&quot;]"
              :rows="2"
            />
          </NFormItem>
          <NFormItem label="环境变量" path="env">
            <NInput
              v-model:value="editForm.env"
              type="textarea"
              placeholder="JSON 对象格式，如: {&quot;API_KEY&quot;: &quot;xxx&quot;}"
              :rows="2"
            />
          </NFormItem>
        </template>
        <template v-else>
          <NFormItem label="连接地址" path="url">
            <NInput v-model:value="editForm.url" placeholder="如: http://localhost:3000/sse" />
          </NFormItem>
        </template>
        <NFormItem label="超时时间" path="timeout">
          <NInputNumber
            v-model:value="editForm.timeout"
            :min="1"
            :max="300"
            placeholder="秒"
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem label="状态" path="status">
          <NSelect
            v-model:value="editForm.status"
            :options="[
              { label: '已连接', value: 'connected' },
              { label: '未连接', value: 'disconnected' },
              { label: '已关闭', value: 'closed' },
            ]"
          />
        </NFormItem>
        <NFormItem label="是否公开" path="isPublic">
          <NSwitch v-model:value="editForm.isPublic" />
        </NFormItem>
        <NFormItem label="备注" path="remarks">
          <NInput
            v-model:value="editForm.remarks"
            type="textarea"
            placeholder="请输入备注"
            :rows="2"
          />
        </NFormItem>
      </NForm>
    </NModal>
  </div>
</template>
