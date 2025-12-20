<script setup lang="ts">
/**
 * 任务对话页面
 * 展示与 AI 的对话过程
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useChat } from '@/composable/task';
import { useTaskStore } from '@/stores';
import ChatInput from '@/components/ChatInput.vue';
import TaskHeader from './components/TaskHeader.vue';
import ChatMessageList from './components/ChatMessageList.vue';

const route = useRoute();
const taskStore = useTaskStore();

// 任务 UUID
const taskId = computed(() => route.params.id as string);

// 当前任务关联的 Forge 信息
const currentForge = computed(() => taskStore.currentTask?.agent || null);

// 消息列表组件引用
const messageListRef = ref<InstanceType<typeof ChatMessageList> | null>(null);

// 滚动到底部的方法（供 useChat 使用）
const scrollToBottom = () => {
  messageListRef.value?.scrollToBottom();
};

// 使用 chat composable
const {
  renderItems,
  inputValue,
  isLoading,
  handleSend,
  init,
  clearMessages,
  setTaskId,
  cancelRequest,
} = useChat({
  taskId: taskId.value,
  onScrollToBottom: scrollToBottom,
});

// 监听 taskId 变化，切换任务时重新初始化
watch(
  taskId,
  (newTaskId, oldTaskId) => {
    if (newTaskId && newTaskId !== oldTaskId) {
      // 先取消当前正在进行的 SSE 请求
      cancelRequest();
      // 清空当前消息，更新 taskId，重新初始化
      clearMessages();
      setTaskId(newTaskId);
      init();
    }
  },
  { immediate: true }
);

// 组件销毁前取消 SSE 请求
onBeforeUnmount(() => {
  cancelRequest();
});
</script>

<template>
  <div class="-mt-6 flex h-full flex-col overflow-hidden">
    <!-- 头部（固定不滚动） -->
    <TaskHeader />

    <!-- 消息列表（可滚动区域） -->
    <ChatMessageList
      ref="messageListRef"
      class="min-h-0 flex-1"
      :render-items="renderItems"
      :is-loading="isLoading"
      :forge="currentForge"
    />

    <!-- 输入区域（固定在底部） -->
    <div class="shrink-0 p-4">
      <ChatInput
        :model-value="inputValue"
        placeholder="输入消息..."
        :loading="isLoading"
        @update:model-value="inputValue = $event"
        @send="handleSend"
      />
    </div>
  </div>
</template>
