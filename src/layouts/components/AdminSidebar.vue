<script setup lang="ts">
/**
 * 后台管理侧边栏组件
 */
import { computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { NLayoutSider, NIcon } from 'naive-ui';
import { GridOutline, ListOutline } from '@vicons/ionicons5';

const route = useRoute();

// 菜单项
const menuItems = [
  { key: 'dashboard', label: '控制台', icon: GridOutline, path: '/admin' },
  { key: 'tasks', label: '任务管理', icon: ListOutline, path: '/admin/tasks' },
];

// 当前选中的菜单
const activeKey = computed(() => {
  const path = route.path;
  if (path === '/admin') return 'dashboard';
  if (path === '/admin/tasks') return 'tasks';
  return '';
});

// 判断是否选中
function isActive(key: string) {
  return activeKey.value === key;
}
</script>

<template>
  <NLayoutSider bordered :width="220" class="sider-bg">
    <div class="flex h-full flex-col">
      <!-- Logo 区域 -->
      <RouterLink to="/admin" class="flex h-16 shrink-0 items-center px-4">
        <div class="flex items-center gap-2">
          <img
            src="@/assets/imgs/favicon660x660nobackground.png"
            alt="AgentForge Logo"
            class="h-8"
          />
          <span class="text-gradient text-base font-bold">后台管理</span>
        </div>
      </RouterLink>

      <!-- 渐变分割线 -->
      <div class="divider-gradient"></div>

      <!-- 菜单列表 -->
      <div class="flex-1 space-y-1 p-3">
        <RouterLink
          v-for="item in menuItems"
          :key="item.key"
          :to="item.path"
          class="flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200"
          :class="
            isActive(item.key)
              ? 'sider-item-active sider-item-active-text'
              : 'sider-item-hover sider-item-text'
          "
        >
          <NIcon :component="item.icon" :size="20" />
          <span class="text-sm font-medium">{{ item.label }}</span>
        </RouterLink>
      </div>
    </div>
  </NLayoutSider>
</template>
