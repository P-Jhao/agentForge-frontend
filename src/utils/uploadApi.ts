/**
 * 文件上传 API
 */
import { http } from './http';

/**
 * 上传头像
 * @param file 图片文件
 * @returns 图片 URL
 */
export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await http.upload<{ url: string }>('/upload/avatar', formData);
  return res.data.url;
}
