<script setup lang="ts">
/**
 * Forge 广场页面
 * 浏览所有 Forge + 创建新 Forge
 */
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NIcon, NTabs, NTabPane, NSpin, NEmpty } from 'naive-ui';
import { AddOutline } from '@vicons/ionicons5';
import { useForgeStore, useThemeStore } from '@/stores';
import type { ForgeFilter } from '@/types';
import ForgeCard from './components/ForgeCard.vue';

const router = useRouter();
const forgeStore = useForgeStore();
const themeStore = useThemeStore();

// 当前标签
const currentTab = ref<ForgeFilter>('all');

// Forge 列表
const forgeList = computed(() => forgeStore.forgeList);

// 加载状态
const loading = computed(() => forgeStore.loading);

// 切换标签（前端筛选，不发请求）
const handleTabChange = (tab: ForgeFilter) => {
  currentTab.value = tab;
  forgeStore.setFilter(tab);
};

// 点击卡片跳转到详情页
const handleCardClick = (forgeId: number) => {
  router.push(`/forge/${forgeId}`);
};

// 收藏/取消收藏
const handleFavorite = async (forgeId: number, favorite: boolean) => {
  try {
    await forgeStore.toggleFavorite(forgeId, favorite);
  } catch (error) {
    console.error('收藏操作失败:', error);
  }
};

// 跳转到创建页面
const handleCreate = () => {
  router.push('/forge/create');
};

// 初始化
onMounted(async () => {
  forgeStore.setFilter(currentTab.value);
  await forgeStore.fetchAllForges();
});
</script>

<template>
  <div class="forge-plaza h-full overflow-auto p-6">
    <!-- 头部 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-theme text-2xl font-bold">Forge 广场</h1>
        <p class="text-theme-secondary mt-1">浏览或创建你的专属 Forge</p>
      </div>
      <NButton
        type="primary"
        :class="themeStore.isDark ? 'btn-glow' : 'btn-gradient'"
        @click="handleCreate"
      >
        <template #icon>
          <NIcon :component="AddOutline" />
        </template>
        新建 Forge
      </NButton>
    </div>

    <!-- 标签切换 -->
    <NTabs type="line" :value="currentTab" @update:value="handleTabChange">
      <NTabPane name="all" tab="全部" />
      <NTabPane name="my" tab="我的" />
      <NTabPane name="builtin" tab="内置" />
      <NTabPane name="other" tab="其他" />
    </NTabs>

    <!-- 内容区域 -->
    <div class="mt-4">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex h-64 items-center justify-center">
        <NSpin size="large" />
      </div>

      <!-- 空状态 -->
      <NEmpty v-else-if="forgeList.length === 0" description="暂无 Forge" class="py-16" />

      <!-- Forge 列表 -->
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ForgeCard
          v-for="forge in forgeList"
          :key="forge.id"
          :forge="forge"
          @click="handleCardClick(forge.id)"
          @favorite="handleFavorite(forge.id, $event)"
        />
      </div>
    </div>
  </div>
</template>
