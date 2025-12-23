<script setup lang="ts">
/**
 * 主布局组件
 * 使用 CSS 类自动适配深浅主题
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { NLayout, NLayoutContent } from 'naive-ui';
import { LayoutSider, LayoutHeader } from './components';
import { useTaskSubscription } from '@/composable/task';

const route = useRoute();

// 侧边栏折叠状态
const collapsed = ref(false);

// 是否在任务详情页
const isTaskPage = computed(() => {
  const path = route.path;
  return path.startsWith('/task/') && path !== '/task/list';
});

// Header 是否展开（任务页默认收起，鼠标悬停展开）
const headerExpanded = ref(false);

// 计算 header 高度
const headerHeight = computed(() => {
  if (!isTaskPage.value) return 64; // 非任务页始终显示
  return headerExpanded.value ? 64 : 0; // 任务页根据状态
});

// 内容区域高度
const contentHeight = computed(() => {
  return `calc(100vh - ${headerHeight.value}px)`;
});

// 处理鼠标离开视口时收起 header
function handleMouseLeaveDocument(e: MouseEvent) {
  // 当鼠标离开文档（移出视口）时，收起 header
  if (
    isTaskPage.value &&
    (e.clientY <= 0 ||
      e.clientX <= 0 ||
      e.clientX >= window.innerWidth ||
      e.clientY >= window.innerHeight)
  ) {
    headerExpanded.value = false;
  }
}

// 初始化任务状态订阅（全局 SSE 连接）
const { connect: connectTaskSubscription } = useTaskSubscription();

onMounted(() => {
  // 建立 SSE 连接，接收任务状态实时推送
  connectTaskSubscription();
  // 监听鼠标离开文档事件
  document.addEventListener('mouseleave', handleMouseLeaveDocument);
});

onUnmounted(() => {
  document.removeEventListener('mouseleave', handleMouseLeaveDocument);
});
</script>

<template>
  <NLayout has-sider class="h-screen">
    <!-- 侧边栏 -->
    <LayoutSider v-model:collapsed="collapsed" />

    <!-- 右侧主体 -->
    <NLayout>
      <!-- 顶部触发区域（任务页时用于触发 header 展开） -->
      <div
        v-if="isTaskPage"
        class="absolute top-0 right-0 left-0 z-50 h-4"
        @mouseenter="headerExpanded = true"
      ></div>

      <!-- 顶部导航栏 -->
      <div
        class="transition-all duration-300 ease-in-out"
        :class="{ 'overflow-hidden': isTaskPage }"
        :style="{ height: `${headerHeight}px` }"
        @mouseenter="headerExpanded = true"
        @mouseleave="isTaskPage && (headerExpanded = false)"
      >
        <LayoutHeader />
      </div>

      <!-- 内容区域 -->
      <NLayoutContent
        :native-scrollbar="false"
        class="flex flex-col transition-all duration-300 ease-in-out"
        content-class="flex-1"
        :content-style="`height: ${contentHeight}; overflow: hidden; transition: height 0.3s ease-in-out;`"
      >
        <div class="main-content-bg h-full overflow-y-auto p-6">
          <RouterView />
        </div>
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>
