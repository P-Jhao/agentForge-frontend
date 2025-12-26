<script setup lang="ts">
/**
 * 文字淡化组件
 * 用于文字溢出时显示右侧淡化效果
 */
defineProps<{
  // 最大行数，默认 2 行
  lines?: number;
}>();
</script>

<template>
  <div class="text-fade relative overflow-hidden">
    <p
      class="text-fade-content"
      :class="[lines === 1 ? 'line-clamp-1' : lines === 3 ? 'line-clamp-3' : 'line-clamp-2']"
    >
      <slot></slot>
    </p>
    <!-- 右侧水平淡化遮罩 -->
    <div class="text-fade-mask pointer-events-none absolute top-0 right-0 bottom-0 w-10"></div>
  </div>
</template>

<style scoped>
/* 无需额外样式，使用全局 text-fade-mask 工具类 */
</style>
