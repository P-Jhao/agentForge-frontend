/**
 * 统计数据 API 封装
 */
import { http } from './http';

// 首页统计数据
export interface HomeStats {
  taskCount: number; // 已处理任务数
  forgeCount: number; // 活跃 Forge 数
  mcpToolCount: number; // MCP 工具数
}

/**
 * 获取首页统计数据
 */
export async function getHomeStats(): Promise<HomeStats> {
  const res = await http.get<HomeStats>('/stats/home');
  return res.data;
}
