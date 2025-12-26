<script setup lang="ts">
/**
 * 任务对话页面
 * 展示与 AI 的对话过程
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { NIcon } from 'naive-ui';
import { ArrowDownOutline } from '@vicons/ionicons5';
import { useChat } from '@/composable/task';
import { useTaskStore } from '@/stores';
import ChatInput from '@/components/ChatInput.vue';
import SmartIterateReplyInput from '@/components/SmartIterateReplyInput.vue';
import TaskHeader from './components/TaskHeader.vue';
import ChatMessageList from './components/ChatMessageList.vue';
import type { EnhanceMode } from '@/utils/enhanceMode';

const route = useRoute();
const taskStore = useTaskStore();

// 任务 UUID
const taskId = computed(() => route.params.id as string);

// 当前任务关联的 Forge 信息
const currentForge = computed(() => taskStore.currentTask?.agent || null);

// 消息列表组件引用
const messageListRef = ref<InstanceType<typeof ChatMessageList> | null>(null);

// 是否显示滚动到底部按钮
const showScrollToBottomBtn = computed(() => {
  return messageListRef.value?.autoScrollEnabled === false;
});

// 点击滚动到底部按钮
const handleScrollToBottomClick = () => {
  messageListRef.value?.forceScrollToBottom();
};

// 滚动到底部的方法（供 useChat 流式输出时使用，会检查用户是否在底部）
const scrollToBottom = () => {
  messageListRef.value?.scrollToBottom();
};

// 强制滚动到底部（用户发送消息后使用，忽略用户滚动状态）
const forceScrollToBottom = () => {
  messageListRef.value?.forceScrollToBottom();
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
  disconnectStream,
  needsSmartIterateReply,
  sendSmartIterateReply,
} = useChat({
  taskId: taskId.value,
  onScrollToBottom: scrollToBottom,
  onForceScrollToBottom: forceScrollToBottom,
});

// 处理发送事件
const onSend = (
  content: string,
  enableThinking: boolean,
  enhanceMode: EnhanceMode,
  files?: { filePath: string; originalName: string; size: number; url: string }[]
) => {
  handleSend(content, enableThinking, enhanceMode, files);
};

// 处理取消/中断事件
const onCancel = () => {
  cancelRequest();
};

// 处理智能迭代回复
const onSmartIterateReply = (answer: string) => {
  sendSmartIterateReply(answer);
};

// 是否显示智能迭代回复输入框
const showSmartIterateReply = computed(() => needsSmartIterateReply());

// 监听 taskId 变化，切换任务时重新初始化
watch(
  taskId,
  (newTaskId, oldTaskId) => {
    if (newTaskId && newTaskId !== oldTaskId) {
      // 断开当前 SSE 连接（不中断后端 LLM，让它继续运行）
      disconnectStream();
      // 清空当前消息，更新 taskId，重新初始化
      clearMessages();
      setTaskId(newTaskId);
      init();
    }
  },
  { immediate: true }
);

// 组件销毁前断开 SSE 连接（不中断后端 LLM）
onBeforeUnmount(() => {
  disconnectStream();
});
</script>

<template>
  <div class="-m-6 flex h-[calc(100%+48px)] flex-col overflow-hidden text-sm">
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
    <div class="relative shrink-0 px-4 pt-4 pb-2">
      <!-- 滚动到底部按钮 -->
      <Transition name="fade">
        <button
          v-if="showScrollToBottomBtn"
          class="scroll-to-bottom-btn"
          @click="handleScrollToBottomClick"
        >
          <NIcon :component="ArrowDownOutline" :size="20" />
        </button>
      </Transition>

      <!-- 智能迭代回复输入框（当需要回复澄清问题时显示） -->
      <SmartIterateReplyInput
        v-if="showSmartIterateReply"
        :loading="isLoading"
        @submit="onSmartIterateReply"
      />
      <!-- 普通输入框 -->
      <ChatInput
        v-else
        :model-value="inputValue"
        placeholder="输入消息..."
        :loading="isLoading"
        @update:model-value="inputValue = $event"
        @send="onSend"
        @cancel="onCancel"
      />
      <!-- 免责声明 -->
      <p class="mt-2 text-center text-xs text-gray-400">AI 生成，仅供参考</p>
    </div>
  </div>
</template>

<style scoped>
/* 滚动到底部按钮 */
.scroll-to-bottom-btn {
  position: absolute;
  top: -48px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
  transition: all 0.2s ease;
  z-index: 10;
}

.scroll-to-bottom-btn:hover {
  background: #f3f4f6;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

:global(.dark) .scroll-to-bottom-btn {
  background: #374151;
  color: #e5e7eb;
}

:global(.dark) .scroll-to-bottom-btn:hover {
  background: #4b5563;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
