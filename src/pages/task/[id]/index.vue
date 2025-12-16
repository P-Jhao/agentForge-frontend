<script setup lang="ts">
/**
 * 任务对话页面
 * 展示与 AI 的对话过程
 */
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useChat } from '@/composable/task';
import TaskHeader from './components/TaskHeader.vue';
import ChatMessageList from './components/ChatMessageList.vue';
import ChatInputArea from './components/ChatInputArea.vue';

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
  <div class="flex h-full flex-col">
    <!-- 头部 -->
    <TaskHeader :task-id="taskId" />

    <!-- 消息列表 -->
    <ChatMessageList ref="messagesContainer" :messages="messages" :is-loading="isLoading" />

    <!-- 输入区域 -->
    <ChatInputArea
      :input-value="inputValue"
      :is-loading="isLoading"
      @update:input-value="inputValue = $event"
      @send="handleSend"
    />
  </div>
</template>
