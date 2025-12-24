/**
 * 推荐示例 API 封装
 */
import { http } from './http';
import type { FeaturedTask, SetFeaturedParams, CheckFeaturedResponse } from '@/types';

/**
 * 获取推荐示例列表
 */
export async function getFeaturedList(): Promise<FeaturedTask[]> {
  const res = await http.get<FeaturedTask[]>('/featured/list');
  return res.data;
}

/**
 * 检查任务是否为推荐示例
 */
export async function checkFeatured(taskUuid: string): Promise<CheckFeaturedResponse> {
  const res = await http.get<CheckFeaturedResponse>(`/featured/check/${taskUuid}`);
  return res.data;
}

/**
 * 设置推荐示例（管理员）
 */
export async function setFeatured(params: SetFeaturedParams): Promise<FeaturedTask> {
  const res = await http.post<FeaturedTask>('/featured', params);
  return res.data;
}

/**
 * 取消推荐示例（管理员）
 */
export async function removeFeatured(taskUuid: string): Promise<void> {
  await http.delete(`/featured/${taskUuid}`);
}
