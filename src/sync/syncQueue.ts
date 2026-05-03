/**
 * 离线操作同步队列。
 * 使用 localStorage 存储（数据量小，足够使用）。
 */

const SYNC_QUEUE_KEY = 'sync-queue';

export interface SyncOperation {
  id: string;
  entityType: 'task' | 'subtask' | 'settings';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: unknown;
  clientTimestamp: string;
  retries: number;
}

export function getSyncQueue(): SyncOperation[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSyncQueue(queue: SyncOperation[]): void {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueOperation(op: Omit<SyncOperation, 'id' | 'clientTimestamp' | 'retries'>): void {
  const queue = getSyncQueue();
  queue.push({
    ...op,
    id: crypto.randomUUID(),
    clientTimestamp: new Date().toISOString(),
    retries: 0,
  });
  saveSyncQueue(queue);
}

export function dequeueOperation(id: string): void {
  const queue = getSyncQueue().filter(op => op.id !== id);
  saveSyncQueue(queue);
}

export function clearSyncQueue(): void {
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

export function getPendingCount(): number {
  return getSyncQueue().length;
}

/**
 * 从 localStorage 读取待同步操作列表。
 * 返回格式与存储格式一致，方便外部消费。
 */
export function getPendingOperations(): SyncOperation[] {
  return getSyncQueue();
}

/**
 * 从 localStorage 中移除指定 ID 的已同步操作。
 * @param id - 待移除操作的唯一标识
 */
export function removeOperation(id: string): void {
  dequeueOperation(id);
}
