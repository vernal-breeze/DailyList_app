import { loadSyncQueue, saveSyncQueue, executeSyncOp } from '../store/taskStore';

const SYNC_INTERVAL = 5000;
let syncTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 处理同步队列中的操作（来自 taskStore.ts 的同步队列）
 */
export async function syncPendingOperations(): Promise<void> {
  // 不去重了，taskStore.ts 的 flushSyncQueue 已经有自己的状态管理
  // 这个模块只做网络恢复时的触发
}

export function startSyncTimer(): void {
  if (syncTimer) return;
  syncTimer = setInterval(syncPendingOperations, SYNC_INTERVAL);
}

export function stopSyncTimer(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

export function setupNetworkListener(): void {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('网络恢复，开始同步');
    });

    window.addEventListener('offline', () => {
      console.log('网络断开，切换到离线模式');
    });
  }
}

export { loadSyncQueue, saveSyncQueue, executeSyncOp };
