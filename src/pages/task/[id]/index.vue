<script setup lang="ts">
/**
 * 任务对话页面
 * 展示与 AI 的对话过程
 */
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { NInput, NButton, NIcon, NSpin } from 'naive-ui';
import { SendOutline, PersonOutline } from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';

// 消息类型
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const route = useRoute();
const themeStore = useThemeStore();

// 任务 ID
const taskId = computed(() => route.params.id as string);

// 消息列表
const messages = ref<Message[]>([]);

// 输入框内容
const inputValue = ref('');

// 是否正在加载
const isLoading = ref(false);

// 消息容器引用
const messagesContainer = ref<HTMLElement | null>(null);

/**
 * 生成消息 ID
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

/**
 * 滚动到底部
 */
const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

/**
 * 发送消息
 */
const handleSend = async () => {
  const content = inputValue.value.trim();
  if (!content || isLoading.value) return;

  // 添加用户消息
  messages.value.push({
    id: generateId(),
    role: 'user',
    content,
    timestamp: Date.now(),
  });

  inputValue.value = '';
  await scrollToBottom();

  // 模拟 AI 响应（后续接入真实 API）
  isLoading.value = true;
  setTimeout(async () => {
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: `收到你的消息：「${content}」\n\n这是一个模拟响应，后续将接入真实的 AI 服务。`,
      timestamp: Date.now(),
    });
    isLoading.value = false;
    await scrollToBottom();
  }, 1000);
};

/**
 * 处理回车键
 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};

/**
 * 初始化：读取首页传递的初始消息
 */
onMounted(async () => {
  const initKey = `task_${taskId.value}_init`;
  const initMessage = sessionStorage.getItem(initKey);

  if (initMessage) {
    // 清除 sessionStorage 中的初始消息
    sessionStorage.removeItem(initKey);

    // 添加用户消息
    messages.value.push({
      id: generateId(),
      role: 'user',
      content: initMessage,
      timestamp: Date.now(),
    });

    await scrollToBottom();

    // 模拟 AI 响应
    isLoading.value = true;
    setTimeout(async () => {
      messages.value.push({
        id: generateId(),
        role: 'assistant',
        content: `收到你的消息：「${initMessage}」\n\n这是一个模拟响应，后续将接入真实的 AI 服务。`,
        timestamp: Date.now(),
      });
      isLoading.value = false;
      await scrollToBottom();
    }, 1000);
  }
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
      <div class="flex gap-3">
        <NInput
          v-model:value="inputValue"
          type="textarea"
          placeholder="输入消息..."
          :autosize="{ minRows: 1, maxRows: 4 }"
          class="flex-1"
          @keydown="handleKeydown"
        />
        <NButton
          type="primary"
          :disabled="!inputValue.trim() || isLoading"
          :loading="isLoading"
          @click="handleSend"
        >
          <template #icon>
            <NIcon :component="SendOutline" />
          </template>
        </NButton>
      </div>
    </div>
  </div>
</template>
