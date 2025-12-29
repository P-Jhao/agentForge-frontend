<script setup lang="ts">
/**
 * 侧边栏组件
 * 结构：Logo + 新建任务 + 我的 Forge（可展开/收起） + 历史任务（可滚动） + 底部导航
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { NLayoutSider, NButton, NIcon, NInput, NScrollbar, NTooltip } from 'naive-ui';
import {
  AddOutline,
  SearchOutline,
  ExtensionPuzzleOutline,
  SettingsOutline,
  ChevronForwardOutline,
  ChevronDownOutline,
  ChevronUpOutline,
  TimeOutline,
  StarOutline,
  Star,
  CogOutline,
} from '@vicons/ionicons5';
import { useTaskStore, useForgeStore } from '@/stores';
import TaskActionMenu from '@/components/TaskActionMenu.vue';
import type { Task } from '@/types';

// 接收折叠状态
const collapsed = defineModel<boolean>('collapsed', { default: false });

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const forgeStore = useForgeStore();

// 判断是否在首页
const isHomePage = computed(() => route.path === '/' || route.path === '/home');

// Logo 文字样式类 - 始终使用动画类，首页时暂停动画
const logoTextClass = computed(() => [
  'text-gradient-animated',
  'text-lg',
  'font-bold',
  { 'animation-paused': isHomePage.value },
]);

// 新建任务 - 跳转到首页
function handleNewTask() {
  router.push('/');
}

// 搜索关键词
const searchKeyword = ref('');

// 任务历史 Tab
const taskTab = ref<'all' | 'favorite'>('all');

// Forge 展开状态
const forgeExpanded = ref(false);

// 收藏的 Forge 列表（从 ForgeStore 获取）
const favoriteForges = computed(() => forgeStore.favoriteForges);

// 显示的 Forge 数量限制
const FORGE_COLLAPSED_COUNT = 3;

// 是否需要显示「更多/收起」按钮
const showForgeToggle = computed(() => favoriteForges.value.length > FORGE_COLLAPSED_COUNT);

// 当前显示的 Forge 列表
const displayedForges = computed(() => {
  if (!showForgeToggle.value || forgeExpanded.value) {
    // 不需要折叠或已展开：显示全部
    return favoriteForges.value;
  }
  // 收起状态：只显示前 3 个
  return favoriteForges.value.slice(0, FORGE_COLLAPSED_COUNT);
});

// 切换 Forge 展开/收起
function toggleForgeExpand() {
  forgeExpanded.value = !forgeExpanded.value;
}

// 根据 Tab 显示的任务列表
const displayedTasks = computed(() => {
  if (taskTab.value === 'favorite') {
    const favorites = taskStore.favoriteTasks;
    return groupTasksByTime(favorites);
  }
  return taskStore.groupedTasks;
});

// 将任务列表按时间分组
function groupTasksByTime(tasks: Task[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const result = {
    today: [] as Task[],
    yesterday: [] as Task[],
    earlier: [] as Task[],
  };

  for (const task of tasks) {
    const taskDate = new Date(task.updatedAt);
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

    if (taskDay.getTime() >= today.getTime()) {
      result.today.push(task);
    } else if (taskDay.getTime() >= yesterday.getTime()) {
      result.yesterday.push(task);
    } else {
      result.earlier.push(task);
    }
  }

  return result;
}

// 当前选中的菜单
const activeKey = computed(() => {
  const path = route.path;
  if (path === '/') return 'home';
  if (path === '/forge/plaza') return 'forge-plaza';
  if (path.startsWith('/forge/')) return `forge-${route.params.id}`;
  if (path === '/task/list') return 'task-list';
  if (path.startsWith('/task/')) return `task-${route.params.id}`;
  return path.slice(1);
});

// 底部导航项
const bottomNavItems = [
  { key: 'mcp', label: 'MCP 管理', icon: ExtensionPuzzleOutline, path: '/mcp' },
  { key: 'settings', label: '设置', icon: SettingsOutline, path: '/settings' },
];

// 判断是否选中
function isActive(key: string) {
  return activeKey.value === key;
}

// 点击任务时设置当前任务
function handleTaskClick(task: Task) {
  taskStore.setCurrentTask(task.uuid);
}

// 切换任务收藏状态
async function handleToggleFavorite(event: Event, task: Task) {
  event.preventDefault();
  event.stopPropagation();
  await taskStore.toggleFavorite(task.uuid);
}

// 格式化更新时间（显示日期）
function formatUpdateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 格式化完整时间（用于 tooltip）
function formatFullTime(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 获取任务状态文本
function getStatusText(status: string): string {
  switch (status) {
    case 'running':
      return '任务进行中';
    case 'completed':
      return '任务已完成';
    case 'cancelled':
      return '任务已取消';
    case 'waiting':
      return '等待回复';
    default:
      return status;
  }
}

// 组件挂载时获取任务列表和收藏的 Forge 列表
onMounted(async () => {
  try {
    await Promise.all([taskStore.fetchTasks(), forgeStore.fetchFavoriteForges()]);
  } catch (error) {
    console.error('获取数据失败:', error);
  }
});

// 监听搜索关键词变化（防抖搜索）
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchKeyword, (keyword) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    try {
      await taskStore.fetchTasks(keyword ? { keyword } : undefined);
    } catch (error) {
      console.error('搜索任务失败:', error);
    }
  }, 300);
});
</script>

<template>
  <NLayoutSider
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="260"
    :collapsed="collapsed"
    show-trigger
    class="sider-bg"
    @collapse="collapsed = true"
    @expand="collapsed = false"
  >
    <div class="flex h-full flex-col">
      <!-- Logo 区域 -->
      <RouterLink to="/" class="flex h-16 shrink-0 items-center px-3">
        <div v-if="!collapsed" class="flex items-center gap-2">
          <img src="@/assets/imgs/logo.png" alt="AgentForge Logo" class="h-10" />
          <span :class="logoTextClass">AgentForge</span>
        </div>
        <img
          v-else
          src="@/assets/imgs/favicon660x660nobackground.png"
          alt="AgentForge Logo"
          class="h-10"
        />
      </RouterLink>

      <!-- 渐变分割线 -->
      <div class="divider-gradient"></div>

      <!-- 搜索框 + 新建任务 -->
      <div v-if="!collapsed" class="shrink-0 space-y-3 p-3">
        <NInput v-model:value="searchKeyword" placeholder="搜索任务..." size="small" round>
          <template #prefix>
            <NIcon :component="SearchOutline" />
          </template>
        </NInput>
        <NButton type="primary" block class="btn-theme" @click="handleNewTask">
          <template #icon>
            <NIcon :component="AddOutline" />
          </template>
          新建任务
        </NButton>
      </div>

      <!-- 折叠状态下的新建按钮 -->
      <div v-else class="border-theme flex shrink-0 justify-center border-b py-3">
        <NTooltip placement="right">
          <template #trigger>
            <NButton type="primary" circle @click="handleNewTask">
              <template #icon>
                <NIcon :component="AddOutline" />
              </template>
            </NButton>
          </template>
          新建任务
        </NTooltip>
      </div>

      <!-- 主内容区域（Forge + 任务列表） -->
      <div v-if="!collapsed" class="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
        <!-- 我的 Forge 区域 -->
        <div :class="forgeExpanded ? 'flex max-h-[60%] min-h-[280px] flex-col' : 'shrink-0'">
          <div class="mb-2 flex shrink-0 items-center justify-between">
            <span class="text-theme-secondary text-xs font-medium">我收藏的 Forge</span>
            <RouterLink
              to="/forge/plaza"
              class="text-primary-500 hover:text-primary-600 flex items-center gap-1 text-xs"
            >
              Forge 广场
              <NIcon :component="ChevronForwardOutline" :size="12" />
            </RouterLink>
          </div>
          <!-- Forge 列表 -->
          <div class="sider-section-glass flex min-h-0 flex-1 flex-col p-2">
            <!-- 空状态 -->
            <div
              v-if="!displayedForges.length"
              class="text-theme-muted flex flex-col items-center justify-center gap-2 py-4"
            >
              <NIcon :component="StarOutline" :size="24" />
              <span class="text-xs">暂无收藏</span>
            </div>
            <!-- 有数据时显示列表 -->
            <template v-else>
              <NScrollbar v-if="forgeExpanded" class="min-h-0 flex-1">
                <div class="space-y-1">
                  <RouterLink
                    v-for="forge in displayedForges"
                    :key="forge.id"
                    :to="`/forge/${forge.id}`"
                    class="flex items-center gap-2 px-3 py-2 transition-all duration-200"
                    :class="
                      isActive(`forge-${forge.id}`)
                        ? 'sider-item-active sider-item-active-text'
                        : 'sider-item-hover sider-item-text'
                    "
                  >
                    <img
                      v-if="forge.avatar"
                      :src="forge.avatar"
                      :alt="forge.displayName"
                      class="h-6 w-6 rounded object-cover"
                    />
                    <NIcon v-else :component="CogOutline" :size="16" class="text-theme-muted" />
                    <span class="truncate text-sm">{{ forge.displayName }}</span>
                  </RouterLink>
                </div>
              </NScrollbar>
              <div v-else class="space-y-1">
                <RouterLink
                  v-for="forge in displayedForges"
                  :key="forge.id"
                  :to="`/forge/${forge.id}`"
                  class="flex items-center gap-2 px-3 py-2 transition-all duration-200"
                  :class="
                    isActive(`forge-${forge.id}`)
                      ? 'sider-item-active sider-item-active-text'
                      : 'sider-item-hover sider-item-text'
                  "
                >
                  <img
                    v-if="forge.avatar"
                    :src="forge.avatar"
                    :alt="forge.displayName"
                    class="h-6 w-6 rounded object-cover"
                  />
                  <NIcon v-else :component="CogOutline" :size="16" class="text-theme-muted" />
                  <span class="truncate text-sm">{{ forge.displayName }}</span>
                </RouterLink>
              </div>
              <!-- 更多/收起 按钮 -->
              <button
                v-if="showForgeToggle"
                class="text-primary-500 hover:text-primary-600 mt-1 flex w-full shrink-0 items-center gap-1 px-3 py-2 text-xs"
                @click="toggleForgeExpand"
              >
                <NIcon
                  :component="forgeExpanded ? ChevronUpOutline : ChevronDownOutline"
                  :size="14"
                />
                {{ forgeExpanded ? '收起' : '更多' }}
              </button>
            </template>
          </div>
        </div>

        <!-- 渐变分割线 -->
        <div class="divider-gradient my-3 shrink-0"></div>

        <!-- 历史任务区域（可滚动） -->
        <div class="flex min-h-0 flex-1 flex-col">
          <div class="mb-2 flex shrink-0 items-center justify-between">
            <div class="flex gap-3">
              <button
                class="text-xs font-medium transition-colors"
                :class="
                  taskTab === 'all' ? 'text-primary-500' : 'text-theme-secondary hover:text-theme'
                "
                @click="taskTab = 'all'"
              >
                所有任务
              </button>
              <button
                class="text-xs font-medium transition-colors"
                :class="
                  taskTab === 'favorite'
                    ? 'text-primary-500'
                    : 'text-theme-secondary hover:text-theme'
                "
                @click="taskTab = 'favorite'"
              >
                收藏
              </button>
            </div>
            <RouterLink
              to="/task/list"
              class="text-primary-500 hover:text-primary-600 flex items-center gap-1 text-xs"
            >
              任务管理
              <NIcon :component="ChevronForwardOutline" :size="12" />
            </RouterLink>
          </div>

          <!-- 任务列表（可滚动） -->
          <NScrollbar class="min-h-0 flex-1">
            <div class="sider-section-glass space-y-3 p-2">
              <!-- 加载状态 -->
              <div v-if="taskStore.loading" class="text-theme-muted py-4 text-center text-xs">
                加载中...
              </div>

              <!-- 空状态 -->
              <div
                v-else-if="
                  !displayedTasks.today.length &&
                    !displayedTasks.yesterday.length &&
                    !displayedTasks.earlier.length
                "
                class="text-theme-muted py-4 text-center text-xs"
              >
                {{ taskTab === 'favorite' ? '暂无收藏任务' : '暂无任务' }}
              </div>

              <template v-else>
                <!-- 今天 -->
                <div v-if="displayedTasks.today.length">
                  <div class="text-theme-muted mb-1 flex items-center gap-1 text-xs">
                    <NIcon :component="TimeOutline" :size="12" />
                    今天
                  </div>
                  <div class="space-y-1">
                    <RouterLink
                      v-for="task in displayedTasks.today"
                      :key="task.uuid"
                      :to="`/task/${task.uuid}`"
                      class="task-item group relative block rounded-lg px-3 py-2 transition-all duration-200"
                      :class="
                        isActive(`task-${task.uuid}`)
                          ? 'sider-item-active sider-item-active-text'
                          : 'sider-item-hover sider-item-text'
                      "
                      @click="handleTaskClick(task)"
                    >
                      <!-- 收藏星标（右上角） -->
                      <button
                        class="absolute top-1 right-1 cursor-pointer p-1"
                        @click="handleToggleFavorite($event, task)"
                      >
                        <NIcon
                          :component="task.favorite ? Star : StarOutline"
                          :size="14"
                          :class="
                            task.favorite
                              ? 'text-yellow-500'
                              : 'text-theme-muted hover:text-yellow-500'
                          "
                        />
                      </button>
                      <NTooltip :delay="500">
                        <template #trigger>
                          <div class="truncate pr-5 text-sm">{{ task.title }}</div>
                        </template>
                        {{ task.title }}
                      </NTooltip>
                      <div class="mt-1 flex h-6 items-center text-xs opacity-60">
                        <span>{{ getStatusText(task.status) }}</span>
                        <span class="ml-auto flex items-center">
                          <NTooltip>
                            <template #trigger>
                              <span>{{ formatUpdateTime(task.updatedAt) }}</span>
                            </template>
                            {{ formatFullTime(task.updatedAt) }}
                          </NTooltip>
                          <!-- 操作菜单（hover 时显示） -->
                          <span class="ml-1 hidden group-hover:inline-flex">
                            <TaskActionMenu :task="task" />
                          </span>
                        </span>
                      </div>
                    </RouterLink>
                  </div>
                </div>

                <!-- 昨天 -->
                <div v-if="displayedTasks.yesterday.length">
                  <div class="text-theme-muted mb-1 flex items-center gap-1 text-xs">
                    <NIcon :component="TimeOutline" :size="12" />
                    昨天
                  </div>
                  <div class="space-y-1">
                    <RouterLink
                      v-for="task in displayedTasks.yesterday"
                      :key="task.uuid"
                      :to="`/task/${task.uuid}`"
                      class="task-item group relative block rounded-lg px-3 py-2 transition-all duration-200"
                      :class="
                        isActive(`task-${task.uuid}`)
                          ? 'sider-item-active sider-item-active-text'
                          : 'sider-item-hover sider-item-text'
                      "
                      @click="handleTaskClick(task)"
                    >
                      <!-- 收藏星标（右上角） -->
                      <button
                        class="absolute top-1 right-1 cursor-pointer p-1"
                        @click="handleToggleFavorite($event, task)"
                      >
                        <NIcon
                          :component="task.favorite ? Star : StarOutline"
                          :size="14"
                          :class="
                            task.favorite
                              ? 'text-yellow-500'
                              : 'text-theme-muted hover:text-yellow-500'
                          "
                        />
                      </button>
                      <NTooltip :delay="500">
                        <template #trigger>
                          <div class="truncate pr-5 text-sm">{{ task.title }}</div>
                        </template>
                        {{ task.title }}
                      </NTooltip>
                      <div class="mt-1 flex h-6 items-center text-xs opacity-60">
                        <span>{{ getStatusText(task.status) }}</span>
                        <span class="ml-auto flex items-center">
                          <NTooltip>
                            <template #trigger>
                              <span>{{ formatUpdateTime(task.updatedAt) }}</span>
                            </template>
                            {{ formatFullTime(task.updatedAt) }}
                          </NTooltip>
                          <!-- 操作菜单（hover 时显示） -->
                          <span class="ml-1 hidden group-hover:inline-flex">
                            <TaskActionMenu :task="task" />
                          </span>
                        </span>
                      </div>
                    </RouterLink>
                  </div>
                </div>

                <!-- 更早 -->
                <div v-if="displayedTasks.earlier.length">
                  <div class="text-theme-muted mb-1 flex items-center gap-1 text-xs">
                    <NIcon :component="TimeOutline" :size="12" />
                    更早
                  </div>
                  <div class="space-y-1">
                    <RouterLink
                      v-for="task in displayedTasks.earlier"
                      :key="task.uuid"
                      :to="`/task/${task.uuid}`"
                      class="task-item group relative block rounded-lg px-3 py-2 transition-all duration-200"
                      :class="
                        isActive(`task-${task.uuid}`)
                          ? 'sider-item-active sider-item-active-text'
                          : 'sider-item-hover sider-item-text'
                      "
                      @click="handleTaskClick(task)"
                    >
                      <!-- 收藏星标（右上角） -->
                      <button
                        class="absolute top-1 right-1 cursor-pointer p-1"
                        @click="handleToggleFavorite($event, task)"
                      >
                        <NIcon
                          :component="task.favorite ? Star : StarOutline"
                          :size="14"
                          :class="
                            task.favorite
                              ? 'text-yellow-500'
                              : 'text-theme-muted hover:text-yellow-500'
                          "
                        />
                      </button>
                      <NTooltip :delay="500">
                        <template #trigger>
                          <div class="truncate pr-5 text-sm">{{ task.title }}</div>
                        </template>
                        {{ task.title }}
                      </NTooltip>
                      <div class="mt-1 flex h-6 items-center text-xs opacity-60">
                        <span>{{ getStatusText(task.status) }}</span>
                        <span class="ml-auto flex items-center">
                          <NTooltip>
                            <template #trigger>
                              <span>{{ formatUpdateTime(task.updatedAt) }}</span>
                            </template>
                            {{ formatFullTime(task.updatedAt) }}
                          </NTooltip>
                          <!-- 操作菜单（hover 时显示） -->
                          <span class="ml-1 hidden group-hover:inline-flex">
                            <TaskActionMenu :task="task" />
                          </span>
                        </span>
                      </div>
                    </RouterLink>
                  </div>
                </div>
              </template>
            </div>
          </NScrollbar>
        </div>
      </div>

      <!-- 折叠状态下的图标 -->
      <div v-else class="flex-1 space-y-2 p-3">
        <!-- Forge 图标 -->
        <NTooltip v-for="forge in displayedForges" :key="forge.id" placement="right">
          <template #trigger>
            <RouterLink
              :to="`/forge/${forge.id}`"
              class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
              :class="
                isActive(`forge-${forge.id}`)
                  ? 'bg-primary-500/10 dark:bg-primary-500/20'
                  : 'hover:bg-gray-100 dark:hover:bg-white/5'
              "
            >
              <span class="text-lg">{{ forge.avatar || '🤖' }}</span>
            </RouterLink>
          </template>
          {{ forge.displayName }}
        </NTooltip>

        <!-- 任务图标 -->
        <NTooltip placement="right">
          <template #trigger>
            <RouterLink
              to="/task/list"
              class="text-theme-secondary flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
            >
              <NIcon :component="TimeOutline" :size="20" />
            </RouterLink>
          </template>
          历史任务
        </NTooltip>
      </div>

      <!-- 底部导航 -->
      <div class="shrink-0">
        <div class="divider-gradient"></div>
        <div v-if="!collapsed" class="space-y-1 p-2">
          <RouterLink
            v-for="item in bottomNavItems"
            :key="item.key"
            :to="item.path"
            class="flex items-center gap-2 px-3 py-2 transition-all duration-200"
            :class="
              isActive(item.key)
                ? 'sider-item-active sider-item-active-text'
                : 'nav-item-glow sider-item-text rounded-lg'
            "
          >
            <NIcon :component="item.icon" :size="18" />
            <span class="text-sm">{{ item.label }}</span>
          </RouterLink>
        </div>
        <div v-else class="flex flex-col items-center gap-2 p-2">
          <NTooltip v-for="item in bottomNavItems" :key="item.key" placement="right">
            <template #trigger>
              <RouterLink
                :to="item.path"
                class="flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200"
                :class="
                  isActive(item.key)
                    ? 'bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400'
                    : 'nav-item-glow text-theme-secondary'
                "
              >
                <NIcon :component="item.icon" :size="20" />
              </RouterLink>
            </template>
            {{ item.label }}
          </NTooltip>
        </div>
      </div>
    </div>
  </NLayoutSider>
</template>
