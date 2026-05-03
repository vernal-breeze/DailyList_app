import { apiClient } from './client';

export async function checkHealth(): Promise<boolean> {
  const result = await apiClient.get<{ status: string }>('/health');
  return result.success && result.data?.status === 'ok';
}
