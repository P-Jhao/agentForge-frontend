/**
 * 路由配置
 */
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { mainRoutes, authRoutes, errorRoutes } from './modules';

// 扩展路由 meta 类型
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
  }
}

// 合并所有路由模块
const routes: RouteRecordRaw[] = [mainRoutes, ...authRoutes, ...errorRoutes];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || 'AgentForge'} - AgentForge`;

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('forgeToken');
    if (!token) {
      // 未登录，跳转到登录页，并记录原目标路径
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      });
      return;
    }
  }

  next();
});

export default router;
