<script setup lang="ts">
/**
 * 后台管理 - MCP 公开审核页面
 * 管理员/运营员可以查看待审核的 MCP 公开申请，进行批准或拒绝操作
 */
import { ref, computed, onMounted, h } from 'vue';
import {
  NDataTable,
  NSelect,
  NButton,
  NIcon,
  NTag,
  NModal,
  NInput,
  useMessage,
  type DataTableColumns,
} from 'naive-ui';
import { RefreshOutline, CheckmarkOutline, CloseOutline, EyeOutline } from '@vicons/ionicons5';
import {
  getAdminMcpApprovalList,
  reviewMcpPublicRequest,
  type AdminMcpApprovalItem,
} from '@/utils/adminApi';

const message = useMessage();

// 加载状态
const loading = ref(false);

// MCP 审核列表
const mcpList = ref<AdminMcpApprovalItem[]>([]);

// 分页信息
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

// 状态筛选
const statusFilter = ref<'pending' | 'approved' | 'rejected' | 'cancelled'>('pending');
const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已取消', value: 'cancelled' },
];

// 拒绝弹窗
const showRejectModal = ref(false);
const rejectNote = ref('');
const rejectLoading = ref(false);
const currentMcp = ref<AdminMcpApprovalItem | null>(null);

// 批准加载状态
const approveLoading = ref(false);

// 获取状态标签配置
function getStatusTag(status: string) {
  switch (status) {
    case 'pending':
      return { type: 'warning' as const, text: '待审核' };
    case 'approved':
      return { type: 'success' as const, text: '已通过' };
    case 'rejected':
      return { type: 'error' as const, text: '已拒绝' };
    case 'cancelled':
      return { type: 'default' as const, text: '已取消' };
    default:
      return { type: 'default' as const, text: status };
  }
}

// 获取连接状态标签配置
function getConnectionStatusTag(status: string) {
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

// 表格列定义
const columns = computed<DataTableColumns<AdminMcpApprovalItem>>(() => [
  {
    title: 'MCP 名称',
    key: 'name',
    width: 180,
    ellipsis: { tooltip: true },
  },
  {
    title: '传输方式',
    key: 'transportType',
    width: 120,
    render: (row) => h(NTag, { size: 'small', bordered: false }, () => row.transportType),
  },
  {
    title: '连接状态',
    key: 'status',
    width: 100,
    render: (row) => {
      const { type, text } = getConnectionStatusTag(row.status);
      return h(NTag, { type, size: 'small' }, () => text);
    },
  },
  {
    title: '审核状态',
    key: 'publicApprovalStatus',
    width: 100,
    render: (row) => {
      const { type, text } = getStatusTag(row.publicApprovalStatus);
      return h(NTag, { type, size: 'small' }, () => text);
    },
  },
  {
    title: '申请人',
    key: 'creator',
    width: 120,
    ellipsis: { tooltip: true },
    render: (row) => row.creator.nickname || row.creator.username,
  },
  {
    title: '申请时间',
    key: 'updatedAt',
    width: 150,
    render: (row) => formatDateTime(row.updatedAt),
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => {
      const buttons = [
        h(
          NButton,
          { text: true, type: 'info', onClick: () => handleViewDetail(row) },
          { default: () => '查看', icon: () => h(NIcon, { component: EyeOutline }) }
        ),
      ];
      // 待审核状态显示批准/拒绝按钮
      if (row.publicApprovalStatus === 'pending') {
        buttons.push(
          h(
            NButton,
            {
              text: true,
              type: 'success',
              loading: approveLoading.value,
              onClick: () => handleApprove(row),
            },
            { default: () => '批准', icon: () => h(NIcon, { component: CheckmarkOutline }) }
          ),
          h(
            NButton,
            { text: true, type: 'error', onClick: () => handleRejectClick(row) },
            { default: () => '拒绝', icon: () => h(NIcon, { component: CloseOutline }) }
          )
        );
      }
      return h('div', { style: 'display: flex; gap: 12px;' }, buttons);
    },
  },
]);

// 获取审核列表
async function fetchList() {
  loading.value = true;
  try {
    const res = await getAdminMcpApprovalList({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      status: statusFilter.value,
    });
    mcpList.value = res.mcps;
    pagination.value.total = res.pagination.total;
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '获取列表失败');
  } finally {
    loading.value = false;
  }
}

// 处理分页变化
function handlePageChange(page: number) {
  pagination.value.page = page;
  fetchList();
}

// 处理每页数量变化
function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
  fetchList();
}

// 切换状态筛选
function handleStatusChange() {
  pagination.value.page = 1;
  fetchList();
}

// 刷新列表
function handleRefresh() {
  fetchList();
}

// 查看详情（新标签页打开 MCP 详情页）
function handleViewDetail(mcp: AdminMcpApprovalItem) {
  window.open(`/mcp/${mcp.id}`, '_blank');
}

// 批准申请
async function handleApprove(mcp: AdminMcpApprovalItem) {
  approveLoading.value = true;
  try {
    await reviewMcpPublicRequest(mcp.id, 'approve');
    message.success('已批准公开');
    fetchList();
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '操作失败');
  } finally {
    approveLoading.value = false;
  }
}

// 点击拒绝按钮
function handleRejectClick(mcp: AdminMcpApprovalItem) {
  currentMcp.value = mcp;
  rejectNote.value = '';
  showRejectModal.value = true;
}

// 确认拒绝
async function handleConfirmReject() {
  if (!rejectNote.value.trim()) {
    message.warning('请填写拒绝原因');
    return;
  }
  if (!currentMcp.value) return;

  rejectLoading.value = true;
  try {
    await reviewMcpPublicRequest(currentMcp.value.id, 'reject', rejectNote.value.trim());
    message.success('已拒绝公开');
    showRejectModal.value = false;
    fetchList();
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '操作失败');
  } finally {
    rejectLoading.value = false;
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchList();
});
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <h1 class="text-theme mb-3 text-xl font-bold">MCP 公开审核</h1>

    <!-- 筛选栏 -->
    <div class="mb-3 flex items-center gap-2">
      <NSelect
        v-model:value="statusFilter"
        :options="statusOptions"
        style="width: 130px"
        @update:value="handleStatusChange"
      />

      <NButton @click="handleRefresh">
        <template #icon>
          <NIcon :component="RefreshOutline" />
        </template>
        刷新
      </NButton>
    </div>

    <!-- 审核列表表格 -->
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
      :scroll-x="900"
      remote
    />

    <!-- 拒绝原因弹窗 -->
    <NModal v-model:show="showRejectModal" preset="card" title="拒绝公开申请" style="width: 480px">
      <div class="space-y-4">
        <p class="text-theme-secondary text-sm">请填写拒绝原因，该原因将展示给申请人：</p>
        <NInput
          v-model:value="rejectNote"
          type="textarea"
          placeholder="请输入拒绝原因..."
          :rows="4"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton @click="showRejectModal = false">取消</NButton>
          <NButton type="error" :loading="rejectLoading" @click="handleConfirmReject">
            确认拒绝
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
