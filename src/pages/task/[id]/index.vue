<script setup lang="ts">
/**
 * 任务对话页面
 * 展示与 AI 的对话过程
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NIcon, NButton, useMessage } from 'naive-ui';
import { ArrowDownOutline } from '@vicons/ionicons5';
import { useChat } from '@/composable/task';
import { useTaskStore, useUserStore } from '@/stores';
import { getTask } from '@/utils';
import ChatInput from '@/components/ChatInput.vue';
import SmartIterateReplyInput from '@/components/SmartIterateReplyInput.vue';
import TaskHeader from './components/TaskHeader.vue';
import ChatMessageList from './components/ChatMessageList.vue';
import type { EnhanceMode } from '@/utils/enhanceMode';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const taskStore = useTaskStore();
const userStore = useUserStore();

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

// 检查任务访问权限
const checkTaskPermission = async (uuid: string) => {
  try {
    const task = await getTask(uuid);
    // 检查是否为自己的任务
    const isOwnTask = task.userId === userStore.userInfo?.id;
    taskStore.isOwnTask = isOwnTask;
    return true;
  } catch (error) {
    const err = error as { status?: number; message?: string };
    if (err.status === 403) {
      message.error('此任务您无权限查看');
      // 延迟后跳转
      setTimeout(() => {
        // operator 跳转到 /admin，其他用户跳转到首页
        if (userStore.isOperator) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }, 2000);
      return false;
    }
    // 其他错误（如 404）也处理
    if (err.status === 404) {
      message.error('任务不存在');
      setTimeout(() => {
        if (userStore.isOperator) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }, 2000);
      return false;
    }
    return true;
  }
};

// 使用 chat composable
const {
  renderItems,
  inputValue,
  isLoading,
  isStreaming,
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
  async (newTaskId, oldTaskId) => {
    if (newTaskId && newTaskId !== oldTaskId) {
      // 先检查权限
      const hasPermission = await checkTaskPermission(newTaskId);
      if (!hasPermission) return;

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
    <div class="relative shrink-0 px-4 pb-2">
      <!-- 查看他人任务时的提示栏 -->
      <div
        v-if="!taskStore.isOwnTask"
        class="mb-3 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 text-sm dark:bg-blue-900/30"
      >
        <span class="text-gray-600 dark:text-gray-300">当前任务为他人任务，仅支持预览</span>
        <NButton text type="primary" size="small" @click="router.push('/')">返回首页</NButton>
      </div>

      <!-- 滚动到底部按钮 -->
      <Transition name="fade">
        <button
          v-if="showScrollToBottomBtn"
          class="scroll-to-bottom-btn absolute -top-12 left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-none shadow-lg transition-all"
          @click="handleScrollToBottomClick"
        >
          <NIcon :component="ArrowDownOutline" :size="20" />
        </button>
      </Transition>

      <!-- 智能迭代回复输入框（当需要回复澄清问题时显示） -->
      <SmartIterateReplyInput
        v-if="showSmartIterateReply && taskStore.isOwnTask"
        :loading="isLoading"
        @submit="onSmartIterateReply"
      />
      <!-- 普通输入框（仅自己的任务显示） -->
      <ChatInput
        v-else-if="taskStore.isOwnTask"
        :model-value="inputValue"
        placeholder="输入消息..."
        :loading="isLoading"
        :show-stop-button="isStreaming"
        @update:model-value="inputValue = $event"
        @send="onSend"
        @cancel="onCancel"
      />
      <!-- 免责声明（仅自己的任务显示） -->
      <p v-if="taskStore.isOwnTask" class="mt-2 text-center text-xs text-gray-400">
        AI 生成，仅供参考
      </p>
    </div>
  </div>
</template>

<style scoped>
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
