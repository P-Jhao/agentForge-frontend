<script setup lang="ts">
/**
 * 后台管理布局组件
 * 包含顶部导航栏和左侧边栏
 */
import { NLayout, NLayoutContent } from 'naive-ui';
import { LayoutHeader } from './components';
import AdminSidebar from './components/AdminSidebar.vue';
</script>

<template>
  <NLayout has-sider class="overflow-hidden" style="height: 100vh; max-height: 100vh">
    <!-- 左侧边栏 -->
    <AdminSidebar />

    <!-- 右侧主体 -->
    <NLayout class="relative">
      <!-- 顶部导航栏（复用现有 Header） -->
      <div class="h-16">
        <LayoutHeader />
      </div>

      <!-- 内容区域 -->
      <NLayoutContent
        :native-scrollbar="false"
        class="flex flex-col"
        content-class="flex-1"
        content-style="height: calc(100vh - 64px); overflow: hidden;"
      >
        <div class="main-content-bg flex h-full flex-col overflow-hidden p-6">
          <RouterView />
        </div>
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>
