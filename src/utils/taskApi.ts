/**
 * 任务 API 封装
 */
import { http } from './http';
import type { Task, CreateTaskParams, UpdateTaskParams, GetTasksParams } from '@/types';

/**
 * 创建任务
 */
export async function createTask(params: CreateTaskParams): Promise<Task> {
  const res = await http.post<Task>('/task', params);
  return res.data;
}

/**
 * 获取任务列表
 */
export async function getTasks(params?: GetTasksParams): Promise<Task[]> {
  const res = await http.get<Task[]>('/task/list', params as Record<string, unknown>);
  return res.data;
}

/**
 * 获取任务详情
 */
export async function getTask(uuid: string): Promise<Task> {
  const res = await http.get<Task>(`/task/${uuid}`);
  return res.data;
}

/**
 * 更新任务
 */
export async function updateTask(uuid: string, params: UpdateTaskParams): Promise<Task> {
  const res = await http.put<Task>(`/task/${uuid}`, params);
  return res.data;
}

/**
 * 删除任务
 */
export async function deleteTask(uuid: string): Promise<void> {
  await http.delete(`/task/${uuid}`);
}

/**
 * 生成任务 UUID
 */
export function generateTaskUuid(): string {
  return crypto.randomUUID();
}
