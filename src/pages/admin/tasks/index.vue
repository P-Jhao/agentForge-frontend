<script setup lang="ts">
/**
 * 后台管理 - 任务管理页面
 */
import { ref, computed, onMounted, h } from 'vue';
import {
  NDataTable,
  NInput,
  NDatePicker,
  NButton,
  NIcon,
  NPopconfirm,
  NTag,
  NTooltip,
  useMessage,
  type DataTableColumns,
} from 'naive-ui';
import { SearchOutline, RefreshOutline } from '@vicons/ionicons5';
import {
  getAdminTaskList,
  deleteAdminTask,
  type AdminTaskItem,
  type AdminTaskListParams,
} from '@/utils/adminApi';

const message = useMessage();

// 加载状态
const loading = ref(false);

// 任务列表
const tasks = ref<AdminTaskItem[]>([]);

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

// 时间范围
const dateRange = ref<[number, number] | null>(null);

// Token 排序
const tokenSortOrder = ref<'asc' | 'desc' | null>(null);

// 获取状态标签配置
const getStatusTag = (status: string) => {
  switch (status) {
    case 'running':
      return { type: 'info' as const, text: '运行中' };
    case 'completed':
      return { type: 'success' as const, text: '已完成' };
    case 'cancelled':
      return { type: 'warning' as const, text: '已取消' };
    case 'waiting':
      return { type: 'default' as const, text: '等待中' };
    case 'deleted':
      return { type: 'error' as const, text: '已删除' };
    default:
      return { type: 'default' as const, text: status };
  }
};

// 表格列定义
const columns = computed<DataTableColumns<AdminTaskItem>>(() => [
  {
    title: '任务名称',
    key: 'title',
    ellipsis: { tooltip: true },
    width: 200,
  },
  {
    title: 'Forge',
    key: 'agent',
    width: 140,
    render: (row) => {
      if (!row.agent) return '-';
      // 显示 Forge 头像 + 名称，点击跳转到 Forge 详情
      return h(
        NTooltip,
        { trigger: 'hover' },
        {
          trigger: () =>
            h(
              NButton,
              {
                text: true,
                type: 'primary',
                onClick: () => handleViewForge(row.agent!.id),
                style: 'max-width: 130px;',
              },
              () =>
                h(
                  'span',
                  {
                    style:
                      'display: flex; align-items: center; gap: 6px; max-width: 100%; overflow: hidden;',
                  },
                  [
                    // 显示头像图片
                    row.agent!.avatar
                      ? h('img', {
                        src: row.agent!.avatar,
                        alt: row.agent!.displayName,
                        style:
                          'width: 20px; height: 20px; border-radius: 4px; object-fit: cover; flex-shrink: 0;',
                      })
                      : null,
                    h(
                      'span',
                      {
                        style: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
                      },
                      row.agent!.displayName
                    ),
                  ]
                )
            ),
          default: () => row.agent!.displayName,
        }
      );
    },
  },
  {
    title: '创建者',
    key: 'creator',
    width: 100,
    render: (row) => row.creator.nickname || row.creator.username,
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) => {
      const { type, text } = getStatusTag(row.status);
      return h(NTag, { type, size: 'small' }, () => text);
    },
  },
  {
    title: 'Token 消耗',
    key: 'totalTokens',
    width: 120,
    sorter: true,
    sortOrder:
      tokenSortOrder.value === 'asc'
        ? 'ascend'
        : tokenSortOrder.value === 'desc'
          ? 'descend'
          : false,
    render: (row) => (row.totalTokens > 0 ? `${row.totalTokens.toLocaleString()} tokens` : '-'),
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160,
    render: (row) => formatDateTime(row.createdAt),
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    width: 160,
    render: (row) => formatDateTime(row.updatedAt),
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: (row) =>
      h('div', { style: 'display: flex; gap: 12px;' }, [
        h(
          NButton,
          {
            text: true,
            type: 'primary',
            onClick: () => handleView(row),
          },
          () => '查看'
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDelete(row),
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  text: true,
                  type: 'primary',
                },
                () => '删除'
              ),
            default: () => '确定要删除这个任务吗？',
          }
        ),
      ]),
  },
]);

// 格式化日期时间
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 获取任务列表
async function fetchTasks() {
  loading.value = true;
  try {
    const params: AdminTaskListParams = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    };

    if (keyword.value) {
      params.keyword = keyword.value;
    }

    if (dateRange.value) {
      params.startTime = new Date(dateRange.value[0]).toISOString();
      params.endTime = new Date(dateRange.value[1]).toISOString();
    }

    if (tokenSortOrder.value) {
      params.sortBy = 'tokens';
      params.sortOrder = tokenSortOrder.value;
    }

    const res = await getAdminTaskList(params);
    tasks.value = res.tasks;
    pagination.value.total = res.pagination.total;
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '获取任务列表失败');
  } finally {
    loading.value = false;
  }
}

// 处理分页变化
function handlePageChange(page: number) {
  pagination.value.page = page;
  fetchTasks();
}

// 处理每页数量变化
function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
  fetchTasks();
}

// 处理排序变化
function handleSorterChange(sorter: { columnKey: string; order: 'ascend' | 'descend' | false }) {
  if (sorter.columnKey === 'totalTokens') {
    if (sorter.order === 'ascend') {
      tokenSortOrder.value = 'asc';
    } else if (sorter.order === 'descend') {
      tokenSortOrder.value = 'desc';
    } else {
      tokenSortOrder.value = null;
    }
    fetchTasks();
  }
}

// 搜索
function handleSearch() {
  pagination.value.page = 1;
  fetchTasks();
}

// 重置筛选
function handleReset() {
  keyword.value = '';
  dateRange.value = null;
  tokenSortOrder.value = null;
  pagination.value.page = 1;
  fetchTasks();
}

// 查看任务（新标签页打开）
function handleView(task: AdminTaskItem) {
  window.open(`/task/${task.uuid}`, '_blank');
}

// 查看 Forge 详情（新标签页打开）
function handleViewForge(forgeId: number) {
  window.open(`/forge/${forgeId}`, '_blank');
}

// 删除任务
async function handleDelete(task: AdminTaskItem) {
  try {
    await deleteAdminTask(task.uuid);
    message.success('删除成功');
    fetchTasks();
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '删除失败');
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchTasks();
});
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <h1 class="text-theme mb-3 text-xl font-bold">任务管理</h1>

    <!-- 筛选栏 -->
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <NInput
        v-model:value="keyword"
        placeholder="搜索任务名称、创建者..."
        style="width: 240px"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <NIcon :component="SearchOutline" />
        </template>
      </NInput>

      <NDatePicker
        v-model:value="dateRange"
        type="daterange"
        clearable
        style="width: 280px"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
      />

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

    <!-- 任务表格 -->
    <NDataTable
      :columns="columns"
      :data="tasks"
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
      :scroll-x="1020"
      remote
      @update:sorter="handleSorterChange"
    />
  </div>
</template>
