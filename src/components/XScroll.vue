<script setup lang="ts">
import { reactive, computed } from 'vue';

/**
 * 横向滚动组件
 * 通过旋转技巧将垂直滚轮事件转换为横向滚动
 */

const props = withDefaults(
  defineProps<{
    height: number | string; // 容器高度，必传
    gap?: number | string; // 子元素间距，默认 16px
  }>(),
  {
    gap: 16,
  }
);

// 计算高度值（支持数字或带单位的字符串）
const heightStyle = computed(() => {
  return typeof props.height === 'number' ? `${props.height}px` : props.height;
});

// 计算间距值
const gapStyle = computed(() => {
  return typeof props.gap === 'number' ? `${props.gap}px` : props.gap;
});

const s = reactive({
  w: 0,
  h: 0,
});

// 尺寸变化回调
function handleChange(size: { width: number; height: number }) {
  s.w = size.width;
  s.h = size.height;
}
</script>

<template>
  <div
    v-size-ob="handleChange"
    class="scroll-container"
    :style="{ height: heightStyle, width: '100%', overflow: 'hidden' }"
  >
    <div class="v-scroll">
      <div class="content" :style="{ gap: gapStyle }">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.v-scroll {
  width: calc(v-bind('s.h') * 1px);
  height: calc(v-bind('s.w') * 1px);
  position: relative;
  overflow: auto;
  transform-origin: 0 0;
  transform: translateY(calc(v-bind('s.h') * 1px)) rotate(-90deg);
}

.v-scroll::-webkit-scrollbar {
  width: 0;
}

.content {
  display: flex;
  flex-wrap: nowrap;
  height: calc(v-bind('s.h') * 1px);
  position: absolute;
  left: 100%;
  transform-origin: 0 0;
  transform: rotate(90deg);
}
</style>
