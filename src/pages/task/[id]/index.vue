<script setup lang="ts">
/**
 * 任务对话页面
 * 展示与 AI 的对话过程
 */
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { NIcon, NSpin } from 'naive-ui';
import { PersonOutline } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';
import { useChat } from '@/composable/task';
import ChatInput from '@/components/ChatInput.vue';

const route = useRoute();
const themeStore = useThemeStore();

// 任务 ID
const taskId = computed(() => route.params.id as string);

// 消息容器引用
const messagesContainer = ref<HTMLElement | null>(null);

// 使用 chat composable
const { messages, inputValue, isLoading, handleSend, initFromSession } = useChat({
  taskId: taskId.value,
  containerRef: messagesContainer,
});

// 初始化
onMounted(() => {
  initFromSession();
});
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- 头部 -->
    <div
      class="flex items-center justify-between border-b px-6 py-4"
      :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'"
    >
      <div>
        <h1
          class="text-lg font-semibold"
          :class="themeStore.isDark ? 'text-white' : 'text-gray-900'"
        >
          AI 对话
        </h1>
        <p class="text-xs" :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-400'">
          任务 ID: {{ taskId }}
        </p>
      </div>
    </div>

    <!-- 消息列表 -->
    <div ref="messagesContainer" class="flex-1 space-y-4 overflow-y-auto p-6">
      <!-- 空状态 -->
      <div
        v-if="messages.length === 0 && !isLoading"
        class="flex h-full items-center justify-center"
      >
        <p :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-400'">开始你的对话吧</p>
      </div>

      <!-- 消息列表 -->
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="flex gap-3"
        :class="msg.role === 'user' ? 'flex-row-reverse' : ''"
      >
        <!-- 头像 -->
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          :class="
            msg.role === 'user'
              ? 'bg-primary-500 text-white'
              : themeStore.isDark
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-200 text-gray-600'
          "
        >
          <NIcon v-if="msg.role === 'user'" :component="PersonOutline" :size="16" />
          <span v-else class="text-sm">🤖</span>
        </div>

        <!-- 消息内容 -->
        <div
          class="max-w-[70%] rounded-2xl px-4 py-3"
          :class="
            msg.role === 'user'
              ? 'bg-primary-500 text-white'
              : themeStore.isDark
                ? 'bg-gray-800 text-gray-200'
                : 'bg-gray-100 text-gray-800'
          "
        >
          <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="flex gap-3">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          :class="themeStore.isDark ? 'bg-gray-700' : 'bg-gray-200'"
        >
          <span class="text-sm">🤖</span>
        </div>
        <div
          class="rounded-2xl px-4 py-3"
          :class="themeStore.isDark ? 'bg-gray-800' : 'bg-gray-100'"
        >
          <NSpin size="small" />
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="border-t p-4" :class="themeStore.isDark ? 'border-gray-700' : 'border-gray-200'">
      <ChatInput
        v-model="inputValue"
        placeholder="输入消息..."
        type="multi"
        :loading="isLoading"
        @send="handleSend"
      />
    </div>
  </div>
</template>
