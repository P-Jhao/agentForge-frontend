<script setup lang="ts">
/**
 * 聊天消息容器组件
 * iMessage 风格设计，使用动态组件渲染不同类型的消息
 */
import { computed } from 'vue';
import { NAvatar } from 'naive-ui';
import { useUserStore } from '@/stores';
import { messageComponents } from './messages';
import type { TaskForge } from '@/types';
import type { MessageData } from '@/composable/task/useChat';

interface Props {
  data: MessageData;
  // 关联的 Forge 信息（用于显示 AI 头像）
  forge?: TaskForge | null;
}

const props = withDefaults(defineProps<Props>(), {
  forge: null,
});

const userStore = useUserStore();

// 动态获取消息组件
const MessageComponent = computed(() => {
  return messageComponents[props.data.type] || messageComponents.chat;
});

// 是否为用户消息（包括 user、user_original、user_answer、enhancer）
const isUserMessage = computed(() =>
  ['user', 'user_original', 'user_answer', 'enhancer'].includes(props.data.type)
);

// 是否为思考消息
const isThinkingMessage = computed(() => props.data.type === 'thinking');

// 是否为增强过程消息（reviewer、questioner、expert）
const isEnhanceProcessMessage = computed(() =>
  ['reviewer', 'questioner', 'expert'].includes(props.data.type)
);

// 是否为轮次结束消息（不需要头像，独立显示）
const isTurnEndMessage = computed(() => props.data.type === 'turn_end');

// 是否需要气泡样式（user、chat、user_original、user_answer 需要）
const needsBubble = computed(() =>
  ['user', 'chat', 'user_original', 'user_answer'].includes(props.data.type)
);

// 获取 AI 头像 URL
const aiAvatarUrl = computed(() => {
  // 思考消息使用专门的思考头像
  if (isThinkingMessage.value) {
    return '/thinking670x670.png';
  }
  // 增强过程消息使用增强头像
  if (isEnhanceProcessMessage.value) {
    return '/favicon660x660nobackground.png';
  }
  // 其他消息优先使用 Forge 头像
  if (props.forge?.avatar) {
    if (props.forge.avatar.startsWith('/')) {
      const apiBase = import.meta.env.VITE_API_BASE || '';
      const baseUrl = apiBase.replace(/\/api$/, '');
      return `${baseUrl}${props.forge.avatar}`;
    }
    return props.forge.avatar;
  }
  return '/favicon660x660nobackground.png';
});

// 获取用户名首字母（大写）
const userInitial = computed(() => {
  return userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U';
});
</script>

<template>
  <!-- 轮次结束消息：独立显示，不需要头像，但左边留出头像空间保持对齐 -->
  <div v-if="isTurnEndMessage" class="flex gap-3">
    <!-- 占位空间，与头像宽度一致 -->
    <div class="w-8 shrink-0"></div>
    <!-- 操作栏内容 -->
    <div class="flex-1">
      <component :is="MessageComponent" :data="data" />
    </div>
  </div>

  <!-- 其他消息：带头像的布局 -->
  <div v-else class="flex gap-3" :class="{ 'flex-row-reverse': isUserMessage }">
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
      <!-- AI 头像：思考消息用思考头像，其他用 Forge 头像或默认头像 -->
      <NAvatar v-else :src="aiAvatarUrl" :size="32" round object-fit="cover" class="avatar-ai" />
    </div>

    <!-- 消息内容（动态组件） -->
    <div
      class="max-w-[70%]"
      :class="needsBubble ? (isUserMessage ? 'bubble-user px-4 py-3' : 'bubble-ai px-4 py-3') : ''"
    >
      <component :is="MessageComponent" :data="data" />
    </div>
  </div>
</template>
