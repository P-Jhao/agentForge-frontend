/**
 * 主布局路由模块
 * requiresAuth: true 表示需要登录才能访问
 */
import type { RouteRecordRaw } from 'vue-router';

const mainRoutes: RouteRecordRaw = {
  path: '/',
  component: () => import('@/layouts/MainLayout.vue'),
  children: [
    // 首页（不需要登录）
    {
      path: '',
      name: 'Home',
      component: () => import('@/pages/home/index.vue'),
      meta: { title: '首页' },
    },
    // Forge 模块
    {
      path: 'forge/plaza',
      name: 'ForgePlaza',
      component: () => import('@/pages/forge/plaza/index.vue'),
      meta: { title: 'Forge 广场' },
    },
    {
      path: 'forge/create',
      name: 'ForgeCreate',
      component: () => import('@/pages/forge/create/index.vue'),
      meta: { title: '创建 Forge', requiresAuth: true },
    },
    {
      path: 'forge/:id/edit',
      name: 'ForgeEdit',
      component: () => import('@/pages/forge/[id]/edit.vue'),
      meta: { title: '编辑 Forge', requiresAuth: true },
    },
    {
      path: 'forge/:id',
      name: 'ForgeDetail',
      component: () => import('@/pages/forge/[id]/index.vue'),
      meta: { title: 'Forge 详情', requiresAuth: true },
    },
    // 任务模块（需要登录）
    {
      path: 'task/list',
      name: 'TaskList',
      component: () => import('@/pages/task/list/index.vue'),
      meta: { title: '任务列表', requiresAuth: true },
    },
    {
      path: 'task/:id',
      name: 'TaskDetail',
      component: () => import('@/pages/task/[id]/index.vue'),
      meta: { title: '任务详情', requiresAuth: true },
    },
    {
      path: 'task/:id/replay',
      name: 'TaskReplay',
      component: () => import('@/pages/task/[id]/replay.vue'),
      meta: { title: '任务回放', requiresAuth: true },
    },
    // MCP 管理（需要登录）
    {
      path: 'mcp',
      name: 'McpManage',
      component: () => import('@/pages/mcp/index.vue'),
      meta: { title: 'MCP 管理', requiresAuth: true },
    },
    {
      path: 'mcp/create',
      name: 'McpCreate',
      component: () => import('@/pages/mcp/create/index.vue'),
      meta: { title: '新建 MCP', requiresAuth: true },
    },
    {
      path: 'mcp/:id/edit',
      name: 'McpEdit',
      component: () => import('@/pages/mcp/[id]/edit.vue'),
      meta: { title: '编辑 MCP', requiresAuth: true },
    },
    {
      path: 'mcp/:id',
      name: 'McpDetail',
      component: () => import('@/pages/mcp/[id]/index.vue'),
      meta: { title: 'MCP 详情', requiresAuth: true },
    },

    // 设置（需要登录）
    {
      path: 'settings',
      name: 'Settings',
      component: () => import('@/pages/settings/index.vue'),
      meta: { title: '设置', requiresAuth: true },
    },
    // 个人中心（需要登录）
    {
      path: 'profile',
      name: 'Profile',
      component: () => import('@/pages/profile/index.vue'),
      meta: { title: '个人中心', requiresAuth: true },
    },
  ],
};

export default mainRoutes;
