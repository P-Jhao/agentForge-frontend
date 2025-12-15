/**
 * HTTP 请求封装
 * 基于 axios，统一处理请求/响应拦截、错误处理、token 认证
 */
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import router from '@/router';

// API 响应结构
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

// 获取 API 基础路径
const getBaseURL = (): string => {
  return import.meta.env.VITE_API_BASE || '/api';
};

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 60 * 1000, // 60秒超时
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    // 从 localStorage 获取 token
    const token = localStorage.getItem('forgeToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message } = response.data;

    // 业务成功
    if (code === 200) {
      return response.data as unknown as AxiosResponse;
    }

    // 业务失败，显示错误信息
    console.error(`[API Error] ${message}`);
    return Promise.reject(response.data);
  },
  (error) => {
    // 请求被取消
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // 401 未授权，跳转登录
    if (error.response?.status === 401) {
      localStorage.removeItem('forgeToken');
      router.push('/login');
      return Promise.reject(error);
    }

    // 其他错误
    const message = error.response?.data?.message || error.message || '请求失败';
    console.error(`[HTTP Error] ${message}`);
    return Promise.reject(error);
  }
);

// 封装请求方法，支持泛型定义响应数据类型
export const http = {
  get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return service.get(url, { params, ...config });
  },

  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return service.post(url, data, config);
  },

  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return service.put(url, data, config);
  },

  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.delete(url, config);
  },

  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return service.patch(url, data, config);
  },
};

export default http;
