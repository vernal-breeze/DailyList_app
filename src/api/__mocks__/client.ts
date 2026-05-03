// Jest manual mock for src/api/client.ts
// This avoids the import.meta issue entirely

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export const apiClient = {
  get: jest.fn(() => Promise.resolve({ success: true, data: [] })),
  post: jest.fn(() => Promise.resolve({ success: true, data: null })),
  put: jest.fn(() => Promise.resolve({ success: true, data: null })),
  patch: jest.fn(() => Promise.resolve({ success: true, data: null })),
  delete: jest.fn(() => Promise.resolve({ success: true, data: null })),
};
