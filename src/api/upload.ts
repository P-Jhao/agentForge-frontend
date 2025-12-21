/**
 * 文件上传 API
 */
import { http } from '@/utils/http';

/**
 * 聊天文件上传响应
 */
export interface ChatFileUploadResponse {
  // 文件绝对路径（用于 MCP 工具读取）
  filePath: string;
  // 原始文件名
  originalName: string;
  // 存储的文件名
  filename: string;
  // 文件大小（字节）
  size: number;
  // 文件类型
  mimetype: string;
  // 文件访问 URL
  url: string;
}

/**
 * 上传聊天文件
 * @param file 文件对象
 * @returns 上传结果
 */
export async function uploadChatFile(file: File): Promise<ChatFileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await http.upload<ChatFileUploadResponse>('/upload/chat', formData);

  // 使用前端的 File.name 作为原始文件名（避免编码问题）
  return {
    ...response.data,
    originalName: file.name,
  };
}

/**
 * 上传头像
 * @param file 图片文件
 * @returns 头像 URL
 */
export async function uploadAvatar(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await http.upload<{ url: string }>('/upload/avatar', formData);
  return response.data;
}
