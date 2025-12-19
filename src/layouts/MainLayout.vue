<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NLayout, NLayoutContent } from 'naive-ui';
import { LayoutSider, LayoutHeader } from './components';
import { useThemeStore } from '@/stores';
import { useTaskSubscription } from '@/composable/task';

// 侧边栏折叠状态
const collapsed = ref(false);
const themeStore = useThemeStore();

// 初始化任务状态订阅（全局 SSE 连接）
const { connect: connectTaskSubscription } = useTaskSubscription();

onMounted(() => {
  // 建立 SSE 连接，接收任务状态实时推送
  connectTaskSubscription();
});
</script>

<template>
  <NLayout has-sider class="h-screen">
    <!-- 侧边栏 -->
    <LayoutSider v-model:collapsed="collapsed" />

    <!-- 右侧主体 -->
    <NLayout>
      <!-- 顶部导航栏 -->
      <LayoutHeader />

      <!-- 内容区域 -->
      <NLayoutContent
        :native-scrollbar="false"
        class="flex flex-col"
        content-class="flex-1"
        content-style="height: calc(100vh - 64px); overflow: hidden;"
      >
        <div
          class="h-full overflow-y-auto px-6 pb-6"
          :class="themeStore.isDark ? 'bg-dark-900 bg-grid' : 'bg-light-100 bg-grid-light'"
        >
          <RouterView />
        </div>
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>
