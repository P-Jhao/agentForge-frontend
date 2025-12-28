/**
 * 分享 API 封装
 */
import { http } from './http';

// 生成分享签名响应
interface GenerateShareResponse {
  sign: string;
}

/**
 * 生成分享签名
 * @param resourceId 资源 ID（任务 UUID）
 * @param mode 分享模式（detail 或 replay）
 * @param expireDays 有效天数（1-7）
 */
export async function generateShareSign(
  resourceId: string,
  mode: 'detail' | 'replay',
  expireDays: number
): Promise<string> {
  const res = await http.post<GenerateShareResponse>('/share/generate', {
    resourceId,
    mode,
    expireDays,
  });
  return res.data.sign;
}

// 分享任务详情响应
export interface SharedTaskResponse {
  id: number;
  uuid: string;
  title: string;
  status: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  agent?: {
    id: number;
    displayName: string;
    avatar?: string;
  };
  ownerName: string; // 任务所有者名称
  ownerAvatar?: string | null; // 任务所有者头像
  shareMode: 'detail' | 'replay';
}

// 分享消息响应
export interface SharedMessagesResponse {
  messages: unknown[];
  shareMode: 'detail' | 'replay';
}

/**
 * 通过分享链接获取任务详情（无需登录）
 * @param taskId 任务 UUID
 * @param shareSign 分享签名
 */
export async function getSharedTask(
  taskId: string,
  shareSign: string
): Promise<SharedTaskResponse> {
  const res = await http.get<SharedTaskResponse>(`/share/task/${taskId}`, { shareSign });
  return res.data;
}

/**
 * 通过分享链接获取任务消息（无需登录）
 * @param taskId 任务 UUID
 * @param shareSign 分享签名
 */
export async function getSharedMessages(
  taskId: string,
  shareSign: string
): Promise<SharedMessagesResponse> {
  const res = await http.get<SharedMessagesResponse>(`/share/task/${taskId}/messages`, {
    shareSign,
  });
  return res.data;
}
