<script setup lang="ts">
/**
 * 侧边栏组件
 * 结构：Logo + 新建任务 + 我的 Forge + 历史任务 + 底部导航
 */
import { ref, computed } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { NLayoutSider, NButton, NIcon, NInput, NScrollbar, NTooltip } from 'naive-ui';
import {
  AddOutline,
  SearchOutline,
  ExtensionPuzzleOutline,
  SettingsOutline,
  ChevronForwardOutline,
  TimeOutline,
} from '@vicons/ionicons5';
import { useThemeStore } from '@/stores';

// 接收折叠状态
const collapsed = defineModel<boolean>('collapsed', { default: false });

const route = useRoute();
const router = useRouter();
const themeStore = useThemeStore();

// 新建任务 - 跳转到首页
function handleNewTask() {
  router.push('/');
}

// 搜索关键词
const searchKeyword = ref('');

// 任务历史 Tab
const taskTab = ref<'all' | 'favorite'>('all');

// 模拟数据 - 我的 Forge 列表
const myForges = ref([
  { id: '1', name: '代码审计专家', icon: '🔍' },
  { id: '2', name: '智能评分助手', icon: '📊' },
  { id: '3', name: 'RAG 知识检索', icon: '📚' },
]);

// 模拟数据 - 历史任务
const taskHistory = ref({
  today: [
    { id: 't1', title: 'www.baidu.com 渗透测试', forgeId: '1' },
    { id: 't2', title: 'API 安全检查', forgeId: '1' },
  ],
  yesterday: [{ id: 't3', title: '代码审计报告生成', forgeId: '1' }],
  earlier: [{ id: 't4', title: '知识库文档检索', forgeId: '3' }],
});

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
</script>

<template>
  <NLayoutSider
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="260"
    :collapsed="collapsed"
    show-trigger
    :class="
      themeStore.isDark
        ? 'bg-dark-800/80 border-r border-white/5 backdrop-blur-xl'
        : 'border-r border-gray-200 bg-white'
    "
    @collapse="collapsed = true"
    @expand="collapsed = false"
  >
    <div class="flex h-full flex-col">
      <!-- Logo 区域 -->
      <RouterLink to="/" class="flex h-16 shrink-0 items-center justify-center">
        <div v-if="!collapsed" class="flex items-center gap-2">
          <div
            class="from-primary-500 to-accent-purple flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br"
            :class="themeStore.isDark ? 'logo-glow' : ''"
          >
            <span class="text-lg">🤖</span>
          </div>
          <span class="text-gradient text-lg font-bold">AgentForge</span>
        </div>
        <div
          v-else
          class="from-primary-500 to-accent-purple flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br"
          :class="themeStore.isDark ? 'logo-glow' : ''"
        >
          <span class="text-lg">🤖</span>
        </div>
      </RouterLink>

      <!-- 渐变分割线 -->
      <div :class="themeStore.isDark ? 'divider-gradient' : 'h-px bg-gray-200'"></div>

      <!-- 搜索框 + 新建任务 -->
      <div v-if="!collapsed" class="shrink-0 space-y-3 p-3">
        <!-- 搜索框 -->
        <NInput
          v-model:value="searchKeyword"
          placeholder="搜索..."
          size="small"
          round
          :class="themeStore.isDark ? 'glass' : ''"
        >
          <template #prefix>
            <NIcon :component="SearchOutline" />
          </template>
        </NInput>
        <!-- 新建任务按钮 -->
        <NButton
          type="primary"
          block
          :class="themeStore.isDark ? 'btn-glow' : 'btn-gradient'"
          @click="handleNewTask"
        >
          <template #icon>
            <NIcon :component="AddOutline" />
          </template>
          新建任务
        </NButton>
      </div>

      <!-- 折叠状态下的新建按钮 -->
      <div
        v-else
        class="flex shrink-0 justify-center border-b py-3"
        :class="themeStore.isDark ? 'border-white/5' : 'border-gray-200'"
      >
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

      <!-- 可滚动区域 -->
      <NScrollbar class="flex-1">
        <div class="p-3">
          <!-- 我的 Forge -->
          <div v-if="!collapsed" class="mb-4">
            <div class="mb-2 flex items-center justify-between">
              <span
                class="text-xs font-medium"
                :class="themeStore.isDark ? 'text-gray-400' : 'text-gray-500'"
              >
                我的 Forge
              </span>
              <RouterLink
                to="/forge/plaza"
                class="text-primary-500 hover:text-primary-600 flex items-center gap-1 text-xs"
              >
                Forge 广场
                <NIcon :component="ChevronForwardOutline" :size="12" />
              </RouterLink>
            </div>
            <!-- Forge 列表 - 玻璃态容器 -->
            <div :class="themeStore.isDark ? 'sider-section-glass space-y-1 p-2' : 'space-y-1'">
              <RouterLink
                v-for="forge in myForges"
                :key="forge.id"
                :to="`/forge/${forge.id}`"
                class="flex items-center gap-2 px-3 py-2 transition-all duration-200"
                :class="[
                  activeKey === `forge-${forge.id}`
                    ? themeStore.isDark
                      ? 'sider-item-active text-primary-400'
                      : 'bg-primary-500/10 text-primary-600 rounded-lg'
                    : themeStore.isDark
                      ? 'sider-item-hover text-gray-300'
                      : 'rounded-lg text-gray-700 hover:bg-gray-100',
                ]"
              >
                <span class="text-base">{{ forge.icon }}</span>
                <span class="truncate text-sm">{{ forge.name }}</span>
              </RouterLink>
            </div>
          </div>

          <!-- 折叠状态下的 Forge 图标 -->
          <div v-else class="mb-4 space-y-2">
            <NTooltip v-for="forge in myForges" :key="forge.id" placement="right">
              <template #trigger>
                <RouterLink
                  :to="`/forge/${forge.id}`"
                  class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
                  :class="[
                    activeKey === `forge-${forge.id}`
                      ? themeStore.isDark
                        ? 'bg-primary-500/20'
                        : 'bg-primary-500/10'
                      : themeStore.isDark
                        ? 'hover:bg-white/5'
                        : 'hover:bg-gray-100',
                  ]"
                >
                  <span class="text-lg">{{ forge.icon }}</span>
                </RouterLink>
              </template>
              {{ forge.name }}
            </NTooltip>
          </div>

          <!-- 渐变分割线 -->
          <div
            v-if="!collapsed"
            :class="themeStore.isDark ? 'divider-gradient my-3' : 'my-3 h-px bg-gray-200'"
          ></div>

          <!-- 历史任务 -->
          <div v-if="!collapsed" class="mb-4">
            <div class="mb-2 flex items-center justify-between">
              <div class="flex gap-3">
                <button
                  class="text-xs font-medium transition-colors"
                  :class="
                    taskTab === 'all'
                      ? 'text-primary-500'
                      : themeStore.isDark
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
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
                      : themeStore.isDark
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
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

            <!-- 任务列表 - 玻璃态容器 -->
            <div :class="themeStore.isDark ? 'sider-section-glass space-y-3 p-2' : 'space-y-3'">
              <!-- 今天 -->
              <div v-if="taskHistory.today.length">
                <div
                  class="mb-1 flex items-center gap-1 text-xs"
                  :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-400'"
                >
                  <NIcon :component="TimeOutline" :size="12" />
                  今天
                </div>
                <div class="space-y-1">
                  <RouterLink
                    v-for="task in taskHistory.today"
                    :key="task.id"
                    :to="`/task/${task.id}`"
                    class="block truncate px-3 py-2 text-sm transition-all duration-200"
                    :class="[
                      activeKey === `task-${task.id}`
                        ? themeStore.isDark
                          ? 'sider-item-active text-primary-400'
                          : 'bg-primary-500/10 text-primary-600 rounded-lg'
                        : themeStore.isDark
                          ? 'sider-item-hover text-gray-300'
                          : 'rounded-lg text-gray-700 hover:bg-gray-100',
                    ]"
                  >
                    {{ task.title }}
                  </RouterLink>
                </div>
              </div>

              <!-- 昨天 -->
              <div v-if="taskHistory.yesterday.length">
                <div
                  class="mb-1 flex items-center gap-1 text-xs"
                  :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-400'"
                >
                  <NIcon :component="TimeOutline" :size="12" />
                  昨天
                </div>
                <div class="space-y-1">
                  <RouterLink
                    v-for="task in taskHistory.yesterday"
                    :key="task.id"
                    :to="`/task/${task.id}`"
                    class="block truncate px-3 py-2 text-sm transition-all duration-200"
                    :class="[
                      activeKey === `task-${task.id}`
                        ? themeStore.isDark
                          ? 'sider-item-active text-primary-400'
                          : 'bg-primary-500/10 text-primary-600 rounded-lg'
                        : themeStore.isDark
                          ? 'sider-item-hover text-gray-300'
                          : 'rounded-lg text-gray-700 hover:bg-gray-100',
                    ]"
                  >
                    {{ task.title }}
                  </RouterLink>
                </div>
              </div>

              <!-- 更早 -->
              <div v-if="taskHistory.earlier.length">
                <div
                  class="mb-1 flex items-center gap-1 text-xs"
                  :class="themeStore.isDark ? 'text-gray-500' : 'text-gray-400'"
                >
                  <NIcon :component="TimeOutline" :size="12" />
                  更早
                </div>
                <div class="space-y-1">
                  <RouterLink
                    v-for="task in taskHistory.earlier"
                    :key="task.id"
                    :to="`/task/${task.id}`"
                    class="block truncate px-3 py-2 text-sm transition-all duration-200"
                    :class="[
                      activeKey === `task-${task.id}`
                        ? themeStore.isDark
                          ? 'sider-item-active text-primary-400'
                          : 'bg-primary-500/10 text-primary-600 rounded-lg'
                        : themeStore.isDark
                          ? 'sider-item-hover text-gray-300'
                          : 'rounded-lg text-gray-700 hover:bg-gray-100',
                    ]"
                  >
                    {{ task.title }}
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>

          <!-- 折叠状态下的任务图标 -->
          <div v-else class="space-y-2">
            <NTooltip placement="right">
              <template #trigger>
                <RouterLink
                  to="/task/list"
                  class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
                  :class="
                    themeStore.isDark
                      ? 'text-gray-400 hover:bg-white/5'
                      : 'text-gray-500 hover:bg-gray-100'
                  "
                >
                  <NIcon :component="TimeOutline" :size="20" />
                </RouterLink>
              </template>
              历史任务
            </NTooltip>
          </div>
        </div>
      </NScrollbar>

      <!-- 底部导航 - 渐变分割线 -->
      <div class="shrink-0">
        <div :class="themeStore.isDark ? 'divider-gradient' : 'h-px bg-gray-200'"></div>
        <div v-if="!collapsed" class="space-y-1 p-2">
          <RouterLink
            v-for="item in bottomNavItems"
            :key="item.key"
            :to="item.path"
            class="flex items-center gap-2 px-3 py-2 transition-all duration-200"
            :class="[
              activeKey === item.key
                ? themeStore.isDark
                  ? 'sider-item-active text-primary-400'
                  : 'bg-primary-500/10 text-primary-600 rounded-lg'
                : themeStore.isDark
                  ? 'nav-item-glow rounded-lg text-gray-400'
                  : 'rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900',
            ]"
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
                :class="[
                  activeKey === item.key
                    ? themeStore.isDark
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'bg-primary-500/10 text-primary-600'
                    : themeStore.isDark
                      ? 'nav-item-glow text-gray-400'
                      : 'text-gray-500 hover:bg-gray-100',
                ]"
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
