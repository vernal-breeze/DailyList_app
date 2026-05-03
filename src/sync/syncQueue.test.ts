import {
  enqueueOperation,
  dequeueOperation,
  getSyncQueue,
  clearSyncQueue,
  getPendingCount,
  getPendingOperations,
  removeOperation,
} from './syncQueue';

// Mock crypto.randomUUID to return sequential IDs
let uuidCounter = 0;
jest.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(() => {
  uuidCounter++;
  return `mock-uuid-${uuidCounter}` as `${string}-${string}-${string}-${string}-${string}`;
});

describe('Sync Queue', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('enqueueOperation', () => {
    it('应该将操作添加到队列', () => {
      enqueueOperation({
        entityType: 'task',
        entityId: 'task-1',
        operation: 'create',
        payload: { title: 'Test' },
      });

      const queue = getSyncQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].entityType).toBe('task');
      expect(queue[0].entityId).toBe('task-1');
      expect(queue[0].operation).toBe('create');
      expect(queue[0].retries).toBe(0);
      expect(queue[0].id).toBeTruthy();
      expect(queue[0].clientTimestamp).toBeDefined();
    });

    it('应该支持连续添加多个操作', () => {
      enqueueOperation({ entityType: 'task', entityId: '1', operation: 'create', payload: {} });
      enqueueOperation({ entityType: 'task', entityId: '2', operation: 'update', payload: {} });
      enqueueOperation({ entityType: 'settings', entityId: 'global', operation: 'update', payload: {} });

      expect(getSyncQueue()).toHaveLength(3);
    });
  });

  describe('dequeueOperation', () => {
    it('应该移除指定 ID 的操作', () => {
      enqueueOperation({ entityType: 'task', entityId: '1', operation: 'create', payload: {} });
      enqueueOperation({ entityType: 'task', entityId: '2', operation: 'create', payload: {} });

      expect(getSyncQueue()).toHaveLength(2);

      // 从队列中获取实际 ID 来删除
      const queue = getSyncQueue();
      const idToRemove = queue[0].id;
      dequeueOperation(idToRemove);
      
      const updatedQueue = getSyncQueue();
      expect(updatedQueue).toHaveLength(1);
      expect(updatedQueue[0].entityId).toBe('2');
    });

    it('移除不存在的 ID 不应报错', () => {
      enqueueOperation({ entityType: 'task', entityId: '1', operation: 'create', payload: {} });
      dequeueOperation('non-existent-id');
      expect(getSyncQueue()).toHaveLength(1);
    });
  });

  describe('getPendingCount', () => {
    it('空队列返回 0', () => {
      expect(getPendingCount()).toBe(0);
    });

    it('正确返回队列长度', () => {
      enqueueOperation({ entityType: 'task', entityId: '1', operation: 'create', payload: {} });
      enqueueOperation({ entityType: 'task', entityId: '2', operation: 'create', payload: {} });

      expect(getPendingCount()).toBe(2);
    });
  });

  describe('clearSyncQueue', () => {
    it('应该清空队列', () => {
      enqueueOperation({ entityType: 'task', entityId: '1', operation: 'create', payload: {} });
      enqueueOperation({ entityType: 'task', entityId: '2', operation: 'create', payload: {} });

      clearSyncQueue();
      expect(getSyncQueue()).toHaveLength(0);
      expect(getPendingCount()).toBe(0);
    });

    it('清空空队列不应报错', () => {
      clearSyncQueue();
      expect(getSyncQueue()).toHaveLength(0);
    });
  });

  describe('getPendingOperations', () => {
    it('返回当前队列快照', () => {
      enqueueOperation({ entityType: 'task', entityId: '1', operation: 'create', payload: { title: 'Task 1' } });
      enqueueOperation({ entityType: 'task', entityId: '2', operation: 'delete', payload: {} });

      const operations = getPendingOperations();
      expect(operations).toHaveLength(2);
      expect(operations[0].entityId).toBe('1');
      expect(operations[1].entityId).toBe('2');
    });
  });

  describe('removeOperation', () => {
    it('是 dequeueOperation 的别名，功能相同', () => {
      enqueueOperation({ entityType: 'task', entityId: '1', operation: 'create', payload: {} });
      expect(getSyncQueue()).toHaveLength(1);

      const queue = getSyncQueue();
      removeOperation(queue[0].id);
      expect(getSyncQueue()).toHaveLength(0);
    });
  });

  describe('持久化', () => {
    it('localStorage 被正确写入和读取', () => {
      enqueueOperation({ entityType: 'task', entityId: 'persist-1', operation: 'create', payload: { data: 'test' } });

      // 模拟页面刷新：重新读取 localStorage
      const raw = localStorage.getItem('sync-queue');
      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].entityId).toBe('persist-1');
    });

    it('localStorage 数据损坏时返回空数组', () => {
      localStorage.setItem('sync-queue', 'invalid-json');

      expect(getSyncQueue()).toEqual([]);
    });
  });
});
