<script setup lang="ts">
import { ref } from 'vue';
import { NInput, NButton, NIcon } from 'naive-ui';
import { SendOutline, SparklesOutline } from '@vicons/ionicons5';

const askInput = ref('');

// 功能卡片数据
const features = [
  {
    icon: '🔍',
    title: '代码审计',
    desc: '智能分析代码安全漏洞，提供修复建议',
    path: '/code-audit',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    icon: '📊',
    title: '智能评分',
    desc: '根据样本案例自动评分，判断是否符合要求',
    path: '/scoring',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: '📚',
    title: 'RAG 检索',
    desc: '上传文档构建知识库，智能语义检索',
    path: '/rag-search',
    gradient: 'from-orange-500 to-red-500',
  },
];

// 统计数据
const stats = [
  { label: '已处理请求', value: '12,847' },
  { label: '活跃 Agent', value: '5' },
  { label: '知识库文档', value: '128' },
];
</script>

<template>
  <div class="relative min-h-full">
    <!-- 背景装饰 -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <!-- 渐变光晕 -->
      <div
        class="bg-primary-600/20 absolute -top-40 -left-40 h-80 w-80 rounded-full blur-[100px]"
      ></div>
      <div
        class="bg-accent-purple/20 absolute top-20 -right-40 h-96 w-96 rounded-full blur-[120px]"
      ></div>
      <div
        class="bg-accent-cyan/15 absolute -bottom-20 left-1/3 h-72 w-72 rounded-full blur-[100px]"
      ></div>
    </div>

    <div class="relative space-y-8">
      <!-- 欢迎区域 -->
      <div class="text-center">
        <div
          class="border-primary-500/30 bg-primary-500/10 mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2"
        >
          <NIcon :component="SparklesOutline" class="text-primary-400" />
          <span class="text-primary-300 text-sm">AI 驱动的智能工具平台</span>
        </div>
        <h1 class="text-glow mb-4 text-5xl font-bold">
          欢迎使用
          <span class="text-gradient">AgentForge</span>
        </h1>
        <p class="mx-auto max-w-2xl text-lg text-gray-400">
          多功能 AI Agent 平台，支持代码审计、智能评分、RAG 知识检索等功能， 让 AI 成为你的得力助手
        </p>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-3 gap-4">
        <div v-for="stat in stats" :key="stat.label" class="glass p-4 text-center">
          <div class="text-2xl font-bold text-white">{{ stat.value }}</div>
          <div class="text-sm text-gray-400">{{ stat.label }}</div>
        </div>
      </div>

      <!-- Ask AI 入口 -->
      <div class="card-gradient">
        <div class="mb-4 flex items-center gap-3">
          <div
            class="from-primary-500 to-accent-purple flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br"
          >
            <span class="text-xl">💬</span>
          </div>
          <div>
            <h3 class="font-semibold text-white">Ask AI</h3>
            <p class="text-sm text-gray-400">输入你的问题，AI 将智能路由到对应功能</p>
          </div>
        </div>
        <div class="flex gap-3">
          <NInput
            v-model:value="askInput"
            placeholder="例如：帮我审计这段代码的安全性..."
            size="large"
            round
            class="flex-1"
          />
          <NButton type="primary" size="large" round class="btn-glow">
            <template #icon>
              <NIcon :component="SendOutline" />
            </template>
            发送
          </NButton>
        </div>
      </div>

      <!-- 功能卡片 -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <RouterLink
          v-for="feature in features"
          :key="feature.path"
          :to="feature.path"
          class="group card-gradient cursor-pointer transition-all duration-300 hover:-translate-y-2"
        >
          <!-- 图标 -->
          <div
            class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br text-2xl"
            :class="feature.gradient"
          >
            {{ feature.icon }}
          </div>
          <!-- 内容 -->
          <h3 class="group-hover:text-primary-400 mb-2 text-lg font-semibold text-white">
            {{ feature.title }}
          </h3>
          <p class="text-sm text-gray-400">
            {{ feature.desc }}
          </p>
          <!-- 箭头 -->
          <div
            class="text-primary-400 mt-4 flex items-center text-sm opacity-0 transition-opacity group-hover:opacity-100"
          >
            <span>开始使用</span>
            <span class="ml-1">→</span>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
