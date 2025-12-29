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

// Forge 列表项
export interface AdminForgeItem {
  id: number;
  displayName: string;
  description: string | null;
  avatar: string | null;
  isPublic: boolean;
  isActive: boolean;
  usageCount: number;
  creator: {
    id: number;
    username: string;
    nickname: string | null;
  };
  mcps: Array<{
    id: number;
    name: string;
  }>;
  createdAt: string;
}

// Forge 列表响应
export interface AdminForgeListResponse {
  forges: AdminForgeItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

// Forge 列表请求参数
export interface AdminForgeListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: 'all' | 'active' | 'deleted';
  permission?: 'all' | 'public' | 'private';
}

/**
 * 获取所有 Forge 列表（管理员）
 */
export async function getAdminForgeList(params: AdminForgeListParams = {}) {
  const res = await http.get<AdminForgeListResponse>(
    '/admin/forge/list',
    params as Record<string, unknown>
  );
  return res.data;
}

/**
 * 删除 Forge（管理员，软删除）
 */
export async function deleteAdminForge(id: number) {
  await http.delete(`/admin/forge/${id}`);
}

// ==================== 成员管理 ====================

// 成员列表项
export interface AdminMemberItem {
  id: number;
  username: string;
  nickname: string;
  avatar: string | null;
  email: string | null;
  role: 'user' | 'premium' | 'root' | 'operator';
  adminNote: string | null;
  isDeleted: boolean;
  taskCount: number;
  totalTokens: number;
  createdAt: string;
  lastLoginAt: string | null;
}

// 成员列表响应
export interface AdminMemberListResponse {
  members: AdminMemberItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

// 成员列表请求参数
export interface AdminMemberListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: 'all' | 'user' | 'premium' | 'root' | 'operator';
  status?: 'all' | 'active' | 'deleted';
}

/**
 * 获取成员列表（管理员）
 */
export async function getAdminMemberList(params: AdminMemberListParams = {}) {
  const res = await http.get<AdminMemberListResponse>(
    '/admin/member/list',
    params as Record<string, unknown>
  );
  return res.data;
}

// 更新成员请求参数
export interface UpdateMemberParams {
  username?: string;
  email?: string | null;
  role?: 'user' | 'premium' | 'root' | 'operator';
  adminNote?: string | null;
}

/**
 * 更新成员信息（管理员）
 */
export async function updateAdminMember(id: number, params: UpdateMemberParams) {
  await http.put(`/admin/member/${id}`, params);
}

/**
 * 重置成员密码（管理员）
 */
export async function resetAdminMemberPassword(id: number, encryptedPassword: string) {
  await http.put(`/admin/member/${id}/password`, { encryptedPassword });
}

/**
 * 删除成员（管理员，软删除）
 */
export async function deleteAdminMember(id: number) {
  await http.delete(`/admin/member/${id}`);
}

/**
 * 恢复已删除的成员（管理员）
 */
export async function restoreAdminMember(id: number) {
  await http.put(`/admin/member/${id}/restore`);
}

// 创建成员请求参数
export interface CreateMemberParams {
  username: string;
  encryptedPassword: string;
  role: 'user' | 'premium';
  email?: string;
  adminNote?: string;
}

// 创建成员响应
export interface CreateMemberResponse {
  id: number;
  username: string;
}

/**
 * 创建成员（管理员）
 */
export async function createAdminMember(params: CreateMemberParams) {
  const res = await http.post<CreateMemberResponse>('/admin/member', params);
  return res.data;
}

// ==================== 推荐示例管理 ====================

// 推荐示例列表项
export interface AdminFeaturedItem {
  id: number;
  taskUuid: string;
  coverImage: string | null;
  title: string;
  description: string | null;
  clonePrompt: string | null;
  enableThinking: boolean;
  enhanceMode: string;
  smartRoutingEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  task: {
    uuid: string;
    title: string;
    status: string;
    agent: {
      id: number;
      displayName: string;
      avatar: string | null;
    } | null;
  } | null;
}

// 推荐示例列表响应
export interface AdminFeaturedListResponse {
  list: AdminFeaturedItem[];
}

/**
 * 获取推荐示例列表（管理员）
 */
export async function getAdminFeaturedList() {
  const res = await http.get<AdminFeaturedListResponse>('/admin/featured/list');
  return res.data;
}

// 更新推荐示例请求参数
export interface UpdateFeaturedParams {
  coverImage?: string;
  title?: string;
  description?: string;
  clonePrompt?: string;
  enableThinking?: boolean;
  enhanceMode?: string;
  smartRoutingEnabled?: boolean;
  sortOrder?: number;
}

/**
 * 更新推荐示例（管理员）
 */
export async function updateAdminFeatured(taskUuid: string, params: UpdateFeaturedParams) {
  await http.put(`/admin/featured/${taskUuid}`, params);
}

/**
 * 取消推荐示例（管理员）
 */
export async function removeAdminFeatured(taskUuid: string) {
  await http.delete(`/admin/featured/${taskUuid}`);
}

// ==================== 控制台统计 ====================

// 时间范围类型
export type TimeRangeType = 'last24h' | 'last7d' | 'last30d' | 'all' | 'custom';

// 统计查询参数
export interface StatisticsQuery {
  range: TimeRangeType;
  startTime?: string; // ISO 8601 格式，range='custom' 时必填
  endTime?: string; // ISO 8601 格式，range='custom' 时必填
}

// 汇总数据
export interface StatisticsSummary {
  taskCount: number; // 任务总数
  totalTokens: number; // Token 总消耗
  avgTokensPerTask: number; // 平均单次任务 Token
  uv: number; // 独立访客数
  pv: number; // 访问次数
}

// 趋势数据
export interface StatisticsTrends {
  labels: string[]; // 时间标签数组
  tasks: number[]; // 任务次数数组
  tokens: number[]; // Token 消耗数组
  avgTokens: number[]; // 平均 Token 数组
  uv: number[]; // UV 数组
  pv: number[]; // PV 数组
}

// 统计响应数据
export interface StatisticsData {
  summary: StatisticsSummary;
  trends: StatisticsTrends;
}

/**
 * 获取控制台统计数据（管理员）
 */
export async function getDashboardStatistics(params: StatisticsQuery) {
  const res = await http.get<StatisticsData>(
    '/admin/statistics',
    params as unknown as Record<string, unknown>
  );
  return res.data;
}
