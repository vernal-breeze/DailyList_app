/**
 * 动态获取 API 基础 URL。
 * - Web 开发：使用 VITE_API_BASE_URL 环境变量
 * - Capacitor 生产：使用配置的后端地址
 */
export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Capacitor 原生平台
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
    // 生产环境应替换为实际后端地址
    return 'https://your-server.com/api';
  }

  return 'http://localhost:8002/api';
}
