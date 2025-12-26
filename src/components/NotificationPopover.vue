<script setup lang="ts">
/**
 * 通知弹出框组件
 * 显示任务完成通知列表，点击可跳转到对应任务
 * 使用 Teleport 将弹出框渲染到 body，避免被其他元素遮挡
 */
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { NIcon, NBadge, NButton, NEmpty, NScrollbar } from 'naive-ui';
import { NotificationsOutline, CheckmarkCircleOutline, HelpCircleOutline } from '@vicons/ionicons5';
import { useNotificationStore, type NotificationType } from '@/stores/modules/notification';
import { storeToRefs } from 'pinia';

const router = useRouter();
const notificationStore = useNotificationStore();
const { notifications, unreadCount, hasUnread, showPopover, latestNotification } =
  storeToRefs(notificationStore);

// 弹出框容器引用
const popoverRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);

// 弹出框位置
const popoverPosition = ref({ top: '0px', right: '0px' });

// 计算弹出框位置
function updatePopoverPosition() {
  if (!triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  popoverPosition.value = {
    top: `${rect.bottom + 8}px`,
    right: `${window.innerWidth - rect.right}px`,
  };
}

// 点击外部关闭弹出框
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (
    popoverRef.value &&
    !popoverRef.value.contains(target) &&
    triggerRef.value &&
    !triggerRef.value.contains(target)
  ) {
    notificationStore.closePopover();
  }
}

// 按下键盘时关闭弹出框
function handleKeyDown() {
  if (showPopover.value) {
    notificationStore.closePopover();
  }
}

// 切换弹出框
async function handleToggle() {
  if (!showPopover.value) {
    updatePopoverPosition();
  }
  notificationStore.togglePopover();
}

// 点击通知项，跳转到任务详情
function handleNotificationClick(taskUuid: string, notificationId: string) {
  notificationStore.markAsRead(notificationId);
  notificationStore.closePopover();
  router.push(`/task/${taskUuid}`);
}

// 点击最新通知提示
function handleLatestNotificationClick() {
  if (latestNotification.value) {
    const { taskUuid, id } = latestNotification.value;
    notificationStore.markAsRead(id);
    notificationStore.clearLatestNotification();
    router.push(`/task/${taskUuid}`);
  }
}

// 格式化时间
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60 * 1000) {
    return '刚刚';
  }
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))} 分钟前`;
  }
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// 获取通知类型文案
function getNotificationText(type: NotificationType): string {
  switch (type) {
    case 'task_completed':
      return '已完成';
    case 'task_waiting':
      return '等待回复';
    default:
      return '';
  }
}

// 获取通知类型描述
function getNotificationDesc(type: NotificationType): string {
  switch (type) {
    case 'task_completed':
      return '任务已完成';
    case 'task_waiting':
      return '等待您的回复';
    default:
      return '';
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', updatePopoverPosition);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', updatePopoverPosition);
});
</script>

<template>
  <div class="notification-wrapper">
    <!-- 触发按钮 -->
    <div ref="triggerRef">
      <NBadge :value="unreadCount" :max="9" :show="hasUnread">
        <NButton quaternary circle @click="handleToggle">
          <template #icon>
            <NIcon :component="NotificationsOutline" :size="20" />
          </template>
        </NButton>
      </NBadge>
    </div>

    <!-- 使用 Teleport 将弹出框渲染到 body -->
    <Teleport to="body">
      <!-- 最新通知弹出提示 -->
      <Transition name="notification-toast">
        <div
          v-if="latestNotification"
          class="notification-toast"
          :style="popoverPosition"
          @click="handleLatestNotificationClick"
        >
          <div class="flex items-center gap-2">
            <NIcon
              :component="
                latestNotification.type === 'task_waiting'
                  ? HelpCircleOutline
                  : CheckmarkCircleOutline
              "
              :size="18"
              :class="
                latestNotification.type === 'task_waiting' ? 'text-amber-500' : 'text-green-500'
              "
            />
            <span class="flex-1 truncate text-sm">{{ latestNotification.taskTitle }}</span>
            <span class="text-xs opacity-60">
              {{ getNotificationText(latestNotification.type) }}
            </span>
          </div>
        </div>
      </Transition>

      <!-- 通知列表弹出框 -->
      <Transition name="popover">
        <div
          v-if="showPopover"
          ref="popoverRef"
          class="notification-popover"
          :style="popoverPosition"
        >
          <div class="popover-header">
            <span class="font-medium">通知</span>
            <NButton
              v-if="notifications.length > 0"
              text
              size="tiny"
              @click="notificationStore.clearAll"
            >
              清空
            </NButton>
          </div>

          <NScrollbar style="max-height: 320px">
            <div v-if="notifications.length === 0" class="py-8">
              <NEmpty description="暂无通知" size="small" />
            </div>

            <div v-else class="notification-list">
              <div
                v-for="item in notifications"
                :key="item.id"
                class="notification-item"
                :class="{ unread: !item.read }"
                @click="handleNotificationClick(item.taskUuid, item.id)"
              >
                <div class="flex items-start gap-3">
                  <NIcon
                    :component="
                      item.type === 'task_waiting' ? HelpCircleOutline : CheckmarkCircleOutline
                    "
                    :size="20"
                    :class="
                      item.type === 'task_waiting'
                        ? 'mt-0.5 text-amber-500'
                        : 'mt-0.5 text-green-500'
                    "
                  />
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium">{{ item.taskTitle }}</div>
                    <div class="text-xs opacity-60">{{ getNotificationDesc(item.type) }}</div>
                  </div>
                  <span class="text-xs whitespace-nowrap opacity-50">
                    {{ formatTime(item.createdAt) }}
                  </span>
                </div>
              </div>
            </div>
          </NScrollbar>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.notification-wrapper {
  position: relative;
}
</style>

<style>
/* 全局样式（因为 Teleport 到 body） */
.notification-toast {
  position: fixed;
  padding: 12px 16px;
  min-width: 240px;
  max-width: 300px;
  border-radius: 8px;
  cursor: pointer;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  background: white;
  border: 1px solid #e5e7eb;
}

.notification-toast:hover {
  background: #f9fafb;
}

.dark .notification-toast {
  background: #1f2937;
  border: 1px solid #374151;
}

.dark .notification-toast:hover {
  background: #374151;
}

.notification-popover {
  position: fixed;
  width: 320px;
  border-radius: 12px;
  overflow: hidden;
  z-index: 9999;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  background: white;
  border: 1px solid #e5e7eb;
}

.dark .notification-popover {
  background: #1f2937;
  border: 1px solid #374151;
}

.notification-popover .popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.dark .notification-popover .popover-header {
  border-bottom-color: #374151;
}

.notification-popover .notification-list {
  padding: 8px 0;
}

.notification-popover .notification-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.notification-popover .notification-item:hover {
  background: #f3f4f6;
}

.dark .notification-popover .notification-item:hover {
  background: #374151;
}

.notification-popover .notification-item.unread {
  background: #eff6ff;
}

.dark .notification-popover .notification-item.unread {
  background: rgba(59, 130, 246, 0.1);
}

/* 动画 */
.notification-toast-enter-active,
.notification-toast-leave-active {
  transition: all 0.3s ease;
}

.notification-toast-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.notification-toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.popover-enter-active,
.popover-leave-active {
  transition: all 0.2s ease;
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
