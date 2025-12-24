/**
 * 推荐示例相关类型定义
 */

// 推荐示例关联的任务信息
export interface FeaturedTaskInfo {
  uuid: string;
  title: string;
  status: string;
  agent: {
    id: number;
    displayName: string;
    avatar: string | null;
  } | null;
}

// 推荐示例
export interface FeaturedTask {
  id: number;
  taskUuid: string;
  coverImage: string | null;
  title: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  task: FeaturedTaskInfo | null;
}

// 设置推荐示例参数
export interface SetFeaturedParams {
  taskUuid: string;
  coverImage?: string;
  title?: string;
  description?: string;
  sortOrder?: number;
}

// 检查推荐示例响应
export interface CheckFeaturedResponse {
  isFeatured: boolean;
  featured: FeaturedTask | null;
}
