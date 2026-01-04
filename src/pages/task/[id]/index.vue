<script setup lang="ts">
/**
 * 任务对话页面
 * 展示与 AI 的对话过程
 * 支持分享链接访问（无需登录）
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NIcon, NButton, useMessage, NResult } from 'naive-ui';
import { ArrowDownOutline } from '@vicons/ionicons5';
import { useChat, useShareChat } from '@/composable/task';
import { useTaskStore, useUserStore } from '@/stores';
import { getTask, getSharedTask } from '@/utils';
import ChatInput from '@/components/ChatInput.vue';
import SmartIterateReplyInput from '@/components/SmartIterateReplyInput.vue';
import TaskHeader from './components/TaskHeader.vue';
import ShareHeader from './components/ShareHeader.vue';
import ChatMessageList from './components/ChatMessageList.vue';
import type { EnhanceMode } from '@/utils/enhanceMode';
import type { OutputFileInfo } from '@/types';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const taskStore = useTaskStore();
const userStore = useUserStore();

// 任务 UUID
const taskId = computed(() => route.params.id as string);

// 分享签名（如果有则为分享模式）
const shareSign = computed(() => route.query.shareSign as string | undefined);

// 是否为分享模式
const isShareMode = computed(() => !!shareSign.value);

// 分享模式下的任务信息
const sharedTask = ref<{
  title: string;
  agent?: { displayName: string; avatar?: string };
  ownerName?: string;
  ownerAvatar?: string | null;
} | null>(null);

// 分享模式下的错误信息
const shareError = ref<string | null>(null);

// 当前任务关联的 Forge 信息
const currentForge = computed(() => {
  if (isShareMode.value && sharedTask.value?.agent) {
    // 分享模式下，构造一个兼容的 Forge 对象
    return {
      id: 0, // 分享模式下没有 id，使用 0 作为占位
      displayName: sharedTask.value.agent.displayName,
      avatar: sharedTask.value.agent.avatar || null,
    };
  }
  return taskStore.currentTask?.agent || null;
});

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

// 检查任务访问权限（普通模式）
// 注意：如果是新任务（sessionStorage 中有 initMessage），跳过权限检查
const checkTaskPermission = async (uuid: string) => {
  // 检查是否是新任务（从首页跳转过来，需要先创建任务）
  const initKey = `task_${uuid}_init`;
  const initMessage = sessionStorage.getItem(initKey);
  if (initMessage) {
    // 新任务，跳过权限检查，让 init() 创建任务
    taskStore.isOwnTask = true;
    return true;
  }

  try {
    const task = await getTask(uuid);
    // 检查是否为自己的任务
    const isOwnTask = task.userId === userStore.userInfo?.id;
    taskStore.isOwnTask = isOwnTask;

    // 如果是查看他人任务，将任务数据添加到 store 中
    // 这样 taskStore.currentTask 才能正确获取到任务信息
    if (!isOwnTask) {
      // 检查任务是否已在列表中，避免重复添加
      const existingTask = taskStore.tasks.find((t) => t.uuid === uuid);
      if (!existingTask) {
        taskStore.addTask(task);
      }
      // 设置当前任务
      taskStore.setCurrentTask(uuid);
    }
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

// 加载分享任务信息
const loadSharedTask = async (uuid: string, sign: string) => {
  try {
    const task = await getSharedTask(uuid, sign);
    sharedTask.value = {
      title: task.title,
      agent: task.agent,
      ownerName: task.ownerName,
      ownerAvatar: task.ownerAvatar,
    };
    // 分享模式下不是自己的任务
    taskStore.isOwnTask = false;
    // 设置分享任务标题，供 LayoutHeader 显示
    taskStore.setSharedTaskTitle(task.title);
    shareError.value = null;
    return true;
  } catch (error) {
    const err = error as { status?: number; message?: string };
    if (err.status === 403) {
      shareError.value = '分享链接已失效或无效';
    } else if (err.status === 404) {
      shareError.value = '任务不存在';
    } else {
      shareError.value = err.message || '加载失败';
    }
    return false;
  }
};

// 使用 chat composable（普通模式）
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
  updateFeedbackStatus,
} = useChat({
  taskId: taskId.value,
  onScrollToBottom: scrollToBottom,
  onForceScrollToBottom: forceScrollToBottom,
});

// 使用分享 chat composable（分享模式）
const shareChat = shareSign.value
  ? useShareChat({ taskId: taskId.value, shareSign: shareSign.value })
  : null;

// 根据模式选择渲染项
const displayRenderItems = computed(() => {
  if (isShareMode.value && shareChat) {
    return shareChat.renderItems.value;
  }
  return renderItems.value;
});

// 根据模式选择加载状态
const displayIsLoading = computed(() => {
  if (isShareMode.value && shareChat) {
    return shareChat.isLoading.value;
  }
  return isLoading.value;
});

// 从渲染项中提取所有输出文件
const allOutputFiles = computed<OutputFileInfo[]>(() => {
  const files: OutputFileInfo[] = [];
  const items = displayRenderItems.value;
  for (const item of items) {
    if (item.type === 'tool_call' && item.data.type === 'tool_call') {
      const toolData = item.data as { outputFiles?: OutputFileInfo[] };
      if (toolData.outputFiles && toolData.outputFiles.length > 0) {
        files.push(...toolData.outputFiles);
      }
    }
  }
  return files;
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

// 处理反馈状态变更
const handleFeedbackChange = (messageId: number, type: 'like' | 'dislike' | null) => {
  updateFeedbackStatus(messageId, type);
};

// 是否显示智能迭代回复输入框
const showSmartIterateReply = computed(() => needsSmartIterateReply());

// 监听 taskId 变化，切换任务时重新初始化
watch(
  [taskId, shareSign],
  async ([newTaskId, newShareSign], [oldTaskId]) => {
    if (!newTaskId) return;

    // 分享模式
    if (newShareSign) {
      const success = await loadSharedTask(newTaskId, newShareSign);
      if (success && shareChat) {
        await shareChat.loadMessages();
      }
      return;
    }

    // 普通模式
    if (newTaskId !== oldTaskId) {
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
  if (!isShareMode.value) {
    disconnectStream();
  }
});
</script>

<template>
  <div class="-m-6 flex h-[calc(100%+48px)] flex-col overflow-hidden text-sm">
    <!-- 分享模式错误提示 -->
    <div v-if="isShareMode && shareError" class="flex h-full items-center justify-center">
      <NResult status="error" title="链接已失效" :description="shareError">
        <template #footer>
          <NButton @click="router.push('/')">返回首页</NButton>
        </template>
      </NResult>
    </div>

    <!-- 正常内容 -->
    <template v-else>
      <!-- 头部（固定不滚动） -->
      <!-- 分享模式或查看他人任务时使用 ShareHeader -->
      <ShareHeader
        v-if="isShareMode && sharedTask"
        :title="sharedTask.title"
        :forge="sharedTask.agent"
        :owner-name="sharedTask.ownerName"
      />
      <ShareHeader
        v-else-if="!taskStore.isOwnTask && taskStore.currentTask"
        :title="taskStore.currentTask.title"
        :forge="currentForge"
        :owner-name="taskStore.currentTask.ownerName"
      />
      <TaskHeader v-else :files="allOutputFiles" />

      <!-- 消息列表（可滚动区域） -->
      <ChatMessageList
        ref="messageListRef"
        class="min-h-0 flex-1"
        :render-items="displayRenderItems"
        :is-loading="displayIsLoading"
        :forge="currentForge"
        :is-own-task="taskStore.isOwnTask && !isShareMode"
        :owner-avatar="isShareMode ? sharedTask?.ownerAvatar : taskStore.currentTask?.ownerAvatar"
        :owner-name="isShareMode ? sharedTask?.ownerName : taskStore.currentTask?.ownerName"
        @feedback-change="handleFeedbackChange"
      />

      <!-- 输入区域（固定在底部，自己的任务且非分享模式显示） -->
      <div v-if="!isShareMode && taskStore.isOwnTask" class="relative shrink-0 px-4 pb-2">
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

      <!-- 查看他人任务底部提示（分享模式或管理员查看他人任务） -->
      <div
        v-if="isShareMode || !taskStore.isOwnTask"
        class="shrink-0 border-t border-gray-200 px-4 py-3 text-center dark:border-gray-700"
      >
        <p class="text-theme-muted text-xs">
          当前正在查看他人任务，无法发送消息
          <template v-if="isShareMode && sharedTask?.ownerName">
            · 来自 {{ sharedTask.ownerName }} 的分享
          </template>
          <template v-else-if="taskStore.currentTask?.ownerName">
            · 来自 {{ taskStore.currentTask.ownerName }}
          </template>
          ·
          <button class="text-primary-500 hover:underline" @click="router.push('/')">
            回到首页
          </button>
        </p>
      </div>
    </template>
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
