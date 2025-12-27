/**
 * 后台管理 API
 */
import { http } from './http';

// 任务列表项
export interface AdminTaskItem {
  id: number;
  uuid: string;
  title: string;
  status: 'running' | 'completed' | 'cancelled' | 'waiting';
  creator: {
    id: number;
    username: string;
    nickname: string;
  };
  totalTokens: number;
  createdAt: string;
  updatedAt: string;
}

// 任务列表响应
export interface AdminTaskListResponse {
  tasks: AdminTaskItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

// 任务列表请求参数
export interface AdminTaskListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  startTime?: string;
  endTime?: string;
  sortBy?: 'tokens';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 获取所有任务列表（管理员）
 */
export async function getAdminTaskList(params: AdminTaskListParams = {}) {
  const res = await http.get<AdminTaskListResponse>('/admin/task/list', { params });
  return res.data;
}

/**
 * 删除任务（管理员）
 */
export async function deleteAdminTask(uuid: string) {
  await http.delete(`/admin/task/${uuid}`);
}
