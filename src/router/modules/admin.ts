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
  ],
};

export default adminRoutes;
