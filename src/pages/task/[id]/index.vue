<script setup lang="ts">
/**
 * 任务详情页面
 * 任务执行过程 + 结果 + 反馈
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// 使用 computed 响应路由参数变化
const taskId = computed(() => route.params.id as string);
</script>

<template>
  <div class="task-detail">
    <h1 class="text-2xl font-bold">任务详情</h1>
    <p class="text-gray-500">任务 ID: {{ taskId }}</p>
  </div>
</template>
