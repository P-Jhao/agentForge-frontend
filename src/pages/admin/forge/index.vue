<script setup lang="ts">
/**
 * 后台管理 - Forge 管理页面
 */
import { ref, computed, onMounted, h } from 'vue';
import {
  NDataTable,
  NInput,
  NButton,
  NIcon,
  NSelect,
  NTag,
  NTooltip,
  NPopconfirm,
  useMessage,
  type DataTableColumns,
} from 'naive-ui';
import { SearchOutline, RefreshOutline } from '@vicons/ionicons5';
import {
  getAdminForgeList,
  deleteAdminForge,
  type AdminForgeItem,
  type AdminForgeListParams,
} from '@/utils/adminApi';

const message = useMessage();

// 加载状态
const loading = ref(false);

// Forge 列表
const forges = ref<AdminForgeItem[]>([]);

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
const statusFilter = ref<'all' | 'active' | 'deleted'>('all');

// 权限筛选
const permissionFilter = ref<'all' | 'public' | 'private'>('all');

// 状态选项
const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '正常', value: 'active' },
  { label: '已删除', value: 'deleted' },
];

// 权限选项
const permissionOptions = [
  { label: '全部权限', value: 'all' },
  { label: '公开', value: 'public' },
  { label: '私有', value: 'private' },
];

// 格式化日期时间
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 表格列定义
const columns = computed<DataTableColumns<AdminForgeItem>>(() => [
  {
    title: 'Forge 名称',
    key: 'displayName',
    width: 160,
    render: (row) => {
      // 名称文本，超长显示省略号
      const nameText =
        row.displayName.length > 8 ? row.displayName.slice(0, 8) + '...' : row.displayName;

      return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        row.avatar
          ? h('img', {
            src: row.avatar,
            style:
              'width: 24px; height: 24px; border-radius: 4px; object-fit: cover; flex-shrink: 0;',
          })
          : null,
        row.displayName.length > 8
          ? h(
            NTooltip,
            { trigger: 'hover' },
            {
              trigger: () =>
                h(
                  NButton,
                  { text: true, type: 'primary', onClick: () => handleViewForge(row) },
                  () => nameText
                ),
              default: () => row.displayName,
            }
          )
          : h(
            NButton,
            { text: true, type: 'primary', onClick: () => handleViewForge(row) },
            () => row.displayName
          ),
      ]);
    },
  },
  {
    title: 'Forge 介绍',
    key: 'description',
    width: 180,
    render: (row) => {
      if (!row.description) return '-';
      const desc = row.description;
      const displayText = desc.length > 12 ? desc.slice(0, 12) + '...' : desc;
      return h(
        NTooltip,
        { trigger: 'hover', placement: 'bottom' },
        {
          trigger: () => h('span', { style: 'cursor: pointer;' }, displayText),
          default: () =>
            h(
              'div',
              {
                style:
                  'max-width: 400px; white-space: pre-wrap; word-break: break-word; line-height: 1.5;',
              },
              desc
            ),
        }
      );
    },
  },
  {
    title: 'MCP',
    key: 'mcps',
    width: 160,
    render: (row) => {
      if (!row.mcps || row.mcps.length === 0) return '-';
      const firstMcp = row.mcps[0]!;
      const restCount = row.mcps.length - 1;
      const restMcps = row.mcps.slice(1);
      const displayName =
        firstMcp.name.length > 15 ? firstMcp.name.slice(0, 15) + '...' : firstMcp.name;

      return h('div', { style: 'display: flex; align-items: center; gap: 4px;' }, [
        h(NTag, { size: 'small', bordered: false, type: 'primary' }, () => displayName),
        restCount > 0
          ? h(
            NTooltip,
            { trigger: 'hover' },
            {
              trigger: () => h(NTag, { size: 'small', bordered: false }, () => `+${restCount}`),
              default: () =>
                h(
                  'div',
                  { style: 'display: flex; flex-direction: column; gap: 4px;' },
                  restMcps.map((mcp) => h('div', {}, mcp.name))
                ),
            }
          )
          : null,
      ]);
    },
  },
  {
    title: '权限',
    key: 'isPublic',
    width: 80,
    render: (row) =>
      h(
        NTag,
        {
          size: 'small',
          type: row.isPublic ? 'success' : 'default',
          bordered: false,
        },
        () => (row.isPublic ? '公开' : '私有')
      ),
  },
  {
    title: '状态',
    key: 'isActive',
    width: 80,
    render: (row) =>
      h(
        NTag,
        {
          size: 'small',
          type: row.isActive ? 'success' : 'error',
          bordered: false,
        },
        () => (row.isActive ? '正常' : '已删除')
      ),
  },
  {
    title: '使用次数',
    key: 'usageCount',
    width: 90,
    sorter: true,
    render: (row) => h('span', {}, row.usageCount),
  },
  {
    title: '创建人',
    key: 'creator',
    width: 100,
    ellipsis: { tooltip: true },
    render: (row) => row.creator.nickname || row.creator.username,
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160,
    render: (row) => formatDateTime(row.createdAt),
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row) => {
      // 已删除的不显示删除按钮
      if (!row.isActive) return '-';
      return h('div', { style: 'display: flex; gap: 12px;' }, [
        h(
          NButton,
          {
            text: true,
            type: 'primary',
            onClick: () => handleViewForge(row),
          },
          () => '查看'
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDelete(row),
          },
          {
            trigger: () => h(NButton, { text: true, type: 'primary' }, () => '删除'),
            default: () => `确定要删除「${row.displayName}」吗？`,
          }
        ),
      ]);
    },
  },
]);

// 获取 Forge 列表
async function fetchForges() {
  loading.value = true;
  try {
    const params: AdminForgeListParams = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    };

    if (keyword.value) {
      params.keyword = keyword.value;
    }

    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value;
    }

    if (permissionFilter.value !== 'all') {
      params.permission = permissionFilter.value;
    }

    const res = await getAdminForgeList(params);
    forges.value = res.forges;
    pagination.value.total = res.pagination.total;
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '获取 Forge 列表失败');
  } finally {
    loading.value = false;
  }
}

// 处理分页变化
function handlePageChange(page: number) {
  pagination.value.page = page;
  fetchForges();
}

// 处理每页数量变化
function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
  fetchForges();
}

// 搜索
function handleSearch() {
  pagination.value.page = 1;
  fetchForges();
}

// 重置筛选
function handleReset() {
  keyword.value = '';
  statusFilter.value = 'all';
  permissionFilter.value = 'all';
  pagination.value.page = 1;
  fetchForges();
}

// 查看 Forge（新标签页打开）
function handleViewForge(forge: AdminForgeItem) {
  window.open(`/forge/${forge.id}`, '_blank');
}

// 删除 Forge
async function handleDelete(forge: AdminForgeItem) {
  try {
    await deleteAdminForge(forge.id);
    message.success('删除成功');
    fetchForges();
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '删除失败');
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchForges();
});
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <h1 class="text-theme mb-3 text-xl font-bold">Forge 管理</h1>

    <!-- 筛选栏 -->
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <NInput
        v-model:value="keyword"
        placeholder="搜索 Forge 名称、创建人..."
        style="width: 220px"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <NIcon :component="SearchOutline" />
        </template>
      </NInput>

      <NSelect
        v-model:value="statusFilter"
        :options="statusOptions"
        style="width: 120px"
        placeholder="状态"
      />

      <NSelect
        v-model:value="permissionFilter"
        :options="permissionOptions"
        style="width: 120px"
        placeholder="权限"
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

    <!-- Forge 表格 -->
    <NDataTable
      :columns="columns"
      :data="forges"
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
  </div>
</template>
