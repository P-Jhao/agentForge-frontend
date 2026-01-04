/**
 * 用户状态管理
 */
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { http, encryptApiKey } from '@/utils';

// 用户角色类型
export type UserRole = 'user' | 'premium' | 'root' | 'operator';

// 用户信息类型
export interface UserInfo {
  id: number;
  username: string; // 账号
  nickname?: string; // 名称
  avatar?: string | null;
  email?: string | null;
  apiQuota?: number;
  role?: UserRole; // 用户角色：user 普通用户 / premium 高级用户 / root 超级管理员 / operator 平台运营员
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('forgeToken'));
  const userInfo = ref<UserInfo | null>(null);
  const loading = ref(false);

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value);
  const isAdmin = computed(() => userInfo.value?.role === 'root');
  const isOperator = computed(() => userInfo.value?.role === 'operator');
  const role = computed(() => userInfo.value?.role || 'user');

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

  // 登录（密码 RSA 加密传输）
  async function login(username: string, password: string) {
    // RSA 加密密码
    const encryptedPassword = await encryptApiKey(password);

    const res = await http.post<{ token: string; user: UserInfo }>('/user/login', {
      username,
      encryptedPassword,
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

  // 刷新用户信息
  async function refreshUserInfo() {
    if (!token.value) return;
    try {
      const res = await http.get<UserInfo>('/user/info');
      userInfo.value = res.data;
    } catch {
      // 忽略错误
    }
  }

  // 更新本地用户信息（不请求后端）
  function updateLocalUserInfo(data: Partial<UserInfo>) {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...data };
    }
  }

  return {
    token,
    userInfo,
    loading,
    isLoggedIn,
    isAdmin,
    isOperator,
    role,
    init,
    login,
    logout,
    refreshUserInfo,
    updateLocalUserInfo,
  };
});
