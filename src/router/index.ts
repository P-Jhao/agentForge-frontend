/**
 * 路由配置
 */
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/pages/home/index.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'code-audit',
        name: 'CodeAudit',
        component: () => import('@/pages/code-audit/index.vue'),
        meta: { title: '代码审计' },
      },
      {
        path: 'scoring',
        name: 'Scoring',
        component: () => import('@/pages/scoring/index.vue'),
        meta: { title: '智能评分' },
      },
      {
        path: 'rag-search',
        name: 'RagSearch',
        component: () => import('@/pages/rag-search/index.vue'),
        meta: { title: 'RAG 检索' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/pages/settings/index.vue'),
        meta: { title: '系统设置' },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/login/index.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/not-found/index.vue'),
    meta: { title: '页面不存在' },
  },
];

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
