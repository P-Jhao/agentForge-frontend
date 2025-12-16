/**
 * 任务状态管理
 * 用于存储当前选中的任务信息
 */
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

// 当前任务信息类型
export interface CurrentTask {
  id: string;
  name: string;
}

export const useTaskStore = defineStore('task', () => {
  // 当前选中的任务
  const currentTask = ref<CurrentTask | null>(null);

  // 计算属性：是否有选中的任务
  const hasCurrentTask = computed(() => !!currentTask.value);

  // 计算属性：当前任务名称
  const currentTaskName = computed(() => currentTask.value?.name || '');

  // 设置当前任务
  function setCurrentTask(task: CurrentTask) {
    currentTask.value = task;
  }

  // 清除当前任务
  function clearCurrentTask() {
    currentTask.value = null;
  }

  return {
    currentTask,
    hasCurrentTask,
    currentTaskName,
    setCurrentTask,
    clearCurrentTask,
  };
});
