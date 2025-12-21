<script setup lang="ts">
/**
 * 单条聊天消息组件
 * iMessage 风格设计，使用 CSS 类自动适配深浅主题
 */
import { computed } from 'vue';
import { NSpin, NAvatar } from 'naive-ui';
import { useUserStore } from '@/stores';
import type { TaskForge } from '@/types';
import type {
  MessageData,
  UserMessageData,
  TextMessageData,
  ToolCallMessageData,
} from '@/composable/task/useChat';
import ToolCallItem from './ToolCallItem.vue';

interface Props {
  data: MessageData;
  // 关联的 Forge 信息（用于显示 AI 头像）
  forge?: TaskForge | null;
}

const props = withDefaults(defineProps<Props>(), {
  forge: null,
});

const userStore = useUserStore();

// 获取 Forge 头像完整 URL
const forgeAvatarUrl = computed(() => {
  if (!props.forge?.avatar) return '';
  if (props.forge.avatar.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE || '';
    const baseUrl = apiBase.replace(/\/api$/, '');
    return `${baseUrl}${props.forge.avatar}`;
  }
  return props.forge.avatar;
});

// 获取用户名首字母（大写）
const userInitial = computed(() => {
  return userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U';
});

// 是否为用户消息
const isUserMessage = computed(() => props.data.type === 'user');

// 是否为工具调用
const isToolCall = computed(() => props.data.type === 'tool_call');

// 是否为文本消息（chat/thinking/error）
const isTextMessage = computed(() => ['chat', 'thinking', 'error'].includes(props.data.type));

// 是否为总结消息
const isSummaryMessage = computed(() => props.data.type === 'summary');

// 文本消息数据
const textData = computed(() => props.data as TextMessageData);

// 工具调用数据
const toolCallData = computed(() => props.data as ToolCallMessageData);

// 用户消息数据
const userData = computed(() => props.data as UserMessageData);

// 是否显示加载状态（assistant chat 消息内容为空时）
const showLoading = computed(() => {
  if (props.data.type !== 'chat') return false;
  return !(props.data as TextMessageData).content;
});

// 容器布局类
const containerClass = computed(() => ({
  'flex-row-reverse': isUserMessage.value,
}));

// 获取文本消息的样式类
const textContentClass = computed(() => {
  switch (props.data.type) {
    case 'thinking':
      return 'text-thinking';
    case 'error':
      return 'text-red-500';
    default:
      return '';
  }
});

// 获取文本消息的前缀标签
const textContentLabel = computed(() => {
  switch (props.data.type) {
    case 'thinking':
      return '💭 ';
    case 'error':
      return '❌ ';
    default:
      return '';
  }
});
</script>

<template>
  <div class="flex gap-3" :class="containerClass">
    <!-- 头像 -->
    <div class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
      <!-- 用户头像：显示用户名首字母 -->
      <NAvatar
        v-if="isUserMessage"
        round
        :size="32"
        class="from-primary-500 to-accent-purple bg-linear-to-br text-white"
      >
        {{ userInitial }}
      </NAvatar>
      <!-- AI 头像：优先显示 Forge 头像，否则显示默认头像 -->
      <NAvatar
        v-else
        :src="forgeAvatarUrl || '/favicon660x660nobackground.png'"
        :size="32"
        round
        object-fit="cover"
        class="avatar-ai"
      />
    </div>

    <!-- 消息内容 -->
    <div
      class="max-w-[70%] rounded-2xl px-4 py-3"
      :class="isUserMessage ? 'bubble-user' : 'bubble-ai'"
    >
      <!-- 加载状态 -->
      <NSpin v-if="showLoading" size="small" />

      <!-- 用户消息 -->
      <p v-else-if="isUserMessage" class="text-sm whitespace-pre-wrap">
        {{ userData.content }}
      </p>

      <!-- 工具调用消息 -->
      <ToolCallItem
        v-else-if="isToolCall"
        :call-id="toolCallData.callId"
        :tool-name="toolCallData.toolName"
        :status="toolCallData.status"
        :arguments="toolCallData.arguments"
        :result="toolCallData.result"
      />

      <!-- 文本消息（chat/thinking/error） -->
      <p v-else-if="isTextMessage" class="text-sm whitespace-pre-wrap" :class="textContentClass">
        <span v-if="textContentLabel">{{ textContentLabel }}</span>
        {{ textData.content }}
      </p>

      <!-- 总结消息（科技感样式） -->
      <div v-else-if="isSummaryMessage" class="summary-message">
        <div class="summary-header">
          <span class="summary-icon">✨</span>
          <span class="summary-title">AI 总结</span>
        </div>
        <div class="summary-content">
          {{ textData.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 总结消息 - 科技感样式 */
.summary-message {
  position: relative;
  padding: 1rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
  border: 1px solid rgba(99, 102, 241, 0.3);
  backdrop-filter: blur(8px);
}

.summary-message::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #6366f1, #a855f7, #6366f1);
  border-radius: 0.75rem 0.75rem 0 0;
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
}

.summary-icon {
  font-size: 1.25rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.summary-title {
  font-weight: 600;
  font-size: 0.875rem;
  background: linear-gradient(90deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.summary-content {
  font-size: 0.875rem;
  line-height: 1.6;
  white-space: pre-wrap;
  color: inherit;
}

/* 深色模式适配 */
:global(.dark) .summary-message {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%);
  border-color: rgba(99, 102, 241, 0.4);
}
</style>
