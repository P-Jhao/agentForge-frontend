/**
 * 错误页面路由模块
 */
import type { RouteRecordRaw } from 'vue-router';

const errorRoutes: RouteRecordRaw[] = [
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/not-found/index.vue'),
    meta: { title: '页面不存在' },
  },
];

export default errorRoutes;
