<script setup lang="ts">
/**
 * 任务回放页面
 * 以动画效果重新播放历史对话
 * 支持分享链接访问（无需登录）
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NIcon, NButton, NSpace, NSpin, NDropdown, NResult, NTag } from 'naive-ui';
import {
  PlayOutline,
  PauseOutline,
  RefreshOutline,
  ArrowBackOutline,
  SpeedometerOutline,
} from '@vicons/ionicons5';
import { createStreamRequest, getSharedMessages, getSharedTask } from '@/utils';
import { useTaskStore } from '@/stores';
import ChatMessageList from './components/ChatMessageList.vue';
import type { FlatMessage, TaskSSEChunk } from '@/types';
import type {
  RenderItem,
  TextMessageData,
  UserMessageData,
  ToolCallMessageData,
} from '@/composable/task/useChat';
import { reactive } from 'vue';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();

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

// 当前任务信息
const currentTask = computed(() => {
  if (isShareMode.value && sharedTask.value) {
    return sharedTask.value;
  }
  return taskStore.tasks.find((t) => t.uuid === taskId.value);
});

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
  // 普通模式下，从 taskStore 获取
  const task = taskStore.tasks.find((t) => t.uuid === taskId.value);
  return task?.agent || null;
});

// 加载状态
const loading = ref(true);
const error = ref<string | null>(null);

// 原始历史消息
const historyMessages = ref<FlatMessage[]>([]);

// 当前播放的消息列表（用于渲染）
const renderItems = ref<RenderItem[]>([]);

// 播放状态
const isPlaying = ref(false);
const isPaused = ref(false);
const currentIndex = ref(0);
const playbackSpeed = ref(1); // 播放速度倍率

// 播放定时器
let playTimer: ReturnType<typeof setTimeout> | null = null;
// 打字机定时器
let typewriterTimer: ReturnType<typeof setTimeout> | null = null;

// SSE 请求取消函数
let abortRequest: (() => void) | null = null;

// 消息列表组件引用
const messageListRef = ref<InstanceType<typeof ChatMessageList> | null>(null);

// 是否播放完成
const isCompleted = computed(() => {
  return currentIndex.value >= historyMessages.value.length;
});

// 速度选项
const speedOptions = [
  { label: '0.5x', key: 0.5 },
  { label: '1x', key: 1 },
  { label: '1.5x', key: 1.5 },
  { label: '2x', key: 2 },
  { label: '3x', key: 3 },
];

/**
 * 获取 token
 */
function getToken() {
  return localStorage.getItem('forgeToken') || '';
}

/**
 * 加载分享任务信息
 */
async function loadSharedTask() {
  if (!shareSign.value) return false;
  try {
    const task = await getSharedTask(taskId.value, shareSign.value);
    sharedTask.value = {
      title: task.title,
      agent: task.agent,
      ownerName: task.ownerName,
      ownerAvatar: task.ownerAvatar,
    };
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
}

/**
 * 将 FlatMessage 转换为 RenderItem
 * @param msg 原始消息
 * @param emptyContent 是否创建空内容（用于打字机效果）
 */
function convertToRenderItem(msg: FlatMessage, emptyContent = false): RenderItem {
  const id = msg.id?.toString() || `msg_${Date.now()}_${Math.random()}`;

  if (msg.role === 'user') {
    const data = reactive<UserMessageData>({
      id,
      type: 'user',
      content: msg.content, // 用户消息始终完整显示
      files: msg.files,
    });
    return { id, type: 'user', data };
  }

  if (msg.type === 'tool_call') {
    const data = reactive<ToolCallMessageData>({
      id,
      type: 'tool_call',
      callId: msg.callId || '',
      toolName: msg.toolName || '',
      summarizedResult: msg.summarizedResult,
      success: msg.success ?? false,
      status: msg.success ? 'success' : 'failed',
    });
    return { id, type: 'tool_call', data };
  }

  // 处理增强相关类型
  if (
    ['user_original', 'user_answer', 'reviewer', 'questioner', 'expert', 'enhancer'].includes(
      msg.type
    )
  ) {
    const msgType = msg.type as
      | 'user_original'
      | 'user_answer'
      | 'reviewer'
      | 'questioner'
      | 'expert'
      | 'enhancer';
    // user_original 和 user_answer 是用户消息，完整显示
    const isUserMsg = msgType === 'user_original' || msgType === 'user_answer';
    const data = reactive<TextMessageData>({
      id,
      type: msgType,
      content: isUserMsg || !emptyContent ? msg.content : '',
      isStreaming: !isUserMsg && emptyContent, // AI 消息标记为流式
    });
    return { id, type: msgType, data };
  }

  // chat/thinking/error/summary - AI 消息需要打字机效果
  const msgType = (msg.type || 'chat') as 'chat' | 'thinking' | 'error' | 'summary';
  const data = reactive<TextMessageData>({
    id,
    type: msgType,
    content: emptyContent ? '' : msg.content,
    isStreaming: emptyContent, // 标记为流式输出中
  });
  return { id, type: msgType, data };
}

/**
 * 通过 SSE 加载历史消息（普通模式）
 */
async function loadHistorySSE() {
  loading.value = true;
  error.value = null;

  const { abort, promise } = createStreamRequest<TaskSSEChunk>({
    url: `${API_BASE}/task/${taskId.value}/message`,
    body: { loadHistory: true },
    headers: { Authorization: `Bearer ${getToken()}` },
    onChunk: (chunk) => {
      if (chunk.type === 'history' && Array.isArray(chunk.data)) {
        // 收到历史消息，保存并立即断开
        historyMessages.value = chunk.data as FlatMessage[];
        // 断开连接
        abort();
      }
    },
    onComplete: () => {
      loading.value = false;
      abortRequest = null;
    },
    onError: (err) => {
      error.value = '加载历史消息失败';
      console.error('加载历史消息失败:', err);
      loading.value = false;
      abortRequest = null;
    },
  });

  abortRequest = abort;
  await promise;
}

/**
 * 通过分享 API 加载历史消息（分享模式）
 */
async function loadHistoryShare() {
  if (!shareSign.value) return;
  loading.value = true;
  error.value = null;

  try {
    const result = await getSharedMessages(taskId.value, shareSign.value);
    historyMessages.value = result.messages as FlatMessage[];
  } catch (err) {
    const e = err as { message?: string; status?: number };
    if (e.status === 403) {
      error.value = '分享链接已失效或无效';
    } else if (e.status === 404) {
      error.value = '任务不存在';
    } else {
      error.value = e.message || '加载失败';
    }
  } finally {
    loading.value = false;
  }
}

/**
 * 加载历史消息（根据模式选择）
 */
async function loadHistory() {
  if (isShareMode.value) {
    await loadHistoryShare();
  } else {
    await loadHistorySSE();
  }
}

/**
 * 判断消息是否需要打字机效果
 */
function needsTypewriter(msg: FlatMessage): boolean {
  // 用户消息不需要打字机
  if (msg.role === 'user') return false;
  // 工具调用不需要打字机
  if (msg.type === 'tool_call') return false;
  // user_original 和 user_answer 不需要打字机
  if (msg.type === 'user_original' || msg.type === 'user_answer') return false;
  // 其他 AI 消息需要打字机
  return true;
}

/**
 * 获取打字机延迟时间
 * @param msgType 消息类型
 * @returns 延迟时间（毫秒）
 */
function getTypewriterDelay(msgType: string): number {
  // 深度思考：固定 5ms
  if (msgType === 'thinking') {
    return 5 / playbackSpeed.value;
  }
  // 普通 chat：随机 7-22ms
  const randomDelay = Math.floor(Math.random() * 15) + 7;
  return randomDelay / playbackSpeed.value;
}

/**
 * 打字机效果播放消息内容
 */
function typewriterPlay(renderItem: RenderItem, fullContent: string, onComplete: () => void) {
  const data = renderItem.data as TextMessageData;
  const chars = fullContent.split('');
  let charIndex = 0;

  function typeNextChar() {
    if (charIndex < chars.length && isPlaying.value && !isPaused.value) {
      data.content += chars[charIndex];
      charIndex++;
      // 滚动到底部
      messageListRef.value?.scrollToBottom();
      // 根据消息类型获取延迟时间
      const delay = getTypewriterDelay(renderItem.type);
      typewriterTimer = setTimeout(typeNextChar, delay);
    } else if (charIndex >= chars.length) {
      // 打字完成
      data.isStreaming = false;
      onComplete();
    }
    // 如果暂停了，不继续打字，等待恢复
  }

  typeNextChar();
}

/**
 * 播放下一条消息
 */
function playNext() {
  if (currentIndex.value >= historyMessages.value.length) {
    // 播放完成
    isPlaying.value = false;
    isPaused.value = false;
    return;
  }

  const msg = historyMessages.value[currentIndex.value];
  if (!msg) return;

  // 判断是否需要打字机效果
  const useTypewriter = needsTypewriter(msg);

  // 添加消息到渲染列表
  const renderItem = convertToRenderItem(msg, useTypewriter);
  renderItems.value.push(renderItem);
  currentIndex.value++;

  // 滚动到底部
  messageListRef.value?.forceScrollToBottom();

  if (useTypewriter) {
    // AI 消息：打字机效果
    typewriterPlay(renderItem, msg.content, () => {
      // 打字完成后，短暂延迟再播放下一条
      if (isPlaying.value && !isPaused.value) {
        playTimer = setTimeout(playNext, 300 / playbackSpeed.value);
      }
    });
  } else {
    // 用户消息：直接显示，短暂延迟后播放下一条
    if (currentIndex.value < historyMessages.value.length && isPlaying.value && !isPaused.value) {
      playTimer = setTimeout(playNext, 500 / playbackSpeed.value);
    } else if (currentIndex.value >= historyMessages.value.length) {
      // 播放完成
      isPlaying.value = false;
      isPaused.value = false;
    }
  }
}

/**
 * 开始播放
 */
function startPlay() {
  if (isCompleted.value) {
    // 如果已完成，重新开始
    resetPlay();
  }

  isPlaying.value = true;
  isPaused.value = false;
  playNext();
}

/**
 * 暂停播放
 */
function pausePlay() {
  isPaused.value = true;
  if (playTimer) {
    clearTimeout(playTimer);
    playTimer = null;
  }
  if (typewriterTimer) {
    clearTimeout(typewriterTimer);
    typewriterTimer = null;
  }
}

/**
 * 继续播放
 */
function resumePlay() {
  isPaused.value = false;
  // 检查当前是否有正在打字的消息
  const lastItem = renderItems.value[renderItems.value.length - 1];
  if (lastItem && (lastItem.data as TextMessageData).isStreaming) {
    // 继续打字
    const msg = historyMessages.value[currentIndex.value - 1];
    if (msg) {
      const data = lastItem.data as TextMessageData;
      const remainingContent = msg.content.slice(data.content.length);
      typewriterPlay(lastItem, remainingContent, () => {
        if (isPlaying.value && !isPaused.value) {
          playTimer = setTimeout(playNext, 300 / playbackSpeed.value);
        }
      });
    }
  } else {
    // 播放下一条
    playNext();
  }
}

/**
 * 重置播放
 */
function resetPlay() {
  if (playTimer) {
    clearTimeout(playTimer);
    playTimer = null;
  }
  if (typewriterTimer) {
    clearTimeout(typewriterTimer);
    typewriterTimer = null;
  }
  isPlaying.value = false;
  isPaused.value = false;
  currentIndex.value = 0;
  renderItems.value = [];
}

/**
 * 切换播放/暂停
 */
function togglePlay() {
  if (!isPlaying.value) {
    startPlay();
  } else if (isPaused.value) {
    resumePlay();
  } else {
    pausePlay();
  }
}

/**
 * 返回首页
 */
function goBack() {
  router.push('/');
}

/**
 * 选择播放速度
 */
function handleSpeedSelect(key: number) {
  playbackSpeed.value = key;
}

// 组件挂载时加载历史消息并自动播放
onMounted(async () => {
  // 分享模式：先加载任务信息
  if (isShareMode.value) {
    const success = await loadSharedTask();
    if (!success) return;
  } else {
    // 普通模式：确保任务列表已加载
    if (taskStore.tasks.length === 0) {
      await taskStore.fetchTasks();
    }
  }

  await loadHistory();
  // 加载完成后自动开始播放
  if (historyMessages.value.length > 0) {
    startPlay();
  }
});

// 组件销毁前清理定时器和 SSE 请求
onBeforeUnmount(() => {
  if (playTimer) {
    clearTimeout(playTimer);
    playTimer = null;
  }
  if (typewriterTimer) {
    clearTimeout(typewriterTimer);
    typewriterTimer = null;
  }
  if (abortRequest) {
    abortRequest();
    abortRequest = null;
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
      <!-- 头部 -->
      <div
        class="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700"
      >
        <div class="flex items-center gap-3">
          <NButton quaternary circle size="small" @click="goBack">
            <template #icon>
              <NIcon :component="ArrowBackOutline" />
            </template>
          </NButton>
          <div>
            <h1 class="text-base font-medium">
              {{ currentTask?.title || '任务回放' }}
            </h1>
            <p class="text-theme-muted flex items-center gap-2 text-xs">
              回放模式 · 只读
              <NTag v-if="isShareMode" type="info" size="tiny" round>分享链接</NTag>
            </p>
          </div>
        </div>

        <!-- 播放控制 -->
        <NSpace align="center" :size="12">
          <!-- 速度控制（下拉菜单） -->
          <NDropdown :options="speedOptions" trigger="click" @select="handleSpeedSelect">
            <NButton quaternary size="small">
              <template #icon>
                <NIcon :component="SpeedometerOutline" />
              </template>
              {{ playbackSpeed }}x
            </NButton>
          </NDropdown>

          <!-- 重置按钮 -->
          <NButton quaternary circle size="small" :disabled="currentIndex === 0" @click="resetPlay">
            <template #icon>
              <NIcon :component="RefreshOutline" />
            </template>
          </NButton>

          <!-- 播放/暂停按钮 -->
          <NButton
            type="primary"
            circle
            :disabled="loading || historyMessages.length === 0"
            @click="togglePlay"
          >
            <template #icon>
              <NIcon :component="isPlaying && !isPaused ? PauseOutline : PlayOutline" />
            </template>
          </NButton>
        </NSpace>
      </div>

      <!-- 消息列表 -->
      <div class="relative min-h-0 flex-1">
        <!-- 加载状态 -->
        <div v-if="loading" class="flex h-full items-center justify-center">
          <NSpin size="large" />
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="flex h-full flex-col items-center justify-center gap-4">
          <p class="text-red-500">{{ error }}</p>
          <NButton @click="loadHistory">重试</NButton>
        </div>

        <!-- 空状态 -->
        <div
          v-else-if="historyMessages.length === 0"
          class="text-theme-muted flex h-full items-center justify-center"
        >
          暂无历史消息
        </div>

        <!-- 消息列表 -->
        <ChatMessageList
          v-else
          ref="messageListRef"
          class="h-full"
          :render-items="renderItems"
          :is-loading="false"
          :forge="currentForge"
          :owner-avatar="isShareMode ? sharedTask?.ownerAvatar : null"
          :owner-name="isShareMode ? sharedTask?.ownerName : null"
        />
      </div>

      <!-- 底部提示 -->
      <div class="shrink-0 border-t border-gray-200 px-4 py-3 text-center dark:border-gray-700">
        <p class="text-theme-muted text-xs">
          回放模式下无法发送消息 ·
          <button class="text-primary-500 hover:underline" @click="goBack">回到首页</button>
        </p>
      </div>
    </template>
  </div>
</template>
