/**
 * 路由配置
 */
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { mainRoutes, authRoutes, errorRoutes } from './modules';

// 合并所有路由模块
const routes: RouteRecordRaw[] = [mainRoutes, ...authRoutes, ...errorRoutes];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫 - 设置页面标题
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || 'AgentForge'} - AgentForge`;
  next();
});

export default router;
