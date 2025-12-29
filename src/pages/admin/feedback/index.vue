<script setup lang="ts">
/**
 * 后台管理 - 反馈管理页面
 */
import { ref, computed, onMounted, h } from 'vue';
import {
  NDataTable,
  NInput,
  NDatePicker,
  NButton,
  NIcon,
  NSelect,
  NTag,
  NTooltip,
  useMessage,
  type DataTableColumns,
} from 'naive-ui';
import {
  SearchOutline,
  RefreshOutline,
  ThumbsUp,
  ThumbsDown,
  CloseCircle,
} from '@vicons/ionicons5';
import {
  getAdminFeedbackList,
  type AdminFeedbackItem,
  type AdminFeedbackListParams,
} from '@/utils/adminApi';

const message = useMessage();

// 加载状态
const loading = ref(false);

// 反馈列表
const feedbacks = ref<AdminFeedbackItem[]>([]);

// 分页信息
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
});

// 任务名称搜索
const taskKeyword = ref('');

// 反馈人搜索
const userKeyword = ref('');

// 任务时间范围
const taskDateRange = ref<[number, number] | null>(null);

// 反馈类型筛选
const feedbackType = ref<'all' | 'like' | 'dislike' | 'cancel'>('all');

// 反馈时间范围
const feedbackDateRange = ref<[number, number] | null>(null);

// 反馈类型选项
const feedbackTypeOptions = [
  { label: '全部', value: 'all' },
  { label: '点赞', value: 'like' },
  { label: '踩', value: 'dislike' },
  { label: '取消', value: 'cancel' },
];

// 表格列定义
const columns = computed<DataTableColumns<AdminFeedbackItem>>(() => [
  {
    title: '任务名称',
    key: 'task.title',
    ellipsis: { tooltip: true },
    width: 150,
    render: (row) =>
      h(
        NButton,
        {
          text: true,
          type: 'primary',
          onClick: () => handleViewTask(row),
        },
        () => row.task.title
      ),
  },
  {
    title: '任务创建与更新时间',
    key: 'task.time',
    width: 160,
    render: (row) =>
      h('div', { style: 'line-height: 1.6;' }, [
        h('div', {}, `创建: ${formatDateTime(row.task.createdAt)}`),
        h('div', { style: 'color: #999;' }, `更新: ${formatDateTime(row.task.updatedAt)}`),
      ]),
  },
  {
    title: '反馈人',
    key: 'user',
    width: 100,
    ellipsis: { tooltip: false },
    render: (row) => {
      const name = row.user.nickname || row.user.username;
      return h(
        NTooltip,
        { trigger: 'hover' },
        {
          trigger: () =>
            h(
              'span',
              {
                style:
                  'cursor: pointer; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
              },
              name
            ),
          default: () => name,
        }
      );
    },
  },
  {
    title: '反馈类型',
    key: 'type',
    width: 80,
    render: (row) => {
      if (row.type === 'like') {
        return h(NIcon, { component: ThumbsUp, size: 18, color: '#18a058' });
      } else if (row.type === 'dislike') {
        return h(NIcon, { component: ThumbsDown, size: 18, color: '#d03050' });
      } else {
        return h(NIcon, { component: CloseCircle, size: 18, color: '#999' });
      }
    },
  },
  {
    title: '反馈标签',
    key: 'tags',
    width: 160,
    ellipsis: { tooltip: true },
    render: (row) => {
      if (!row.tags || row.tags.length === 0) return '-';
      return h(
        'div',
        { style: 'display: flex; flex-wrap: wrap; gap: 4px;' },
        row.tags.map((tag) => h(NTag, { size: 'tiny', bordered: false }, () => tag))
      );
    },
  },
  {
    title: '反馈内容',
    key: 'content',
    width: 160,
    ellipsis: { tooltip: false },
    render: (row) => {
      if (!row.content) return '-';
      const content = row.content;
      return h(
        NTooltip,
        {
          trigger: 'hover',
          placement: 'left',
          style: 'max-width: 400px;',
        },
        {
          trigger: () =>
            h(
              'span',
              { style: 'cursor: pointer;' },
              content.length > 30 ? content.slice(0, 30) + '...' : content
            ),
          default: () =>
            h(
              'div',
              { style: 'white-space: pre-wrap; word-break: break-word; line-height: 1.5;' },
              content
            ),
        }
      );
    },
  },
  {
    title: '反馈时间',
    key: 'createdAt',
    width: 140,
    render: (row) => formatDateTime(row.createdAt),
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

// 获取反馈列表
async function fetchFeedbacks() {
  loading.value = true;
  try {
    const params: AdminFeedbackListParams = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    };

    if (taskKeyword.value) {
      params.taskKeyword = taskKeyword.value;
    }

    if (userKeyword.value) {
      params.userKeyword = userKeyword.value;
    }

    if (taskDateRange.value) {
      params.taskStartTime = new Date(taskDateRange.value[0]).toISOString();
      params.taskEndTime = new Date(taskDateRange.value[1]).toISOString();
    }

    if (feedbackType.value !== 'all') {
      params.feedbackType = feedbackType.value;
    }

    if (feedbackDateRange.value) {
      params.feedbackStartTime = new Date(feedbackDateRange.value[0]).toISOString();
      params.feedbackEndTime = new Date(feedbackDateRange.value[1]).toISOString();
    }

    const res = await getAdminFeedbackList(params);
    feedbacks.value = res.feedbacks;
    pagination.value.total = res.pagination.total;
  } catch (error) {
    const err = error as { message?: string };
    message.error(err.message || '获取反馈列表失败');
  } finally {
    loading.value = false;
  }
}

// 处理分页变化
function handlePageChange(page: number) {
  pagination.value.page = page;
  fetchFeedbacks();
}

// 处理每页数量变化
function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
  fetchFeedbacks();
}

// 搜索
function handleSearch() {
  pagination.value.page = 1;
  fetchFeedbacks();
}

// 重置筛选
function handleReset() {
  taskKeyword.value = '';
  userKeyword.value = '';
  taskDateRange.value = null;
  feedbackType.value = 'all';
  feedbackDateRange.value = null;
  pagination.value.page = 1;
  fetchFeedbacks();
}

// 查看任务（新标签页打开）
function handleViewTask(feedback: AdminFeedbackItem) {
  window.open(`/task/${feedback.task.uuid}`, '_blank');
}

// 组件挂载时获取数据
onMounted(() => {
  fetchFeedbacks();
});
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <h1 class="text-theme mb-3 text-xl font-bold">反馈管理</h1>

    <!-- 筛选栏 -->
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <NInput
        v-model:value="taskKeyword"
        placeholder="搜索任务名称..."
        style="width: 160px"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <NIcon :component="SearchOutline" />
        </template>
      </NInput>

      <NInput
        v-model:value="userKeyword"
        placeholder="搜索反馈人..."
        style="width: 140px"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <NIcon :component="SearchOutline" />
        </template>
      </NInput>

      <NDatePicker
        v-model:value="taskDateRange"
        type="daterange"
        clearable
        style="width: 240px"
        start-placeholder="任务开始日期"
        end-placeholder="任务结束日期"
      />

      <NSelect
        v-model:value="feedbackType"
        :options="feedbackTypeOptions"
        style="width: 100px"
        placeholder="反馈类型"
      />

      <NDatePicker
        v-model:value="feedbackDateRange"
        type="daterange"
        clearable
        style="width: 240px"
        start-placeholder="反馈开始日期"
        end-placeholder="反馈结束日期"
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

    <!-- 反馈表格 -->
    <NDataTable
      :columns="columns"
      :data="feedbacks"
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
      :scroll-x="0"
      remote
    />
  </div>
</template>
