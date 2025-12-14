<script setup lang="ts">
import { NConfigProvider, NMessageProvider } from 'naive-ui';
import MainLayout from './layouts/MainLayout.vue';
</script>

<template>
  <NConfigProvider>
    <NMessageProvider>
      <MainLayout>
        <!-- 首页内容 -->
        <div class="space-y-6">
          <!-- 欢迎卡片 -->
          <div class="from-primary-500 to-primary-600 rounded-xl bg-gradient-to-r p-8 text-white">
            <h1 class="mb-2 text-3xl font-bold">欢迎使用 AgentForge 🚀</h1>
            <p class="text-primary-100">
              多功能 AI Agent 平台，支持代码审计、智能评分、RAG 知识检索等功能
            </p>
          </div>

          <!-- 功能卡片网格 -->
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <!-- 代码审计 -->
            <div
              class="cursor-pointer rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div class="mb-4 text-4xl">🔍</div>
              <h3 class="mb-2 text-lg font-semibold">代码审计</h3>
              <p class="text-gray-500">智能分析代码安全漏洞，提供修复建议</p>
            </div>

            <!-- 智能评分 -->
            <div
              class="cursor-pointer rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div class="mb-4 text-4xl">📊</div>
              <h3 class="mb-2 text-lg font-semibold">智能评分</h3>
              <p class="text-gray-500">根据样本案例自动评分，判断是否符合要求</p>
            </div>

            <!-- RAG 检索 -->
            <div
              class="cursor-pointer rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div class="mb-4 text-4xl">📚</div>
              <h3 class="mb-2 text-lg font-semibold">RAG 检索</h3>
              <p class="text-gray-500">上传文档构建知识库，智能语义检索</p>
            </div>
          </div>

          <!-- Ask AI 入口 -->
          <div class="rounded-xl bg-white p-6 shadow-sm">
            <h3 class="mb-4 text-lg font-semibold">💬 Ask AI</h3>
            <div class="flex gap-4">
              <input
                type="text"
                placeholder="输入你的问题，例如：帮我对 xxx 进行代码审计..."
                class="focus:border-primary-500 flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none"
              />
              <button
                class="bg-primary-500 hover:bg-primary-600 rounded-lg px-6 py-3 text-white transition-colors"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    </NMessageProvider>
  </NConfigProvider>
</template>
