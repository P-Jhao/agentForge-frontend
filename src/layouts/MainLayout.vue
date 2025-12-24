<script setup lang="ts">
/**
 * 主布局组件
 * 使用 CSS 类自动适配深浅主题
 */
import { ref, computed, onMounted, provide } from 'vue';
import { useRoute } from 'vue-router';
import { NLayout, NLayoutContent, NIcon, NTooltip } from 'naive-ui';
import { ChevronDownOutline, ChevronUpOutline } from '@vicons/ionicons5';
import { LayoutSider, LayoutHeader } from './components';
import { useTaskSubscription } from '@/composable/task';
import OperationStageToast from '@/components/OperationStageToast.vue';

const route = useRoute();

// 侧边栏折叠状态
const collapsed = ref(false);

// 是否在任务详情页或回放页（都需要收起导航栏）
const isTaskPage = computed(() => {
  const path = route.path;
  return path.startsWith('/task/') && path !== '/task/list';
});

// Header 是否展开（任务页默认收起，点击按钮展开）
const headerExpanded = ref(false);

// 提供给子组件使用
provide('headerExpanded', headerExpanded);
provide('isTaskPage', isTaskPage);

// 计算 header 高度
const headerHeight = computed(() => {
  if (!isTaskPage.value) return 64; // 非任务页始终显示
  return headerExpanded.value ? 64 : 0; // 任务页根据状态
});

// 内容区域高度
const contentHeight = computed(() => {
  return `calc(100vh - ${headerHeight.value}px)`;
});

// 切换展开/收起
function toggleExpand() {
  headerExpanded.value = !headerExpanded.value;
}

// 初始化任务状态订阅（全局 SSE 连接）
const { connect: connectTaskSubscription } = useTaskSubscription();

onMounted(() => {
  // 建立 SSE 连接，接收任务状态实时推送
  connectTaskSubscription();
});
</script>

<template>
  <NLayout has-sider class="overflow-hidden" style="height: 100vh; max-height: 100vh">
    <!-- 全局操作阶段提示 -->
    <OperationStageToast />

    <!-- 侧边栏 -->
    <LayoutSider v-model:collapsed="collapsed" />

    <!-- 右侧主体 -->
    <NLayout class="relative">
      <!-- 顶部导航栏 -->
      <div
        class="transition-all duration-300 ease-in-out"
        :class="{ 'overflow-hidden': isTaskPage }"
        :style="{ height: `${headerHeight}px` }"
      >
        <LayoutHeader />
      </div>

      <!-- 任务页展开/收起按钮（始终可见） -->
      <NTooltip v-if="isTaskPage" :delay="500" placement="bottom">
        <template #trigger>
          <button
            class="absolute left-1/2 z-50 flex h-5 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white transition-all duration-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
            :style="{ top: headerExpanded ? '60px' : '0px' }"
            @click="toggleExpand"
          >
            <NIcon
              :component="headerExpanded ? ChevronUpOutline : ChevronDownOutline"
              :size="14"
              class="text-gray-500"
            />
          </button>
        </template>
        {{ headerExpanded ? '收起' : '展开' }}
      </NTooltip>

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
