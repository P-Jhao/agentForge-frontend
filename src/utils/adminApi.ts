/**
 * 后台管理 API
 */
import { http } from './http';

// 任务列表项
export interface AdminTaskItem {
  id: number;
  uuid: string;
  title: string;
  status: 'running' | 'completed' | 'cancelled' | 'waiting' | 'deleted';
  creator: {
    id: number;
    username: string;
    nickname: string;
  };
  // 关联的 Forge 信息
  agent: {
    id: number;
    displayName: string;
    avatar: string | null;
  } | null;
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
  const res = await http.get<AdminTaskListResponse>(
    '/admin/task/list',
    params as Record<string, unknown>
  );
  return res.data;
}

/**
 * 删除任务（管理员）
 */
export async function deleteAdminTask(uuid: string) {
  await http.delete(`/admin/task/${uuid}`);
}

// 反馈列表项
export interface AdminFeedbackItem {
  id: number;
  task: {
    uuid: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: number;
    username: string;
    nickname: string;
  };
  type: 'like' | 'dislike' | 'cancel';
  tags: string[];
  content: string | null;
  createdAt: string;
}

// 反馈列表响应
export interface AdminFeedbackListResponse {
  feedbacks: AdminFeedbackItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

// 反馈列表请求参数
export interface AdminFeedbackListParams {
  page?: number;
  pageSize?: number;
  taskKeyword?: string;
  userKeyword?: string;
  taskStartTime?: string;
  taskEndTime?: string;
  feedbackType?: 'all' | 'like' | 'dislike' | 'cancel';
  feedbackStartTime?: string;
  feedbackEndTime?: string;
}

/**
 * 获取反馈列表（管理员）
 */
export async function getAdminFeedbackList(params: AdminFeedbackListParams = {}) {
  const res = await http.get<AdminFeedbackListResponse>(
    '/admin/feedback/list',
    params as Record<string, unknown>
  );
  return res.data;
}
