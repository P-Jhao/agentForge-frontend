/**
 * 主布局路由模块
 */
import type { RouteRecordRaw } from 'vue-router';

const mainRoutes: RouteRecordRaw = {
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
};

export default mainRoutes;
