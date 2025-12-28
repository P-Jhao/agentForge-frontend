<script setup lang="ts">
/**
 * 后台管理布局组件
 * 包含顶部导航栏和左侧边栏
 */
import { NLayoutContent } from 'naive-ui';
import { LayoutHeader } from './components';
import AdminSidebar from './components/AdminSidebar.vue';
</script>

<template>
  <div class="flex h-screen">
    <!-- 左侧边栏 -->
    <AdminSidebar />

    <!-- 右侧主体 -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- 顶部导航栏 -->
      <div class="h-16 shrink-0">
        <LayoutHeader />
      </div>

      <!-- 内容区域 -->
      <div class="main-content-bg flex-1 overflow-auto p-6">
        <RouterView />
      </div>
    </div>
  </div>
</template>
