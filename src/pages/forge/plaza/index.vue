<script setup lang="ts">
/**
 * Forge 广场页面
 * 浏览所有 Forge + 创建新 Forge + 搜索筛选
 */
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NIcon, NTabs, NTabPane, NSpin, NEmpty, NInput } from 'naive-ui';
import { AddOutline, SearchOutline } from '@vicons/ionicons5';
import { useForgeStore } from '@/stores';
import type { ForgeFilter } from '@/types';
import ForgeCard from './components/ForgeCard.vue';

const router = useRouter();
const forgeStore = useForgeStore();

// 当前标签
const currentTab = ref<ForgeFilter>('all');

// 搜索关键词
const searchKeyword = ref('');

// 原始 Forge 列表（来自 store）
const rawForgeList = computed(() => forgeStore.forgeList);

// 搜索筛选后的 Forge 列表
const forgeList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return rawForgeList.value;
  }
  return rawForgeList.value.filter((forge) => {
    const name = forge.displayName?.toLowerCase() || '';
    const desc = forge.description?.toLowerCase() || '';
    return name.includes(keyword) || desc.includes(keyword);
  });
});

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

/**
 * 编程方式设置搜索内容（供自动操作使用）
 * @param keyword 搜索关键词
 */
const setSearchKeyword = (keyword: string) => {
  searchKeyword.value = keyword;
};

/**
 * 获取搜索输入框元素（供自动操作使用）
 */
const getSearchInputElement = () => {
  return document.querySelector('.forge-search-input input');
};

// 暴露方法给父组件或全局使用
defineExpose({
  setSearchKeyword,
  getSearchInputElement,
  searchKeyword,
});

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
        class="btn-theme forge-create-btn"
        data-forge-create-btn
        @click="handleCreate"
      >
        <template #icon>
          <NIcon :component="AddOutline" />
        </template>
        新建 Forge
      </NButton>
    </div>

    <!-- 搜索框 + 标签切换 -->
    <div class="mb-4 flex items-center gap-4">
      <!-- 搜索框 -->
      <NInput
        v-model:value="searchKeyword"
        placeholder="搜索 Forge..."
        clearable
        class="forge-search-input w-64"
        data-auto-search-input
      >
        <template #prefix>
          <NIcon :component="SearchOutline" />
        </template>
      </NInput>

      <!-- 标签切换 -->
      <NTabs type="line" :value="currentTab" class="flex-1" @update:value="handleTabChange">
        <NTabPane name="all" tab="全部" />
        <NTabPane name="my" tab="我的" />
        <NTabPane name="builtin" tab="内置" />
        <NTabPane name="other" tab="其他" />
      </NTabs>
    </div>

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
          :data-forge-id="forge.id"
          @click="handleCardClick(forge.id)"
          @favorite="handleFavorite(forge.id, $event)"
        />
      </div>
    </div>
  </div>
</template>
