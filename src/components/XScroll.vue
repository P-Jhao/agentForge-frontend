<script setup lang="ts">
import { reactive, computed, ref, onMounted, nextTick } from 'vue';

/**
 * 横向滚动组件
 * 通过旋转技巧将垂直滚轮事件转换为横向滚动
 * 使用 v-intersect-ob 指令实现无限循环滚动
 */

const props = withDefaults(
  defineProps<{
    height: number | string; // 容器高度，必传
    gap?: number | string; // 子元素间距，默认 16px
    loop?: boolean; // 是否无限循环，默认 false
  }>(),
  {
    gap: 16,
    loop: false,
  }
);

const emit = defineEmits<{
  (e: 'itemClick', event: MouseEvent): void;
}>();

// 计算高度值
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

const vScrollRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

let halfWidth = 0; // 单份内容宽度

// 尺寸变化回调
function handleChange(size: { width: number; height: number }) {
  s.w = size.width;
  s.h = size.height;
  if (props.loop) {
    nextTick(updateHalfWidth);
  }
}

// 计算单份内容宽度
function updateHalfWidth() {
  if (!contentRef.value) return;
  halfWidth = contentRef.value.scrollWidth / 2;
}

// 交叉观察配置
const intersectOptions = computed(() => ({
  handler: handleIntersect,
  root: vScrollRef.value,
}));

// 哨兵进入视口时的处理
function handleIntersect(entry: IntersectionObserverEntry) {
  if (!entry.isIntersecting || !vScrollRef.value || halfWidth === 0) return;

  const scrollEl = vScrollRef.value;
  const isEndSentinel = entry.target.classList.contains('sentinel-end');

  if (isEndSentinel) {
    // 到达末尾，跳到开头
    scrollEl.scrollTop = scrollEl.scrollTop - halfWidth;
  } else {
    // 到达开头，跳到末尾
    scrollEl.scrollTop = scrollEl.scrollTop + halfWidth;
  }
}

onMounted(() => {
  if (props.loop) {
    nextTick(updateHalfWidth);
  }
});

// 处理内容区点击，向上 emit
function handleContentClick(e: MouseEvent) {
  emit('itemClick', e);
}
</script>

<template>
  <div
    v-size-ob="handleChange"
    class="scroll-container"
    :style="{ height: heightStyle, width: '100%', overflow: 'hidden' }"
  >
    <div ref="vScrollRef" class="v-scroll">
      <div
        ref="contentRef"
        class="content"
        :style="{ gap: gapStyle, paddingTop: '8px' }"
        @click="handleContentClick"
      >
        <!-- 开头哨兵 -->
        <div
          v-if="loop && vScrollRef"
          v-intersect-ob="intersectOptions"
          class="sentinel sentinel-start"
        ></div>
        <slot></slot>
        <!-- 循环模式：复制一份内容 -->
        <template v-if="loop">
          <slot></slot>
        </template>
        <!-- 末尾哨兵 -->
        <div
          v-if="loop && vScrollRef"
          v-intersect-ob="intersectOptions"
          class="sentinel sentinel-end"
        ></div>
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

.sentinel {
  width: 1px;
  height: 100%;
  flex-shrink: 0;
}
</style>
