/**
 * 路由配置
 */
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { mainRoutes, authRoutes, errorRoutes, adminRoutes } from './modules';
import { useUserStore } from '@/stores/modules/user';

// 扩展路由 meta 类型
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
    requiresOperator?: boolean; // 需要运营员权限
  }
}

// 合并所有路由模块
const routes: RouteRecordRaw[] = [mainRoutes, adminRoutes, ...authRoutes, ...errorRoutes];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || 'AgentForge'} - AgentForge`;

  const token = localStorage.getItem('forgeToken');

  // 检查是否是分享链接访问（带有 shareSign 参数）
  const isShareAccess = !!to.query.shareSign;

  // 检查是否需要登录
  if (to.meta.requiresAuth || to.meta.requiresOperator) {
    // 分享链接访问任务详情或回放页面时，跳过登录验证
    if (isShareAccess && (to.name === 'TaskDetail' || to.name === 'TaskReplay')) {
      next();
      return;
    }

    if (!token) {
      // 未登录，跳转到登录页，并记录原目标路径
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      });
      return;
    }
  }

  // 如果已登录，获取用户信息进行角色检查
  if (token) {
    const userStore = useUserStore();

    // 确保用户信息已加载
    if (!userStore.userInfo) {
      await userStore.init();
    }

    const role = userStore.role;

    // operator 角色限制：只能访问 /admin、/task/:id、/forge/:id 和 /mcp/:id
    if (role === 'operator') {
      const isAdminRoute = to.path.startsWith('/admin');
      const isTaskDetailRoute = to.path.match(/^\/task\/[^/]+$/);
      const isForgeDetailRoute = to.path.match(/^\/forge\/\d+$/);
      const isMcpDetailRoute = to.path.match(/^\/mcp\/\d+$/);

      if (!isAdminRoute && !isTaskDetailRoute && !isForgeDetailRoute && !isMcpDetailRoute) {
        next('/admin');
        return;
      }
    }

    // 非 operator 不能访问 /admin 路由
    if (to.path.startsWith('/admin') && role !== 'operator') {
      next('/');
      return;
    }
  }

  next();
});

export default router;
