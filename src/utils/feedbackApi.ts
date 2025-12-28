/**
 * 反馈相关 API
 * 处理用户对 AI 回复的点赞/踩反馈
 */
import { http } from './http';

// 反馈类型
export type FeedbackType = 'like' | 'dislike';

// 提交反馈参数
export interface SubmitFeedbackParams {
  taskId: string;
  turnEndMessageId: number;
  type: FeedbackType;
  tags?: string[];
  content?: string;
}

// 提交反馈响应
export interface SubmitFeedbackResponse {
  id: number;
  taskId: number;
  turnEndMessageId: number;
  userId: number;
  type: FeedbackType;
  tags: string[];
  content: string | null;
  createdAt: string;
}

// 取消反馈参数
export interface CancelFeedbackParams {
  taskId: string;
  turnEndMessageId: number;
}

// 取消反馈响应
export interface CancelFeedbackResponse {
  id: number;
  type: 'cancel';
  createdAt: string;
}

// 批量获取反馈状态参数
export interface BatchFeedbackParams {
  taskId: string;
  turnEndMessageIds: number[];
}

// 批量获取反馈状态响应
export type BatchFeedbackResponse = Record<number, FeedbackType | null>;

/**
 * 提交反馈
 */
export async function submitFeedback(
  params: SubmitFeedbackParams
): Promise<SubmitFeedbackResponse> {
  const { taskId, ...body } = params;
  const res = await http.post<SubmitFeedbackResponse>(`/feedback/${taskId}`, body);
  return res.data;
}

/**
 * 取消反馈
 */
export async function cancelFeedback(
  params: CancelFeedbackParams
): Promise<CancelFeedbackResponse> {
  const { taskId, turnEndMessageId } = params;
  const res = await http.post<CancelFeedbackResponse>(`/feedback/${taskId}/cancel`, {
    turnEndMessageId,
  });
  return res.data;
}

/**
 * 批量获取反馈状态
 */
export async function batchGetFeedbackStatus(
  params: BatchFeedbackParams
): Promise<BatchFeedbackResponse> {
  const { taskId, turnEndMessageIds } = params;
  const res = await http.post<BatchFeedbackResponse>(`/feedback/${taskId}/batch`, {
    turnEndMessageIds,
  });
  return res.data;
}
