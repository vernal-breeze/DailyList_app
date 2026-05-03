import { apiClient } from './client';
import type { AppSettings } from '../types';

export const settingsApi = {
  get: () => apiClient.get<AppSettings>('/settings'),

  update: (updates: Partial<AppSettings>) =>
    apiClient.put<AppSettings>('/settings', updates),
};
