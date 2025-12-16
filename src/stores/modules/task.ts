/**
 * 任务状态管理
 * 管理任务列表、当前任务、分组等状态
 */
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import {
  getTasks as fetchTasksApi,
  updateTask as updateTaskApi,
  deleteTask as deleteTaskApi,
} from '@/utils';
import type { Task, GroupedTasks, UpdateTaskParams } from '@/types';

export const useTaskStore = defineStore('task', () => {
  // ========== 状态 ==========

  // 任务列表
  const tasks = ref<Task[]>([]);

  // 当前选中的任务 UUID
  const currentTaskUuid = ref<string | null>(null);

  // 加载状态
  const loading = ref(false);

  // ========== 计算属性 ==========

  // 当前任务
  const currentTask = computed(() => {
    if (!currentTaskUuid.value) return null;
    return tasks.value.find((t) => t.uuid === currentTaskUuid.value) || null;
  });

  // 是否有选中的任务
  const hasCurrentTask = computed(() => !!currentTask.value);

  // 当前任务名称
  const currentTaskName = computed(() => currentTask.value?.title || '');

  // 收藏的任务
  const favoriteTasks = computed(() => tasks.value.filter((t) => t.favorite));

  // 按时间分组的任务（侧边栏使用）
  const groupedTasks = computed<GroupedTasks>(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const result: GroupedTasks = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    for (const task of tasks.value) {
      const taskDate = new Date(task.updatedAt);
      const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

      if (taskDay.getTime() >= today.getTime()) {
        result.today.push(task);
      } else if (taskDay.getTime() >= yesterday.getTime()) {
        result.yesterday.push(task);
      } else {
        result.earlier.push(task);
      }
    }

    return result;
  });

  // ========== 方法 ==========

  /**
   * 获取任务列表
   */
  async function fetchTasks(keyword?: string, favorite?: boolean) {
    loading.value = true;
    try {
      const params: Record<string, unknown> = {};
      if (keyword) params.keyword = keyword;
      if (favorite !== undefined) params.favorite = favorite;

      tasks.value = await fetchTasksApi(params);
    } catch (error) {
      console.error('获取任务列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 添加任务到列表（新建任务后调用）
   */
  function addTask(task: Task) {
    // 添加到列表开头（最新的在前面）
    tasks.value.unshift(task);
  }

  /**
   * 更新任务
   */
  async function updateTask(uuid: string, params: UpdateTaskParams) {
    try {
      const updatedTask = await updateTaskApi(uuid, params);
      // 更新本地列表
      const index = tasks.value.findIndex((t) => t.uuid === uuid);
      if (index !== -1) {
        tasks.value[index] = updatedTask;
      }
      return updatedTask;
    } catch (error) {
      console.error('更新任务失败:', error);
      throw error;
    }
  }

  /**
   * 删除任务
   */
  async function deleteTask(uuid: string) {
    try {
      await deleteTaskApi(uuid);
      // 从本地列表移除
      tasks.value = tasks.value.filter((t) => t.uuid !== uuid);
      // 如果删除的是当前任务，清除选中状态
      if (currentTaskUuid.value === uuid) {
        currentTaskUuid.value = null;
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      throw error;
    }
  }

  /**
   * 设置当前任务
   */
  function setCurrentTask(uuid: string) {
    currentTaskUuid.value = uuid;
  }

  /**
   * 清除当前任务
   */
  function clearCurrentTask() {
    currentTaskUuid.value = null;
  }

  /**
   * 切换收藏状态
   */
  async function toggleFavorite(uuid: string) {
    const task = tasks.value.find((t) => t.uuid === uuid);
    if (!task) return;

    // 乐观更新
    const oldValue = task.favorite;
    task.favorite = !oldValue;

    try {
      await updateTaskApi(uuid, { favorite: !oldValue });
    } catch (error) {
      // 回滚
      task.favorite = oldValue;
      throw error;
    }
  }

  /**
   * 更新本地任务状态（不调用 API）
   */
  function updateLocalTask(uuid: string, data: Partial<Task>) {
    const index = tasks.value.findIndex((t) => t.uuid === uuid);
    if (index !== -1 && tasks.value[index]) {
      const task = tasks.value[index];
      Object.assign(task, data);
    }
  }

  /**
   * 触碰任务（乐观更新）
   * 更新任务的 updatedAt 为当前时间，并将其移动到列表最前面
   * 用于发送消息后立即更新侧边栏显示
   */
  function touchTask(uuid: string) {
    const index = tasks.value.findIndex((t) => t.uuid === uuid);
    if (index !== -1) {
      const task = tasks.value[index]!;
      // 更新时间为当前时间
      task.updatedAt = new Date().toISOString();
      // 如果不在第一位，移动到最前面
      if (index > 0) {
        tasks.value.splice(index, 1);
        tasks.value.unshift(task);
      }
    }
  }

  return {
    // 状态
    tasks,
    currentTaskUuid,
    loading,

    // 计算属性
    currentTask,
    hasCurrentTask,
    currentTaskName,
    favoriteTasks,
    groupedTasks,

    // 方法
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    setCurrentTask,
    clearCurrentTask,
    toggleFavorite,
    updateLocalTask,
    touchTask,
  };
});
