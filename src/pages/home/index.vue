<script setup lang="ts">
/**
 * 首页
 * 欢迎页 + 快速入口 + 推荐示例
 * 使用 CSS 类自动适配深浅主题
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { NTag } from 'naive-ui';
import ChatInput from '@/components/ChatInput.vue';
import FeaturedTaskCard from '@/components/FeaturedTaskCard.vue';
import XScroll from '@/components/XScroll.vue';
import { useAutoOperation } from '@/composable/intent';
import type { EnhanceMode } from '@/utils/enhanceMode';
import type { FeaturedTask } from '@/types';
import { useUserStore } from '@/stores';
import { saveUserSettings } from '@/utils/userSettings';

const router = useRouter();
const userStore = useUserStore();
const askInput = ref('');

// 自动操作 composable
const { executeSmartRouting } = useAutoOperation();

// 发送按钮高亮状态
const highlightSend = ref(false);
// 打字机目标内容（用于检测用户是否修改）
let typewriterTargetContent = '';

// 打字机效果定时器
let typewriterTimers: ReturnType<typeof setTimeout>[] = [];

/**
 * 打字机效果输入
 */
function typeAskInput(content: string) {
  // 清理之前的定时器
  typewriterTimers.forEach((timer) => clearTimeout(timer));
  typewriterTimers = [];

  // 重置状态
  askInput.value = '';
  highlightSend.value = false;
  typewriterTargetContent = content;

  const chars = content.split('');
  let cumulativeDelay = 0;

  chars.forEach((char, index) => {
    // 每个字符随机延迟 10-50ms
    const randomDelay = Math.floor(Math.random() * 41) + 10;
    cumulativeDelay += randomDelay;

    const timer = setTimeout(() => {
      askInput.value += char;
      // 最后一个字符时，启用高亮效果
      if (index === chars.length - 1) {
        highlightSend.value = true;
      }
    }, cumulativeDelay);
    typewriterTimers.push(timer);
  });
}

/**
 * 监听输入框变化，用户修改时取消高亮
 */
function handleInputChange() {
  if (askInput.value !== typewriterTargetContent) {
    highlightSend.value = false;
  }
}

// 组件卸载时清理定时器
onUnmounted(() => {
  typewriterTimers.forEach((timer) => clearTimeout(timer));
});

// 推荐示例列表
const featuredTasks = ref<FeaturedTask[]>([]);
const featuredLoading = ref(false);

// 智能路由加载状态
const smartRoutingLoading = ref(false);

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
 * 发送消息，根据智能路由状态决定流程
 */
const handleSend = async (
  message: string,
  enableThinking?: boolean,
  enhanceMode?: EnhanceMode,
  files?: { filePath: string; originalName: string; size: number; url: string }[],
  smartRouting?: boolean
) => {
  // 如果启用了智能路由，执行智能路由流程
  if (smartRouting) {
    // 不清空输入框，显示加载状态
    smartRoutingLoading.value = true;

    try {
      await executeSmartRouting(message, files, enableThinking, enhanceMode);
    } finally {
      // 清理加载状态
      smartRoutingLoading.value = false;
    }
    return;
  }

  // 原有逻辑：清空输入并直接跳转到任务页
  askInput.value = '';
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
    // 调用真实 API 获取推荐示例
    const { getFeaturedList } = await import('@/utils');
    featuredTasks.value = await getFeaturedList();
  } catch (error) {
    console.error('加载推荐示例失败:', error);
  } finally {
    featuredLoading.value = false;
  }
}

// 处理一键做同款（事件委托）
interface CloneOptions {
  prompt: string;
  enableThinking: boolean;
  enhanceMode: EnhanceMode;
  smartRoutingEnabled: boolean;
}

function handleClone(options: CloneOptions) {
  const { prompt, enableThinking, enhanceMode, smartRoutingEnabled } = options;

  // 1. 填入输入框
  typeAskInput(prompt);

  // 2. 保存设置到 localStorage
  const userId = userStore.userInfo?.id;
  if (userId) {
    saveUserSettings(userId, {
      enableThinking,
      enhanceMode,
      smartRoutingEnabled,
    });
  }

  // 3. 通知 ChatInput 组件重新加载设置
  window.dispatchEvent(new CustomEvent('userSettingsChanged'));
}

// 处理推荐示例区域的点击事件（事件委托）
function handleFeaturedClick(e: MouseEvent) {
  const target = e.target as HTMLElement;

  // 处理一键做同款
  if (target.dataset.clone !== undefined) {
    const prompt = target.dataset.clone;
    if (prompt) {
      // 解析设置选项
      const enableThinking = target.dataset.enableThinking === 'true';
      const enhanceMode = (target.dataset.enhanceMode || 'off') as EnhanceMode;
      const smartRoutingEnabled = target.dataset.smartRouting === 'true';

      handleClone({
        prompt,
        enableThinking,
        enhanceMode,
        smartRoutingEnabled,
      });
    }
    return;
  }

  // 处理查看回放
  if (target.dataset.replay) {
    router.push(`/task/${target.dataset.replay}/replay`);
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
          <iconpark-icon name="robot-two" size="18" class="text-primary-500" />
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
          :highlight-send="highlightSend"
          :show-smart-routing="true"
          :loading="smartRoutingLoading"
          @send="handleSend"
          @update:model-value="handleInputChange"
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
        <XScroll :height="260" :gap="16" loop @item-click="handleFeaturedClick">
          <FeaturedTaskCard
            v-for="featured in featuredTasks"
            :key="featured.id"
            :featured="featured"
            class="w-72 shrink-0"
          />
        </XScroll>
      </div>
    </div>
  </div>
</template>
