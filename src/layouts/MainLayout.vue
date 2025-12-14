<script setup lang="ts">
import { ref } from 'vue';
import { NLayout, NLayoutContent } from 'naive-ui';
import { LayoutSider, LayoutHeader } from './components';

// 侧边栏折叠状态
const collapsed = ref(false);
</script>

<template>
  <NLayout has-sider class="bg-dark-900 h-screen">
    <!-- 侧边栏 -->
    <LayoutSider v-model:collapsed="collapsed" />

    <!-- 右侧主体 -->
    <NLayout class="bg-dark-900">
      <!-- 顶部导航栏 -->
      <LayoutHeader />

      <!-- 内容区域 -->
      <NLayoutContent class="bg-grid overflow-auto p-6">
        <RouterView />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>
