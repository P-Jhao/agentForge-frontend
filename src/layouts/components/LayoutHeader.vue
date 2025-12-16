<script setup lang="ts">
import { h, watch, type Component } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  NLayoutHeader,
  NButton,
  NSpace,
  NAvatar,
  NDropdown,
  NIcon,
  NBadge,
  NTooltip,
} from 'naive-ui';
import {
  PersonOutline,
  LogOutOutline,
  NotificationsOutline,
  SunnyOutline,
  MoonOutline,
} from '@vicons/ionicons5';
import { useThemeStore, useUserStore, useTaskStore } from '@/stores';

const router = useRouter();
const route = useRoute();
const themeStore = useThemeStore();
const userStore = useUserStore();
const taskStore = useTaskStore();

// 监听路由变化，离开任务页面时清除当前任务
watch(
  () => route.path,
  (newPath) => {
    if (!newPath.startsWith('/task/') || newPath === '/task/list') {
      taskStore.clearCurrentTask();
    }
  }
);

// 渲染图标的辅助函数
function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

// 用户下拉菜单
const userOptions = [
  {
    label: '个人中心',
    key: 'profile',
    icon: renderIcon(PersonOutline),
  },
  {
    type: 'divider',
    key: 'd1',
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: renderIcon(LogOutOutline),
  },
];

// 处理用户菜单点击
function handleUserSelect(key: string) {
  if (key === 'logout') {
    userStore.logout();
    router.push('/login');
  } else if (key === 'profile') {
    router.push('/profile');
  }
}

// 跳转登录页
function goLogin() {
  router.push('/login');
}
</script>

<template>
  <NLayoutHeader
    class="flex h-16 items-center justify-between border-b px-6"
    :class="
      themeStore.isDark
        ? 'bg-dark-800/80 border-white/5 backdrop-blur-xl'
        : 'border-gray-200 bg-white'
    "
  >
    <!-- 左侧标题 -->
    <div class="flex items-center gap-3">
      <span class="text-lg font-medium" :class="themeStore.isDark ? 'text-white' : 'text-gray-900'">
        {{ taskStore.hasCurrentTask ? taskStore.currentTaskName : 'AgentForge' }}
      </span>
      <span
        v-if="!taskStore.hasCurrentTask"
        class="bg-primary-500/20 text-primary-500 rounded-full px-2 py-0.5 text-xs"
      >
        Beta
      </span>
    </div>

    <!-- 右侧操作区 -->
    <NSpace align="center" :size="16">
      <!-- 主题切换 -->
      <NTooltip>
        <template #trigger>
          <NButton quaternary circle @click="themeStore.toggleTheme">
            <template #icon>
              <NIcon :component="themeStore.isDark ? SunnyOutline : MoonOutline" :size="20" />
            </template>
          </NButton>
        </template>
        {{ themeStore.isDark ? '切换到浅色模式' : '切换到深色模式' }}
      </NTooltip>

      <!-- 通知 -->
      <NBadge :value="3" :max="9">
        <NButton quaternary circle>
          <template #icon>
            <NIcon :component="NotificationsOutline" :size="20" />
          </template>
        </NButton>
      </NBadge>

      <!-- 用户（已登录） -->
      <NDropdown v-if="userStore.isLoggedIn" :options="userOptions" @select="handleUserSelect">
        <div
          class="flex cursor-pointer items-center gap-2 rounded-full border py-1 pr-3 pl-1 transition-colors"
          :class="
            themeStore.isDark
              ? 'border-white/10 bg-white/5 hover:bg-white/10'
              : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
          "
        >
          <NAvatar round size="small" class="from-primary-500 to-accent-purple bg-linear-to-br">
            {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
          </NAvatar>
          <span class="text-sm" :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'">
            {{ userStore.userInfo?.username || '用户' }}
          </span>
        </div>
      </NDropdown>

      <!-- 未登录 -->
      <div
        v-else
        class="flex cursor-pointer items-center gap-2 rounded-full border py-1 pr-3 pl-1 transition-colors"
        :class="
          themeStore.isDark
            ? 'border-white/10 bg-white/5 hover:bg-white/10'
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
        "
        @click="goLogin"
      >
        <NAvatar round size="small" class="bg-gray-400">?</NAvatar>
        <span class="text-sm" :class="themeStore.isDark ? 'text-gray-300' : 'text-gray-700'">
          未登录
        </span>
      </div>
    </NSpace>
  </NLayoutHeader>
</template>
