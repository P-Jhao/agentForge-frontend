<script setup lang="ts">
/**
 * 任务对话页面
 * 展示与 AI 的对话过程
 */
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useChat } from '@/composable/task';
import ChatInput from '@/components/ChatInput.vue';
import TaskHeader from './components/TaskHeader.vue';
import ChatMessageList from './components/ChatMessageList.vue';

const route = useRoute();

// 任务 ID
const taskId = computed(() => route.params.id as string);

// 消息容器引用
const messagesContainer = ref<HTMLElement | null>(null);

// 使用 chat composable
const { messages, inputValue, isLoading, handleSend, initFromSession } = useChat({
  taskId: taskId.value,
  containerRef: messagesContainer,
});

// 初始化
onMounted(() => {
  initFromSession();
});
</script>

<template>
  <div class="relative flex h-full flex-col overflow-hidden">
    <!-- 头部（固定不滚动） -->
    <TaskHeader :task-id="taskId" />

    <!-- 消息列表（可滚动区域，需要预留底部输入框空间） -->
    <ChatMessageList
      ref="messagesContainer"
      class="flex-1 overflow-y-auto pb-32"
      :messages="messages"
      :is-loading="isLoading"
    />

    <!-- 输入区域（绝对定位到底部） -->
    <div class="absolute right-0 bottom-0 left-0 p-4">
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
