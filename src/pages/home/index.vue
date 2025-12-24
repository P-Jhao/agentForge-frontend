<script setup lang="ts">
/**
 * 首页
 * 欢迎页 + 快速入口 + 推荐示例
 * 使用 CSS 类自动适配深浅主题
 */
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NIcon, NTag } from 'naive-ui';
import { SparklesOutline } from '@vicons/ionicons5';
import ChatInput from '@/components/ChatInput.vue';
import FeaturedTaskCard from '@/components/FeaturedTaskCard.vue';
import XScroll from '@/components/XScroll.vue';
import { mockFeaturedTasks } from '@/mock/featuredTasks';
import type { EnhanceMode } from '@/utils/enhanceMode';
import type { FeaturedTask } from '@/types';

const router = useRouter();
const askInput = ref('');

// 推荐示例列表
const featuredTasks = ref<FeaturedTask[]>([]);
const featuredLoading = ref(false);

/**
 * 生成 UUID
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * 发送消息，跳转到任务页
 */
const handleSend = (
  message: string,
  enableThinking?: boolean,
  enhanceMode?: EnhanceMode,
  files?: { filePath: string; originalName: string; size: number; url: string }[]
) => {
  const taskId = generateUUID();
  // 将初始消息存储到 sessionStorage，供任务页读取
  sessionStorage.setItem(`task_${taskId}_init`, message);
  // 存储深度思考设置
  if (enableThinking !== undefined) {
    localStorage.setItem('enableThinking', String(enableThinking));
  }
  // 存储增强模式设置
  if (enhanceMode) {
    sessionStorage.setItem(`task_${taskId}_enhanceMode`, enhanceMode);
  }
  // 存储文件信息（如果有）
  if (files && files.length > 0) {
    sessionStorage.setItem(`task_${taskId}_file`, JSON.stringify(files));
  }
  askInput.value = '';
  router.push(`/task/${taskId}`);
};

// 快速分类标签
const categories = [
  '推荐',
  '渗透测试',
  '代码审计',
  '应急响应',
  '安全咨询',
  '数字教师',
  'MSS运营',
  '主机安全',
];

// 统计数据
const stats = [
  { label: '已处理任务', value: '12,847' },
  { label: '活跃 Forge', value: '5' },
  { label: 'MCP 工具', value: '28' },
];

// 加载推荐示例
async function loadFeaturedTasks() {
  featuredLoading.value = true;
  try {
    // 使用 mock 数据测试 UI
    featuredTasks.value = mockFeaturedTasks;
    // 正式环境使用 API
    // featuredTasks.value = await getFeaturedList();
  } catch (error) {
    console.error('加载推荐示例失败:', error);
  } finally {
    featuredLoading.value = false;
  }
}

onMounted(() => {
  loadFeaturedTasks();
});
</script>

<template>
  <div class="relative min-h-full">
    <!-- 背景装饰 -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <!-- 渐变光晕 - 使用主题自适应类 -->
      <div class="bg-glow-blue absolute -top-40 -left-40 h-80 w-80 rounded-full blur-[100px]"></div>
      <div
        class="bg-glow-purple absolute top-20 -right-40 h-96 w-96 rounded-full blur-[120px]"
      ></div>
      <div class="bg-glow-cyan absolute top-1/2 left-1/4 h-72 w-72 rounded-full blur-[100px]"></div>
    </div>

    <div class="relative space-y-8">
      <!-- 欢迎区域 -->
      <div class="text-center">
        <div
          class="border-primary-500/30 bg-primary-500/10 mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2"
        >
          <NIcon :component="SparklesOutline" class="text-primary-500" />
          <span class="text-tag text-sm">AI 驱动的智能工具平台</span>
        </div>
        <h1 class="title-glow mb-4 text-5xl font-bold">
          欢迎使用
          <span class="text-gradient">AgentForge</span>
        </h1>
        <p class="text-theme-secondary mx-auto max-w-2xl text-lg">
          锻造你的专属 AI Agent，通过 MCP 选配打造强大的智能助手
        </p>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-3 gap-4">
        <div v-for="stat in stats" :key="stat.label" class="card-theme rounded-2xl p-4 text-center">
          <div class="text-theme text-2xl font-bold">
            {{ stat.value }}
          </div>
          <div class="text-theme-secondary text-sm">
            {{ stat.label }}
          </div>
        </div>
      </div>

      <!-- Ask AI 入口 -->
      <div class="card-theme-gradient rounded-2xl p-6">
        <div class="mb-4 flex items-center gap-3">
          <img
            src="@/assets/imgs/listen-nobg-670x720.png"
            alt="Ask AI"
            class="h-10 w-10 object-contain"
          />
          <div>
            <h3 class="text-theme font-semibold">Ask AI</h3>
            <p class="text-theme-secondary text-sm">输入你的问题，AI 将智能路由到对应 Forge</p>
          </div>
        </div>
        <ChatInput
          v-model="askInput"
          placeholder="例如：帮我审计这段代码的安全性..."
          @send="handleSend"
        />
      </div>

      <!-- 快速分类 -->
      <div class="flex flex-wrap gap-2">
        <NTag
          v-for="(category, index) in categories"
          :key="category"
          :type="index === 0 ? 'primary' : 'default'"
          round
          :bordered="false"
          class="cursor-pointer"
        >
          {{ category }}
        </NTag>
      </div>

      <!-- 推荐示例 -->
      <div v-if="featuredTasks.length > 0">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-theme text-xl font-semibold">推荐示例</h2>
        </div>
        <XScroll :height="220" :gap="16" loop>
          <FeaturedTaskCard
            v-for="featured in featuredTasks"
            :key="featured.id"
            :featured="featured"
            class="w-56 shrink-0"
          />
        </XScroll>
      </div>
    </div>
  </div>
</template>
