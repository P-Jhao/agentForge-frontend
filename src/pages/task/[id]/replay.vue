<script setup lang="ts">
/**
 * 任务回放页面
 * 以动画效果重新播放历史对话
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NIcon, NButton, NSlider, NSpace, NSpin } from 'naive-ui';
import {
  PlayOutline,
  PauseOutline,
  RefreshOutline,
  ArrowBackOutline,
  SpeedometerOutline,
} from '@vicons/ionicons5';
import { createStreamRequest } from '@/utils';
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

// 当前任务信息
const currentTask = computed(() => {
  return taskStore.tasks.find((t) => t.uuid === taskId.value);
});

// 当前任务关联的 Forge 信息
const currentForge = computed(() => currentTask.value?.agent || null);

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

// SSE 请求取消函数
let abortRequest: (() => void) | null = null;

// 消息列表组件引用
const messageListRef = ref<InstanceType<typeof ChatMessageList> | null>(null);

// 是否播放完成
const isCompleted = computed(() => {
  return currentIndex.value >= historyMessages.value.length;
});

// 速度选项
const speedOptions = [0.5, 1, 1.5, 2, 3];

/**
 * 获取 token
 */
function getToken() {
  return localStorage.getItem('forgeToken') || '';
}

/**
 * 将 FlatMessage 转换为 RenderItem
 */
function convertToRenderItem(msg: FlatMessage): RenderItem {
  const id = msg.id?.toString() || `msg_${Date.now()}_${Math.random()}`;

  if (msg.role === 'user') {
    const data = reactive<UserMessageData>({
      id,
      type: 'user',
      content: msg.content,
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
      arguments: msg.arguments || {},
      result: msg.result,
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
    const data = reactive<TextMessageData>({
      id,
      type: msgType,
      content: msg.content,
    });
    return { id, type: msgType, data };
  }

  // chat/thinking/error/summary
  const msgType = (msg.type || 'chat') as 'chat' | 'thinking' | 'error' | 'summary';
  const data = reactive<TextMessageData>({
    id,
    type: msgType,
    content: msg.content,
  });
  return { id, type: msgType, data };
}

/**
 * 通过 SSE 加载历史消息
 */
async function loadHistory() {
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
 * 计算消息播放延迟（根据消息类型和内容长度）
 */
function getMessageDelay(msg: FlatMessage): number {
  const baseDelay = 800; // 基础延迟 800ms

  // 根据消息类型调整延迟
  if (msg.role === 'user') {
    return baseDelay / playbackSpeed.value;
  }

  if (msg.type === 'tool_call') {
    return (baseDelay * 1.5) / playbackSpeed.value;
  }

  if (msg.type === 'thinking') {
    // 思考消息根据内容长度调整
    const contentLength = msg.content?.length || 0;
    const extraDelay = Math.min(contentLength / 50, 2000); // 最多额外 2 秒
    return (baseDelay + extraDelay) / playbackSpeed.value;
  }

  // 普通消息根据内容长度调整
  const contentLength = msg.content?.length || 0;
  const extraDelay = Math.min(contentLength / 30, 3000); // 最多额外 3 秒
  return (baseDelay + extraDelay) / playbackSpeed.value;
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

  // 添加消息到渲染列表
  const renderItem = convertToRenderItem(msg);
  renderItems.value.push(renderItem);
  currentIndex.value++;

  // 滚动到底部
  messageListRef.value?.forceScrollToBottom();

  // 如果还有消息且正在播放，设置下一条的定时器
  if (currentIndex.value < historyMessages.value.length && isPlaying.value && !isPaused.value) {
    const delay = getMessageDelay(msg);
    playTimer = setTimeout(playNext, delay);
  } else if (currentIndex.value >= historyMessages.value.length) {
    // 播放完成
    isPlaying.value = false;
    isPaused.value = false;
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
}

/**
 * 继续播放
 */
function resumePlay() {
  isPaused.value = false;
  playNext();
}

/**
 * 重置播放
 */
function resetPlay() {
  if (playTimer) {
    clearTimeout(playTimer);
    playTimer = null;
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
 * 返回任务详情
 */
function goBack() {
  router.push(`/task/${taskId.value}`);
}

/**
 * 切换播放速度
 */
function cycleSpeed() {
  const currentIdx = speedOptions.indexOf(playbackSpeed.value);
  const nextIdx = (currentIdx + 1) % speedOptions.length;
  playbackSpeed.value = speedOptions[nextIdx] ?? 1;
}

/**
 * 跳转到指定位置
 */
function seekTo(val: number) {
  if (playTimer) {
    clearTimeout(playTimer);
    playTimer = null;
  }
  currentIndex.value = val;
  renderItems.value = historyMessages.value.slice(0, val).map(convertToRenderItem);
}

// 组件挂载时加载历史消息
onMounted(async () => {
  // 确保任务列表已加载
  if (taskStore.tasks.length === 0) {
    await taskStore.fetchTasks();
  }
  await loadHistory();
});

// 组件销毁前清理定时器和 SSE 请求
onBeforeUnmount(() => {
  if (playTimer) {
    clearTimeout(playTimer);
    playTimer = null;
  }
  if (abortRequest) {
    abortRequest();
    abortRequest = null;
  }
});
</script>

<template>
  <div class="-m-6 flex h-[calc(100%+48px)] flex-col overflow-hidden text-sm">
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
          <p class="text-theme-muted text-xs">回放模式 · 只读</p>
        </div>
      </div>

      <!-- 播放控制 -->
      <NSpace align="center" :size="12">
        <!-- 速度控制 -->
        <NButton quaternary size="small" @click="cycleSpeed">
          <template #icon>
            <NIcon :component="SpeedometerOutline" />
          </template>
          {{ playbackSpeed }}x
        </NButton>

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

        <!-- 进度显示 -->
        <span class="text-theme-secondary text-xs">
          {{ currentIndex }} / {{ historyMessages.length }}
        </span>
      </NSpace>
    </div>

    <!-- 进度条 -->
    <div class="shrink-0 px-4 py-2">
      <NSlider
        :value="currentIndex"
        :max="historyMessages.length"
        :step="1"
        :disabled="isPlaying && !isPaused"
        :tooltip="false"
        @update:value="seekTo"
      />
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
      />
    </div>

    <!-- 底部提示 -->
    <div class="shrink-0 border-t border-gray-200 px-4 py-3 text-center dark:border-gray-700">
      <p class="text-theme-muted text-xs">
        回放模式下无法发送消息 ·
        <button class="text-primary-500 hover:underline" @click="goBack">返回对话</button>
      </p>
    </div>
  </div>
</template>
