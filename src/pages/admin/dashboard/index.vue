<script setup lang="ts">
/**
 * 后台管理 - 控制台页面
 * 占位页面，后期实现数据统计
 */
import { NIcon } from 'naive-ui';
import { GridOutline } from '@vicons/ionicons5';
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center">
    <div class="text-center">
      <NIcon :component="GridOutline" :size="64" class="text-theme-muted mb-4" />
      <h1 class="text-theme text-2xl font-bold">控制台</h1>
      <p class="text-theme-secondary mt-2">数据统计功能开发中...</p>
    </div>
  </div>
</template>
