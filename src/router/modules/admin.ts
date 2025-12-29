/**
 * 后台管理路由模块
 * 仅 operator 角色可访问
 */
import type { RouteRecordRaw } from 'vue-router';

const adminRoutes: RouteRecordRaw = {
  path: '/admin',
  component: () => import('@/layouts/AdminLayout.vue'),
  meta: { requiresAuth: true, requiresOperator: true },
  children: [
    // 控制台（默认页面）
    {
      path: '',
      name: 'AdminDashboard',
      component: () => import('@/pages/admin/dashboard/index.vue'),
      meta: { title: '控制台', requiresAuth: true, requiresOperator: true },
    },
    // 任务管理
    {
      path: 'tasks',
      name: 'AdminTasks',
      component: () => import('@/pages/admin/tasks/index.vue'),
      meta: { title: '任务管理', requiresAuth: true, requiresOperator: true },
    },
    // 反馈管理
    {
      path: 'feedback',
      name: 'AdminFeedback',
      component: () => import('@/pages/admin/feedback/index.vue'),
      meta: { title: '反馈管理', requiresAuth: true, requiresOperator: true },
    },
    // Forge 管理
    {
      path: 'forge',
      name: 'AdminForge',
      component: () => import('@/pages/admin/forge/index.vue'),
      meta: { title: 'Forge 管理', requiresAuth: true, requiresOperator: true },
    },
    // 推荐示例管理
    {
      path: 'featured',
      name: 'AdminFeatured',
      component: () => import('@/pages/admin/featured/index.vue'),
      meta: { title: '推荐示例', requiresAuth: true, requiresOperator: true },
    },
    // 成员管理
    {
      path: 'members',
      name: 'AdminMembers',
      component: () => import('@/pages/admin/members/index.vue'),
      meta: { title: '成员管理', requiresAuth: true, requiresOperator: true },
    },
    // MCP 管理
    {
      path: 'mcp',
      name: 'AdminMcp',
      component: () => import('@/pages/admin/mcp/index.vue'),
      meta: { title: 'MCP 管理', requiresAuth: true, requiresOperator: true },
    },
  ],
};

export default adminRoutes;
