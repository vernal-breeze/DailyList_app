import { apiClient, type ApiResponse } from './client';
import type { Task, SubTask } from '../types';

/** 后端返回的 Task（比前端多 updatedAt 和 version） */
export interface TaskResponse extends Omit<Task, 'subtasks'> {
  subtasks: SubTask[];
  updatedAt: string;
  version: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const taskApi = {
  getAll: async (): Promise<ApiResponse<TaskResponse[]>> => {
    const res = await apiClient.get<PaginatedResponse<TaskResponse>>('/tasks');
    // 兼容分页响应：提取 items 数组
    if (res.success && res.data && 'items' in (res.data as any)) {
      const paginated = res.data as unknown as PaginatedResponse<TaskResponse>;
      return { ...res, data: paginated.items };
    }
    return res as unknown as ApiResponse<TaskResponse[]>;
  },

  getById: (id: string) => apiClient.get<TaskResponse>(`/tasks/${id}`),

  create: (task: Partial<Task> & { title: string; dueDate: string }) =>
    apiClient.post<TaskResponse>('/tasks', task),

  update: (id: string, updates: Partial<Task>) =>
    apiClient.put<TaskResponse>(`/tasks/${id}`, updates),

  toggleCompleted: (id: string, completed: boolean) =>
    apiClient.patch<TaskResponse>(`/tasks/${id}/toggle`, { completed }),

  delete: (id: string) =>
    apiClient.delete(`/tasks/${id}`),

  addSubTask: (taskId: string, subtask: Partial<SubTask> & { title: string }) =>
    apiClient.post(`/tasks/${taskId}/subtasks`, subtask),

  updateSubTask: (taskId: string, subtaskId: string, updates: Partial<SubTask>) =>
    apiClient.put(`/tasks/${taskId}/subtasks/${subtaskId}`, updates),

  deleteSubTask: (taskId: string, subtaskId: string) =>
    apiClient.delete(`/tasks/${taskId}/subtasks/${subtaskId}`),
};
