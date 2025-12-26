/**
 * 通知状态管理
 * 管理任务完成通知、未读状态等
 */
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

// 通知类型
export type NotificationType = 'task_completed' | 'task_waiting';

export interface TaskNotification {
  id: string;
  taskUuid: string;
  taskTitle: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
}

// 自动隐藏延迟（毫秒）
const AUTO_HIDE_DELAY = 5000;

export const useNotificationStore = defineStore('notification', () => {
  // ========== 状态 ==========

  // 通知列表
  const notifications = ref<TaskNotification[]>([]);

  // 是否显示通知弹出框
  const showPopover = ref(false);

  // 最新通知（用于弹出提示）
  const latestNotification = ref<TaskNotification | null>(null);

  // 待定通知（任务已完成但标题还是"新会话"）
  const pendingNotifications = ref<Set<string>>(new Set());

  // 自动隐藏定时器
  let autoHideTimer: ReturnType<typeof setTimeout> | null = null;

  // ========== 计算属性 ==========

  // 未读通知数量
  const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length);

  // 是否有未读通知
  const hasUnread = computed(() => unreadCount.value > 0);

  // ========== 方法 ==========

  /**
   * 添加任务完成通知
   */
  function addTaskCompletedNotification(taskUuid: string, taskTitle: string) {
    addNotification(taskUuid, taskTitle, 'task_completed');
  }

  /**
   * 添加等待回复通知
   */
  function addTaskWaitingNotification(taskUuid: string, taskTitle: string) {
    addNotification(taskUuid, taskTitle, 'task_waiting');
  }

  /**
   * 添加通知（内部方法）
   */
  function addNotification(taskUuid: string, taskTitle: string, type: NotificationType) {
    const notification: TaskNotification = {
      id: `${taskUuid}-${type}-${Date.now()}`,
      taskUuid,
      taskTitle: taskTitle || '未命名任务',
      type,
      createdAt: new Date().toISOString(),
      read: false,
    };

    // 添加到列表开头
    notifications.value.unshift(notification);

    // 设置为最新通知（触发弹出提示）
    latestNotification.value = notification;

    // 清除之前的定时器
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }

    // 设置自动隐藏定时器
    autoHideTimer = setTimeout(() => {
      latestNotification.value = null;
    }, AUTO_HIDE_DELAY);
  }

  /**
   * 添加待定通知（任务已完成但标题还是"新会话"）
   */
  function addPendingNotification(taskUuid: string, type: NotificationType = 'task_completed') {
    const pendingKey = `${taskUuid}-${type}`;
    pendingNotifications.value.add(pendingKey);
  }

  /**
   * 检查并触发待定通知（标题更新后调用）
   */
  function checkPendingNotification(taskUuid: string, taskTitle: string) {
    if (taskTitle === '新会话') return;

    // 检查完成通知
    const completedKey = `${taskUuid}-task_completed`;
    if (pendingNotifications.value.has(completedKey)) {
      pendingNotifications.value.delete(completedKey);
      addTaskCompletedNotification(taskUuid, taskTitle);
    }

    // 检查等待回复通知
    const waitingKey = `${taskUuid}-task_waiting`;
    if (pendingNotifications.value.has(waitingKey)) {
      pendingNotifications.value.delete(waitingKey);
      addTaskWaitingNotification(taskUuid, taskTitle);
    }
  }

  /**
   * 检查任务是否有待定通知
   */
  function hasPendingNotification(
    taskUuid: string,
    type: NotificationType = 'task_completed'
  ): boolean {
    return pendingNotifications.value.has(`${taskUuid}-${type}`);
  }

  /**
   * 清除待定通知（不触发弹出）
   */
  function clearPendingNotification(taskUuid: string) {
    pendingNotifications.value.delete(`${taskUuid}-task_completed`);
    pendingNotifications.value.delete(`${taskUuid}-task_waiting`);
  }

  /**
   * 标记所有通知为已读
   */
  function markAllAsRead() {
    notifications.value.forEach((n) => {
      n.read = true;
    });
  }

  /**
   * 标记单个通知为已读
   */
  function markAsRead(id: string) {
    const notification = notifications.value.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * 清除最新通知提示
   */
  function clearLatestNotification() {
    latestNotification.value = null;
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
      autoHideTimer = null;
    }
  }

  /**
   * 切换弹出框显示状态
   */
  function togglePopover() {
    showPopover.value = !showPopover.value;
    // 打开弹出框时，清除最新通知提示并标记所有为已读
    if (showPopover.value) {
      clearLatestNotification();
      markAllAsRead();
    }
  }

  /**
   * 关闭弹出框
   */
  function closePopover() {
    showPopover.value = false;
  }

  /**
   * 清空所有通知
   */
  function clearAll() {
    notifications.value = [];
    latestNotification.value = null;
  }

  return {
    // 状态
    notifications,
    showPopover,
    latestNotification,

    // 计算属性
    unreadCount,
    hasUnread,

    // 方法
    addTaskCompletedNotification,
    addTaskWaitingNotification,
    addPendingNotification,
    checkPendingNotification,
    hasPendingNotification,
    clearPendingNotification,
    markAllAsRead,
    markAsRead,
    clearLatestNotification,
    togglePopover,
    closePopover,
    clearAll,
  };
});
