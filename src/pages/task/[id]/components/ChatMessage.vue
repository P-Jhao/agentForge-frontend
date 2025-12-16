<script setup lang="ts">
/**
 * 单条聊天消息组件
 * 展示用户或 AI 的消息
 * 支持 assistant 消息的多段落显示（thinking/chat/tool/error）
 */
import { computed } from 'vue';
import { NIcon, NSpin } from 'naive-ui';
import { PersonOutline } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';
import type { MessageSegment } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | MessageSegment[];
}

interface Props {
  message: Message;
}

const props = defineProps<Props>();

const themeStore = useThemeStore();

const isUserMessage = computed(() => props.message.role === 'user');

// 获取消息内容（统一为字符串或段落数组）
const messageContent = computed(() => {
  if (typeof props.message.content === 'string') {
    return props.message.content;
  }
  return props.message.content;
});

// 是否为段落数组
const isSegments = computed(() => Array.isArray(messageContent.value));

// 是否显示加载状态（assistant 消息内容为空时）
const showLoading = computed(() => {
  if (props.message.role !== 'assistant') return false;
  if (typeof props.message.content === 'string') {
    return !props.message.content;
  }
  return props.message.content.length === 0;
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

// 获取段落的样式类
const getSegmentClass = (type: string) => {
  switch (type) {
  case 'thinking':
    return themeStore.isDark ? 'text-gray-400 italic' : 'text-gray-500 italic';
  case 'error':
    return 'text-red-500';
  case 'tool':
    return themeStore.isDark ? 'text-blue-400' : 'text-blue-600';
  default:
    return '';
  }
};

// 获取段落的前缀标签
const getSegmentLabel = (type: string) => {
  switch (type) {
  case 'thinking':
    return '💭 ';
  case 'tool':
    return '🔧 ';
  case 'error':
    return '❌ ';
  default:
    return '';
  }
};
</script>

<template>
  <div class="flex gap-3" :class="containerClass">
    <!-- 头像 -->
    <div
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      :class="avatarClass"
    >
      <NIcon v-if="isUserMessage" :component="PersonOutline" :size="16" />
      <span v-else class="text-sm">🤖</span>
    </div>

    <!-- 消息内容 -->
    <div class="max-w-[70%] rounded-2xl px-4 py-3" :class="messageClass">
      <!-- 加载状态 -->
      <NSpin v-if="showLoading" size="small" />

      <!-- 用户消息（纯字符串） -->
      <p v-else-if="isUserMessage" class="text-sm whitespace-pre-wrap">
        {{ messageContent }}
      </p>

      <!-- AI 消息（段落数组） -->
      <div v-else-if="isSegments" class="space-y-2">
        <div
          v-for="(segment, index) in messageContent as MessageSegment[]"
          :key="index"
          class="text-sm whitespace-pre-wrap"
          :class="getSegmentClass(segment.type)"
        >
          <span v-if="segment.type !== 'chat'">{{ getSegmentLabel(segment.type) }}</span>
          {{ segment.content }}
        </div>
      </div>

      <!-- AI 消息（纯字符串，兼容旧数据） -->
      <p v-else class="text-sm whitespace-pre-wrap">
        {{ messageContent }}
      </p>
    </div>
  </div>
</template>
