<script setup lang="ts">
/**
 * 主布局组件
 * 使用 CSS 类自动适配深浅主题
 */
import { ref, onMounted } from 'vue';
import { NLayout, NLayoutContent } from 'naive-ui';
import { LayoutSider, LayoutHeader } from './components';
import { useTaskSubscription } from '@/composable/task';

// 侧边栏折叠状态
const collapsed = ref(false);

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
        <div class="main-content-bg h-full overflow-y-auto p-6">
          <RouterView />
        </div>
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>
