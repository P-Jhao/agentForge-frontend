<script setup lang="ts">
/**
 * 单条聊天消息组件
 * 根据消息类型渲染不同内容
 */
import { computed } from 'vue';
import { NSpin, NAvatar } from 'naive-ui';
import { useThemeStore, useUserStore } from '@/stores';
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

// 是否为用户消息
const isUserMessage = computed(() => props.data.type === 'user');

// 是否为工具调用
const isToolCall = computed(() => props.data.type === 'tool_call');

// 是否为文本消息（chat/thinking/error）
const isTextMessage = computed(() => ['chat', 'thinking', 'error'].includes(props.data.type));

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

// 获取文本消息的样式类
const textContentClass = computed(() => {
  switch (props.data.type) {
    case 'thinking':
      return themeStore.isDark ? 'text-gray-400 italic' : 'text-gray-500 italic';
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
        :class="avatarClass"
      />
    </div>

    <!-- 消息内容 -->
    <div class="max-w-[70%] rounded-2xl px-4 py-3" :class="messageClass">
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
    </div>
  </div>
</template>
