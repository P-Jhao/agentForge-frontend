<script setup lang="ts">
/**
 * Forge 详情页面
 * Forge 介绍 + 发送任务 + MCP 能力展示
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// 使用 computed 响应路由参数变化
const forgeId = computed(() => route.params.id as string);
</script>

<template>
  <div class="forge-detail">
    <h1 class="text-2xl font-bold">Forge 详情</h1>
    <p class="text-gray-500">Forge ID: {{ forgeId }}</p>
  </div>
</template>
