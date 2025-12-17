/**
 * Forge API 封装
 */
import { http } from './http';
import type {
  Forge,
  ForgeDetail,
  ForgeFilter,
  FavoriteForge,
  CreateForgeParams,
  UpdateForgeParams,
  CreateTaskFromForgeResult,
} from '@/types';

/**
 * 获取 Forge 列表
 * @param filter 筛选类型：all 全部 / my 我的 / builtin 内置
 */
export async function getForgeList(filter: ForgeFilter = 'all'): Promise<Forge[]> {
  const res = await http.get<Forge[]>('/forge/list', { filter });
  return res.data;
}

/**
 * 获取用户收藏的 Forge 列表（侧边栏用）
 */
export async function getFavoriteForges(): Promise<FavoriteForge[]> {
  const res = await http.get<FavoriteForge[]>('/forge/favorites');
  return res.data;
}

/**
 * 获取 Forge 详情
 */
export async function getForgeById(id: number): Promise<ForgeDetail> {
  const res = await http.get<ForgeDetail>(`/forge/${id}`);
  return res.data;
}

/**
 * 创建 Forge
 */
export async function createForge(params: CreateForgeParams): Promise<{ id: number }> {
  const res = await http.post<{ id: number }>('/forge', params);
  return res.data;
}

/**
 * 更新 Forge
 */
export async function updateForge(
  id: number,
  params: UpdateForgeParams
): Promise<{ success: boolean }> {
  const res = await http.put<{ success: boolean }>(`/forge/${id}`, params);
  return res.data;
}

/**
 * 删除 Forge
 */
export async function deleteForge(id: number): Promise<{ success: boolean }> {
  const res = await http.delete<{ success: boolean }>(`/forge/${id}`);
  return res.data;
}

/**
 * 收藏/取消收藏 Forge
 */
export async function toggleFavorite(
  id: number,
  favorite: boolean
): Promise<{ success: boolean; favorite: boolean }> {
  const res = await http.post<{ success: boolean; favorite: boolean }>(`/forge/${id}/favorite`, {
    favorite,
  });
  return res.data;
}

/**
 * 从 Forge 创建任务
 * @param id Forge ID
 * @param message 用户的第一条消息
 */
export async function createTaskFromForge(
  id: number,
  message: string
): Promise<CreateTaskFromForgeResult> {
  const res = await http.post<CreateTaskFromForgeResult>(`/forge/${id}/task`, { message });
  return res.data;
}
