<script setup lang="ts">
/**
 * 任务列表页面
 * 任务列表 + 筛选 + 批量操作
 */
import { ref, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import {
  NDataTable,
  NInput,
  NButton,
  NIcon,
  NSpace,
  NTag,
  NPopconfirm,
  useMessage,
  type DataTableColumns,
} from 'naive-ui';
import { SearchOutline, StarOutline, Star, TrashOutline, TimeOutline } from '@vicons/ionicons5';
import { useTaskStore, useThemeStore } from '@/stores';
import type { Task } from '@/types';

const router = useRouter();
const message = useMessage();
const taskStore = useTaskStore();
const themeStore = useThemeStore();

// 搜索关键词
const searchKeyword = ref('');

// 筛选模式：all | favorite
const filterMode = ref<'all' | 'favorite'>('all');

// 加载状态
const loading = computed(() => taskStore.loading);

// 筛选后的任务列表
const filteredTasks = computed(() => {
  let tasks = taskStore.tasks;

  // 收藏筛选
  if (filterMode.value === 'favorite') {
    tasks = tasks.filter((t) => t.favorite);
  }

  // 关键词搜索（本地过滤）
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    tasks = tasks.filter((t) => t.title.toLowerCase().includes(keyword));
  }

  return tasks;
});

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 获取状态标签
const getStatusTag = (status: string) => {
  switch (status) {
    case 'running':
      return { type: 'info' as const, text: '运行中' };
    case 'completed':
      return { type: 'success' as const, text: '已完成' };
    case 'cancelled':
      return { type: 'warning' as const, text: '已取消' };
    default:
      return { type: 'default' as const, text: status };
  }
};

// 点击任务跳转
const handleRowClick = (task: Task) => {
  taskStore.setCurrentTask(task.uuid);
  router.push(`/task/${task.uuid}`);
};

// 切换收藏
const handleToggleFavorite = async (task: Task, e: MouseEvent) => {
  e.stopPropagation();
  try {
    await taskStore.toggleFavorite(task.uuid);
    message.success(task.favorite ? '已取消收藏' : '已收藏');
  } catch {
    message.error('操作失败');
  }
};

// 删除任务
const handleDelete = async (task: Task, e: MouseEvent) => {
  e.stopPropagation();
  try {
    await taskStore.deleteTask(task.uuid);
    message.success('删除成功');
  } catch {
    message.error('删除失败');
  }
};

// 表格列定义
const columns: DataTableColumns<Task> = [
  {
    title: '标题',
    key: 'title',
    ellipsis: { tooltip: true },
    render: (row) => h('span', { class: 'cursor-pointer hover:text-primary-500' }, row.title),
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => {
      const { type, text } = getStatusTag(row.status);
      return h(NTag, { type, size: 'small', round: true }, () => text);
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render: (row) => h('span', { class: 'text-gray-500 text-sm' }, formatDate(row.createdAt)),
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        // 收藏按钮
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            circle: true,
            onClick: (e: MouseEvent) => handleToggleFavorite(row, e),
          },
          () =>
            h(NIcon, {
              component: row.favorite ? Star : StarOutline,
              class: row.favorite ? 'text-yellow-500' : '',
            })
        ),
        // 删除按钮
        h(
          NPopconfirm,
          {
            onPositiveClick: (e: MouseEvent) => handleDelete(row, e),
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: 'small',
                  quaternary: true,
                  circle: true,
                  onClick: (e: MouseEvent) => e.stopPropagation(),
                },
                () => h(NIcon, { component: TrashOutline, class: 'text-red-500' })
              ),
            default: () => '确定删除该任务吗？',
          }
        ),
      ]),
  },
];

// 行属性
const rowProps = (row: Task) => ({
  style: 'cursor: pointer;',
  onClick: () => handleRowClick(row),
});

// 组件挂载时获取任务列表
onMounted(async () => {
  try {
    await taskStore.fetchTasks();
  } catch {
    message.error('获取任务列表失败');
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
        任务管理
      </h1>
      <p class="mt-1 text-sm" :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'">
        管理所有对话任务
      </p>
    </div>

    <!-- 筛选栏 -->
    <div class="flex items-center justify-between gap-4">
      <!-- 搜索框 -->
      <NInput
        v-model:value="searchKeyword"
        placeholder="搜索任务..."
        clearable
        style="max-width: 300px"
      >
        <template #prefix>
          <NIcon :component="SearchOutline" />
        </template>
      </NInput>

      <!-- 筛选按钮 -->
      <NSpace>
        <NButton :type="filterMode === 'all' ? 'primary' : 'default'" @click="filterMode = 'all'">
          <template #icon>
            <NIcon :component="TimeOutline" />
          </template>
          全部
        </NButton>
        <NButton
          :type="filterMode === 'favorite' ? 'primary' : 'default'"
          @click="filterMode = 'favorite'"
        >
          <template #icon>
            <NIcon :component="Star" />
          </template>
          收藏
        </NButton>
      </NSpace>
    </div>

    <!-- 任务表格 -->
    <NDataTable
      :columns="columns"
      :data="filteredTasks"
      :loading="loading"
      :row-props="rowProps"
      :bordered="false"
      striped
    />

    <!-- 空状态 -->
    <div
      v-if="!loading && filteredTasks.length === 0"
      class="py-12 text-center"
      :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-400'"
    >
      {{ filterMode === 'favorite' ? '暂无收藏任务' : '暂无任务' }}
    </div>
  </div>
</template>
