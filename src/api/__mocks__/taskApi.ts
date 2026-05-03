// Jest manual mock for src/api/taskApi.ts
// This avoids the import.meta issue in client.ts

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: string;
  completed: boolean;
  createdAt: string;
  category?: string;
  subtasks?: any[];
  startDate?: string;
  taskType?: string;
  recurrence?: any;
  reminderEnabled?: boolean;
  notificationId?: number;
  completedDates?: string[];
  updatedAt?: string;
  version?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const taskApi = {
  getAll: jest.fn(() => Promise.resolve({ success: true, data: [] })),
  getById: jest.fn(() => Promise.resolve({ success: true, data: null })),
  create: jest.fn(() => Promise.resolve({ success: true, data: null })),
  update: jest.fn(() => Promise.resolve({ success: true, data: null })),
  delete: jest.fn(() => Promise.resolve({ success: true, data: null })),
  toggleCompleted: jest.fn(() => Promise.resolve({ success: true, data: null })),
  addSubTask: jest.fn(() => Promise.resolve({ success: true, data: null })),
  updateSubTask: jest.fn(() => Promise.resolve({ success: true, data: null })),
  deleteSubTask: jest.fn(() => Promise.resolve({ success: true, data: null })),
};
