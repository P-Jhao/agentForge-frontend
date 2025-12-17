/**
 * 用户状态管理
 */
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/utils';

// 用户角色类型
export type UserRole = 'user' | 'root';

// 用户信息类型
export interface UserInfo {
  id: number;
  username: string;
  apiQuota?: number;
  role?: UserRole; // 用户角色：user 普通用户 / root 超级管理员
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('forgeToken'));
  const userInfo = ref<UserInfo | null>(null);
  const loading = ref(false);

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value);
  const isAdmin = computed(() => userInfo.value?.role === 'root');

  // 初始化：检查 token 并获取用户信息
  async function init() {
    if (!token.value) return;

    loading.value = true;
    try {
      const res = await http.get<UserInfo>('/user/info');
      userInfo.value = res.data;
    } catch {
      // token 无效，清除
      logout();
    } finally {
      loading.value = false;
    }
  }

  // 登录
  async function login(username: string, password: string) {
    const res = await http.post<{ token: string; user: UserInfo }>('/user/login', {
      username,
      password,
    });
    token.value = res.data.token;
    userInfo.value = res.data.user;
    localStorage.setItem('forgeToken', res.data.token);
  }

  // 退出登录
  function logout() {
    token.value = null;
    userInfo.value = null;
    localStorage.removeItem('forgeToken');
  }

  return {
    token,
    userInfo,
    loading,
    isLoggedIn,
    isAdmin,
    init,
    login,
    logout,
  };
});
