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

// 是否为用户消息
const isUserMessage = computed(() => props.data.type === 'user');

// 是否需要气泡样式（只有 user 和 chat 需要）
const needsBubble = computed(() => ['user', 'chat'].includes(props.data.type));

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
</script>

<template>
  <div class="flex gap-3" :class="{ 'flex-row-reverse': isUserMessage }">
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

    <!-- 消息内容（动态组件） -->
    <div
      class="max-w-[70%]"
      :class="
        needsBubble
          ? isUserMessage
            ? 'bubble-user rounded-2xl px-4 py-3'
            : 'bubble-ai rounded-2xl px-4 py-3'
          : ''
      "
    >
      <component :is="MessageComponent" :data="data" />
    </div>
  </div>
</template>
