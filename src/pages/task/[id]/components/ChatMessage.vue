<script setup lang="ts">
/**
 * 单条聊天消息组件
 * 扁平格式：每条消息独立渲染，不再嵌套段落数组
 */
import { computed } from 'vue';
import { NSpin, NAvatar } from 'naive-ui';
import { useThemeStore, useUserStore } from '@/stores';
import type { TaskForge } from '@/types';
import ToolCallItem from './ToolCallItem.vue';
import type { ToolCallStatus } from './ToolCallItem.vue';

// 扁平消息类型
interface Message {
  id: string;
  role: 'user' | 'assistant';
  type: 'chat' | 'thinking' | 'tool_call' | 'error';
  content: string;
  // 工具调用专用字段
  callId?: string;
  toolName?: string;
  arguments?: Record<string, unknown>;
  result?: unknown;
  success?: boolean;
}

interface Props {
  message: Message;
  // 正在进行的工具调用状态（callId -> status）
  toolCallStates?: Map<string, ToolCallStatus>;
  // 关联的 Forge 信息（用于显示 AI 头像）
  forge?: TaskForge | null;
}

const props = withDefaults(defineProps<Props>(), {
  toolCallStates: () => new Map(),
  forge: null,
});

const themeStore = useThemeStore();
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

const isUserMessage = computed(() => props.message.role === 'user');
const isToolCall = computed(() => props.message.type === 'tool_call');

// 是否显示加载状态（assistant chat 消息内容为空时）
const showLoading = computed(() => {
  if (props.message.role !== 'assistant') return false;
  if (props.message.type !== 'chat') return false;
  return !props.message.content;
});

const containerClass = computed(() => ({
  'flex-row-reverse': isUserMessage.value,
}));

const avatarClass = computed(() => {
  if (isUserMessage.value) {
    return 'bg-primary-500 text-white';
  }
  return themeStore.isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600';
});

const messageClass = computed(() => {
  if (isUserMessage.value) {
    return 'bg-primary-500 text-white';
  }
  return themeStore.isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800';
});

// 获取消息的样式类（根据类型）
const contentClass = computed(() => {
  switch (props.message.type) {
    case 'thinking':
      return themeStore.isDark ? 'text-gray-400 italic' : 'text-gray-500 italic';
    case 'error':
      return 'text-red-500';
    default:
      return '';
  }
});

// 获取消息的前缀标签
const contentLabel = computed(() => {
  switch (props.message.type) {
    case 'thinking':
      return '💭 ';
    case 'error':
      return '❌ ';
    default:
      return '';
  }
});

// 获取工具调用的状态
const toolCallStatus = computed((): ToolCallStatus => {
  if (!props.message.callId) return 'failed';
  // 优先使用实时状态（流式输出时）
  const realtimeStatus = props.toolCallStates.get(props.message.callId);
  if (realtimeStatus) {
    return realtimeStatus;
  }
  // 否则使用保存的状态（历史消息）
  return props.message.success ? 'success' : 'failed';
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
        :class="avatarClass"
      />
    </div>

    <!-- 消息内容 -->
    <div class="max-w-[70%] rounded-2xl px-4 py-3" :class="messageClass">
      <!-- 加载状态 -->
      <NSpin v-if="showLoading" size="small" />

      <!-- 工具调用消息 -->
      <ToolCallItem
        v-else-if="isToolCall"
        :call-id="message.callId || ''"
        :tool-name="message.toolName || ''"
        :status="toolCallStatus"
        :arguments="message.arguments || {}"
        :result="message.result"
      />

      <!-- 普通文本消息 -->
      <p v-else class="text-sm whitespace-pre-wrap" :class="contentClass">
        <span v-if="contentLabel">{{ contentLabel }}</span>
        {{ message.content }}
      </p>
    </div>
  </div>
</template>
