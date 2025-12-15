/**
 * 主布局路由模块
 */
import type { RouteRecordRaw } from 'vue-router';

const mainRoutes: RouteRecordRaw = {
  path: '/',
  component: () => import('@/layouts/MainLayout.vue'),
  children: [
    // 首页
    {
      path: '',
      name: 'Home',
      component: () => import('@/pages/home/index.vue'),
      meta: { title: '首页' },
    },
    // Forge 广场
    {
      path: 'forge-plaza',
      name: 'ForgePlaza',
      component: () => import('@/pages/forge-plaza/index.vue'),
      meta: { title: 'Forge 广场' },
    },
    // Forge 详情
    {
      path: 'forge/:id',
      name: 'ForgeDetail',
      component: () => import('@/pages/forge-detail/index.vue'),
      meta: { title: 'Forge 详情' },
    },
    // 任务详情
    {
      path: 'task/:id',
      name: 'TaskDetail',
      component: () => import('@/pages/task-detail/index.vue'),
      meta: { title: '任务详情' },
    },
    // MCP 管理
    {
      path: 'mcp',
      name: 'McpManage',
      component: () => import('@/pages/mcp/index.vue'),
      meta: { title: 'MCP 管理' },
    },
    // 任务管理
    {
      path: 'tasks',
      name: 'TaskManage',
      component: () => import('@/pages/tasks/index.vue'),
      meta: { title: '任务管理' },
    },
    // 设置
    {
      path: 'settings',
      name: 'Settings',
      component: () => import('@/pages/settings/index.vue'),
      meta: { title: '设置' },
    },
  ],
};

export default mainRoutes;
