/**
 * 用户状态管理
 */
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

// 用户信息类型
export interface UserInfo {
  id: number;
  username: string;
  avatar?: string;
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('token'));
  const userInfo = ref<UserInfo | null>(null);

  // 计算属性
  const isLoggedIn = computed(() => !!token.value);

  // 登录
  function login(newToken: string, user: UserInfo) {
    token.value = newToken;
    userInfo.value = user;
    localStorage.setItem('token', newToken);
  }

  // 退出登录
  function logout() {
    token.value = null;
    userInfo.value = null;
    localStorage.removeItem('token');
  }

  // 设置用户信息
  function setUserInfo(user: UserInfo) {
    userInfo.value = user;
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    logout,
    setUserInfo,
  };
});
