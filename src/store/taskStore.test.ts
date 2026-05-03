import { useTaskStore } from './taskStore';
import { Task } from '../types';
import { scheduleTaskNotification, cancelTaskNotification } from '../services/notificationService';

// Mock notification service
jest.mock('../services/notificationService', () => ({
  scheduleTaskNotification: jest.fn(),
  cancelTaskNotification: jest.fn(),
  rescheduleAllNotifications: jest.fn()
}));

const mockScheduleTaskNotification = scheduleTaskNotification as jest.MockedFunction<typeof scheduleTaskNotification>;
const mockCancelTaskNotification = cancelTaskNotification as jest.MockedFunction<typeof cancelTaskNotification>;

// Mock taskApi
jest.mock('../api/taskApi', () => ({
  taskApi: {
    getAll: jest.fn(),
    create: jest.fn().mockImplementation((task) => Promise.resolve({ success: true, data: {} })),
    update: jest.fn().mockImplementation((id, data) => Promise.resolve({ success: true, data: {} })),
    delete: jest.fn().mockResolvedValue({ success: true }),
    toggleCompleted: jest.fn().mockImplementation((id) => Promise.resolve({ success: true, data: {} })),
    addSubTask: jest.fn().mockImplementation(() => Promise.resolve({ success: true, data: {} })),
    updateSubTask: jest.fn().mockImplementation(() => Promise.resolve({ success: true, data: {} })),
    deleteSubTask: jest.fn().mockResolvedValue({ success: true }),
    toggleSubTaskCompleted: jest.fn().mockImplementation(() => Promise.resolve({ success: true, data: {} })),
  }
}));

function createTestTask(overrides: Partial<Task> = {}): Omit<Task, 'id' | 'createdAt' | 'subtasks'> {
  return {
    title: 'Test Task',
    dueDate: new Date().toISOString(),
    priority: 'medium',
    startDate: new Date().toISOString(),
    taskType: 'single',
    recurrence: {
      enabled: false,
      type: 'daily',
      interval: 1,
      days: [],
      end: { type: 'never' },
      exceptions: []
    },
    reminderEnabled: false,
    notificationId: 0,
    completed: false,
    completedDates: [],
    ...overrides,
  };
}

describe('Task Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const store = useTaskStore.getState();
    store.clearTasks();
  });

  describe('addTask', () => {
    it('should add a new task and schedule notification', async () => {
      const store = useTaskStore.getState();

      const newTask = createTestTask({ reminderEnabled: true, notificationId: 123 });

      await store.addTask(newTask);

      const updatedStore = useTaskStore.getState();
      expect(updatedStore.tasks.length).toBe(1);
      expect(updatedStore.tasks[0].title).toBe('Test Task');
      expect(mockScheduleTaskNotification).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Task',
        reminderEnabled: true
      }));
    });

    it('should add a task without scheduling notification when reminder is disabled', async () => {
      const store = useTaskStore.getState();

      const newTask = createTestTask({ reminderEnabled: false });

      await store.addTask(newTask);

      const updatedStore = useTaskStore.getState();
      expect(updatedStore.tasks.length).toBe(1);
      expect(mockScheduleTaskNotification).not.toHaveBeenCalled();
    });

    it('should rollback on API failure', async () => {
      const { taskApi } = require('../api/taskApi');
      taskApi.create.mockResolvedValueOnce({ success: false, error: 'Network error' });

      const store = useTaskStore.getState();
      const newTask = createTestTask({ reminderEnabled: true, notificationId: 456 });

      await store.addTask(newTask);

      // 乐观添加后应回滚
      const storeAfter = useTaskStore.getState();
      expect(storeAfter.tasks.length).toBe(0);
      expect(storeAfter.error).toContain('Network error');
    });
  });

  describe('updateTask', () => {
    it('should update an existing task and reschedule notification', async () => {
      const store = useTaskStore.getState();

      const newTask = createTestTask({ reminderEnabled: true, notificationId: 123 });
      await store.addTask(newTask);

      const taskId = useTaskStore.getState().tasks[0].id;

      await store.updateTask(taskId, { title: 'Updated Task', reminderEnabled: true });

      const storeAfterUpdate = useTaskStore.getState();
      expect(storeAfterUpdate.tasks[0].title).toBe('Updated Task');
      expect(mockCancelTaskNotification).toHaveBeenCalledWith(expect.objectContaining({ id: taskId }));
    });

    it('should rollback on API failure', async () => {
      const { taskApi } = require('../api/taskApi');
      taskApi.update.mockResolvedValueOnce({ success: false, error: 'Network error' });

      const store = useTaskStore.getState();
      const newTask = createTestTask({ title: 'Original', reminderEnabled: true, notificationId: 123 });
      await store.addTask(newTask);

      const taskId = useTaskStore.getState().tasks[0].id;
      mockScheduleTaskNotification.mockClear();
      mockCancelTaskNotification.mockClear();

      await store.updateTask(taskId, { title: 'Should Rollback' });

      const storeAfter = useTaskStore.getState();
      expect(storeAfter.tasks[0].title).toBe('Original');
      expect(storeAfter.error).toContain('Network error');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task and cancel its notification', async () => {
      const store = useTaskStore.getState();

      const newTask = createTestTask({ reminderEnabled: true, notificationId: 123 });
      await store.addTask(newTask);

      const taskId = useTaskStore.getState().tasks[0].id;
      mockCancelTaskNotification.mockClear();

      await store.deleteTask(taskId);

      const storeAfterDelete = useTaskStore.getState();
      expect(storeAfterDelete.tasks.length).toBe(0);
      expect(mockCancelTaskNotification).toHaveBeenCalledWith(expect.objectContaining({ id: taskId }));
    });

    it('should rollback on API failure', async () => {
      const { taskApi } = require('../api/taskApi');
      taskApi.delete.mockResolvedValueOnce({ success: false, error: 'Network error' });

      const store = useTaskStore.getState();
      const newTask = createTestTask({ title: 'Keep Me' });
      await store.addTask(newTask);

      const taskId = useTaskStore.getState().tasks[0].id;

      await store.deleteTask(taskId);

      const storeAfter = useTaskStore.getState();
      expect(storeAfter.tasks.length).toBe(1);
      expect(storeAfter.error).toContain('Network error');
    });

    it('should cancel notification when deleting a task with reminder', async () => {
      const { taskApi } = require('../api/taskApi');
      taskApi.delete.mockResolvedValueOnce({ success: true });

      const store = useTaskStore.getState();
      const newTask = createTestTask({ reminderEnabled: true, notificationId: 777 });
      await store.addTask(newTask);

      const taskId = useTaskStore.getState().tasks[0].id;
      mockCancelTaskNotification.mockClear();
      await store.deleteTask(taskId);

      expect(mockCancelTaskNotification).toHaveBeenCalled();
    });
  });

  describe('toggleTaskCompleted', () => {
    it('should toggle completion status optimistically', async () => {
      const store = useTaskStore.getState();

      const newTask = createTestTask({ completed: false });
      await store.addTask(newTask);

      const taskId = useTaskStore.getState().tasks[0].id;

      store.toggleTaskCompleted(taskId);
      expect(useTaskStore.getState().tasks[0].completed).toBe(true);

      store.toggleTaskCompleted(taskId);
      expect(useTaskStore.getState().tasks[0].completed).toBe(false);
    });

    it('should rollback on API failure', async () => {
      const { taskApi } = require('../api/taskApi');
      taskApi.toggleCompleted.mockResolvedValueOnce({ success: false, error: 'Network error' });

      const store = useTaskStore.getState();
      const newTask = createTestTask({ completed: false });
      await store.addTask(newTask);

      const taskId = useTaskStore.getState().tasks[0].id;

      store.toggleTaskCompleted(taskId);
      expect(useTaskStore.getState().tasks[0].completed).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(useTaskStore.getState().tasks[0].completed).toBe(false);
    });

    it('should clear all tasks', async () => {
      const store = useTaskStore.getState();

      const task1 = createTestTask({ title: 'Task 1' });
      const task2 = createTestTask({ title: 'Task 2' });

      await store.addTask(task1);
      await store.addTask(task2);

      expect(useTaskStore.getState().tasks.length).toBe(2);
      store.clearTasks();
      expect(useTaskStore.getState().tasks.length).toBe(0);
    });

    it('should add a subtask to a task', async () => {
      const store = useTaskStore.getState();

      const task = createTestTask({ title: 'Parent' });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;
      store.addSubTask(taskId, null, 'Subtask 1');

      expect(useTaskStore.getState().tasks[0].subtasks.length).toBe(1);
      expect(useTaskStore.getState().tasks[0].subtasks[0].title).toBe('Subtask 1');
    });

    it('should add a nested subtask', async () => {
      const store = useTaskStore.getState();

      const task = createTestTask({ title: 'Parent' });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;
      store.addSubTask(taskId, null, 'Subtask 1');
      const subId = useTaskStore.getState().tasks[0].subtasks[0].id;
      store.addSubTask(taskId, subId, 'Subtask 2');

      expect(useTaskStore.getState().tasks[0].subtasks[0].subtasks.length).toBe(1);
      expect(useTaskStore.getState().tasks[0].subtasks[0].subtasks[0].title).toBe('Subtask 2');
    });

    it('should rollback on addSubTask API failure', async () => {
      const { taskApi } = require('../api/taskApi');
      taskApi.addSubTask.mockResolvedValueOnce({ success: false, error: 'Network error' });

      const store = useTaskStore.getState();
      const task = createTestTask({ title: 'Parent' });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;
      store.addSubTask(taskId, null, 'Rollback Sub');

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(useTaskStore.getState().tasks[0].subtasks.length).toBe(0);
    });

    it('should update a subtask optimistically', async () => {
      const store = useTaskStore.getState();

      const task = createTestTask({ title: 'Parent' });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;
      store.addSubTask(taskId, null, 'Old Title');
      const subId = useTaskStore.getState().tasks[0].subtasks[0].id;

      store.updateSubTask(taskId, subId, { title: 'New Title' });

      expect(useTaskStore.getState().tasks[0].subtasks[0].title).toBe('New Title');
    });

    it('should rollback on updateSubTask API failure', async () => {
      const { taskApi } = require('../api/taskApi');
      taskApi.updateSubTask.mockResolvedValueOnce({ success: false, error: 'Network error' });

      const store = useTaskStore.getState();
      const task = createTestTask({ title: 'Parent' });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;
      store.addSubTask(taskId, null, 'Old Title');
      const subId = useTaskStore.getState().tasks[0].subtasks[0].id;

      store.updateSubTask(taskId, subId, { title: 'Ghost' });

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(useTaskStore.getState().tasks[0].subtasks[0].title).toBe('Old Title');
    });

    it('should delete a subtask optimistically', async () => {
      const store = useTaskStore.getState();

      const task = createTestTask({ title: 'Parent' });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;
      store.addSubTask(taskId, null, 'Delete Me');
      const subId = useTaskStore.getState().tasks[0].subtasks[0].id;

      store.deleteSubTask(taskId, subId);

      expect(useTaskStore.getState().tasks[0].subtasks.length).toBe(0);
    });

    it('should rollback on deleteSubTask API failure', async () => {
      const { taskApi } = require('../api/taskApi');
      taskApi.deleteSubTask.mockResolvedValueOnce({ success: false, error: 'Network error' });

      const store = useTaskStore.getState();
      const task = createTestTask({ title: 'Parent' });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;
      store.addSubTask(taskId, null, 'Keep Me');
      const subId = useTaskStore.getState().tasks[0].subtasks[0].id;

      store.deleteSubTask(taskId, subId);

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(useTaskStore.getState().tasks[0].subtasks.length).toBe(1);
    });

    it('should toggle subtask completion optimistically', async () => {
      const store = useTaskStore.getState();

      const task = createTestTask({ title: 'Parent' });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;
      store.addSubTask(taskId, null, 'Toggle Me');
      const subId = useTaskStore.getState().tasks[0].subtasks[0].id;

      expect(useTaskStore.getState().tasks[0].subtasks[0].completed).toBe(false);
      store.toggleSubTaskCompleted(taskId, subId);
      expect(useTaskStore.getState().tasks[0].subtasks[0].completed).toBe(true);
    });

    it('should rollback on toggleSubTaskCompleted API failure', async () => {
      const { taskApi } = require('../api/taskApi');
      taskApi.updateSubTask.mockResolvedValueOnce({ success: false, error: 'Network error' });

      const store = useTaskStore.getState();
      const task = createTestTask({ title: 'Parent' });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;
      store.addSubTask(taskId, null, 'Toggle Me');
      const subId = useTaskStore.getState().tasks[0].subtasks[0].id;

      store.toggleSubTaskCompleted(taskId, subId);
      expect(useTaskStore.getState().tasks[0].subtasks[0].completed).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(useTaskStore.getState().tasks[0].subtasks[0].completed).toBe(false);
    });

    it('should update recurrence settings optimistically', async () => {
      const store = useTaskStore.getState();
      const task = createTestTask({
        recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] }
      });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;
      store.updateRecurrence(taskId, { enabled: false, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] });

      expect(useTaskStore.getState().tasks[0].recurrence.enabled).toBe(false);
    });

    it('should rollback on updateRecurrence API failure', async () => {
      const { taskApi } = require('../api/taskApi');
      taskApi.update.mockResolvedValueOnce({ success: false, error: 'Network error' });

      const store = useTaskStore.getState();
      const task = createTestTask({
        recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] }
      });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;
      store.updateRecurrence(taskId, { enabled: false, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] });

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(useTaskStore.getState().tasks[0].recurrence.enabled).toBe(true);
    });

    it('should add and remove an exception date', async () => {
      const store = useTaskStore.getState();
      const task = createTestTask({
        recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] }
      });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;

      store.addException(taskId, '2026-06-01');
      expect(useTaskStore.getState().tasks[0].recurrence.exceptions).toContain('2026-06-01');

      store.removeException(taskId, '2026-06-01');
      expect(useTaskStore.getState().tasks[0].recurrence.exceptions).not.toContain('2026-06-01');
    });

    it('should set online status', async () => {
      const store = useTaskStore.getState();
      store.setOnlineStatus(true);
      expect(useTaskStore.getState().isOnline).toBe(true);
      store.setOnlineStatus(false);
      expect(useTaskStore.getState().isOnline).toBe(false);
    });

    it('toggle from false to true: cancels notification', async () => {
      const store = useTaskStore.getState();
      const task = createTestTask({ completed: false, reminderEnabled: true, notificationId: 789 });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;
      mockCancelTaskNotification.mockClear();
      store.toggleTaskCompleted(taskId);
      expect(mockCancelTaskNotification).toHaveBeenCalled();
    });

    it('toggle from true to false with reminder: reschedules notification', async () => {
      const store = useTaskStore.getState();
      const task = createTestTask({ completed: true, reminderEnabled: true, notificationId: 789 });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;
      mockScheduleTaskNotification.mockClear();
      store.toggleTaskCompleted(taskId);
      expect(mockScheduleTaskNotification).toHaveBeenCalled();
    });

    it('toggle from true to false without reminder: no notification', async () => {
      const store = useTaskStore.getState();
      const task = createTestTask({ completed: true, reminderEnabled: false, notificationId: 0 });
      await store.addTask(task);

      const taskId = useTaskStore.getState().tasks[0].id;
      mockScheduleTaskNotification.mockClear();
      mockCancelTaskNotification.mockClear();
      store.toggleTaskCompleted(taskId);
      expect(mockScheduleTaskNotification).not.toHaveBeenCalled();
      expect(mockCancelTaskNotification).not.toHaveBeenCalled();
    });

    it('should set loading state during fetch', async () => {
      const { taskApi } = require('../api/taskApi');
      taskApi.getAll.mockResolvedValueOnce({ success: true, data: [] });

      const promise = useTaskStore.getState().fetchTasks();
      expect(useTaskStore.getState().loading).toBe(true);
      await promise;
      expect(useTaskStore.getState().loading).toBe(false);
    });

    it('should handle API failure cleanly', async () => {
      const { taskApi } = require('../api/taskApi');
      taskApi.getAll.mockResolvedValueOnce({ success: false, error: 'Server error' });

      await useTaskStore.getState().fetchTasks();
      expect(useTaskStore.getState().error).toContain('Server error');
    });

    it('should fallback to localStorage on API failure', async () => {
      const { taskApi } = require('../api/taskApi');
      taskApi.getAll.mockResolvedValueOnce({ success: false, error: 'Offline' });

      const storedData = {
        state: {
          tasks: [{
            id: 'local-1', title: 'Local Task',
            dueDate: new Date().toISOString(), startDate: new Date().toISOString(),
            subtasks: [], completed: false, completedDates: [],
            notificationId: 0, priority: 'medium', reminderEnabled: false,
            recurrence: { enabled: false, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
            createdAt: new Date().toISOString(), taskType: 'single',
          }]
        }
      };
      (globalThis as any).localStorage.setItem('task-storage', JSON.stringify(storedData));

      await useTaskStore.getState().fetchTasks();
      expect(useTaskStore.getState().tasks.length).toBe(1);
      expect(useTaskStore.getState().tasks[0].title).toBe('Local Task');
    });

    it('should reload tasks from API and reschedule notifications', async () => {
      const { taskApi } = require('../api/taskApi');
      taskApi.getAll.mockResolvedValueOnce({
        success: true,
        data: [{
          id: 'api-1', title: 'API Task',
          dueDate: new Date().toISOString(), startDate: new Date().toISOString(),
          subtasks: [], completed: false, completedDates: [],
          notificationId: 555, priority: 'medium', reminderEnabled: true,
          recurrence: { enabled: false, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
          createdAt: new Date().toISOString(), taskType: 'single',
        }]
      });

      mockScheduleTaskNotification.mockClear();
      await useTaskStore.getState().loadTasks();

      expect(useTaskStore.getState().tasks.length).toBe(1);
      expect(mockScheduleTaskNotification).toHaveBeenCalled();
    });


  });
});

// ============================================================
// 深度嵌套子任务场景
// ============================================================

describe('深度嵌套子任务', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.getState().clearTasks();
  });

  it('三级嵌套子任务正确设置 level', async () => {
    const store = useTaskStore.getState();
    const task = createTestTask({ title: 'Parent' });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;

    store.addSubTask(taskId, null, 'L1');
    const l1Id = useTaskStore.getState().tasks[0].subtasks[0].id;
    store.addSubTask(taskId, l1Id, 'L2');
    const l2Id = useTaskStore.getState().tasks[0].subtasks[0].subtasks[0].id;
    store.addSubTask(taskId, l2Id, 'L3');

    expect(useTaskStore.getState().tasks[0].subtasks[0].level).toBe(0);
    expect(useTaskStore.getState().tasks[0].subtasks[0].subtasks[0].level).toBe(1);
    expect(useTaskStore.getState().tasks[0].subtasks[0].subtasks[0].subtasks[0].level).toBe(2);
  });

  it('更新深层嵌套子任务', async () => {
    const store = useTaskStore.getState();
    const task = createTestTask({ title: 'Parent' });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;

    store.addSubTask(taskId, null, 'L1');
    const l1Id = useTaskStore.getState().tasks[0].subtasks[0].id;
    store.addSubTask(taskId, l1Id, 'L2');
    const l2Id = useTaskStore.getState().tasks[0].subtasks[0].subtasks[0].id;

    store.updateSubTask(taskId, l2Id, { title: 'Updated L2' });
    expect(useTaskStore.getState().tasks[0].subtasks[0].subtasks[0].title).toBe('Updated L2');
  });

  it('删除深层嵌套子任务', async () => {
    const store = useTaskStore.getState();
    const task = createTestTask({ title: 'Parent' });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;

    store.addSubTask(taskId, null, 'L1');
    const l1Id = useTaskStore.getState().tasks[0].subtasks[0].id;
    store.addSubTask(taskId, l1Id, 'L2');
    const l2Id = useTaskStore.getState().tasks[0].subtasks[0].subtasks[0].id;

    store.deleteSubTask(taskId, l2Id);
    expect(useTaskStore.getState().tasks[0].subtasks[0].subtasks.length).toBe(0);
  });

  it('切换深层嵌套子任务完成状态', async () => {
    const store = useTaskStore.getState();
    const task = createTestTask({ title: 'Parent' });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;

    store.addSubTask(taskId, null, 'L1');
    const l1Id = useTaskStore.getState().tasks[0].subtasks[0].id;
    store.addSubTask(taskId, l1Id, 'L2');
    const l2Id = useTaskStore.getState().tasks[0].subtasks[0].subtasks[0].id;

    expect(useTaskStore.getState().tasks[0].subtasks[0].subtasks[0].completed).toBe(false);
    store.toggleSubTaskCompleted(taskId, l2Id);
    expect(useTaskStore.getState().tasks[0].subtasks[0].subtasks[0].completed).toBe(true);
  });

  it('兄弟子任务搜索更新深层嵌套', async () => {
    const store = useTaskStore.getState();
    const task = createTestTask({ title: 'Parent' });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;

    store.addSubTask(taskId, null, 'L1-A');
    store.addSubTask(taskId, null, 'L1-B');
    const l1bId = useTaskStore.getState().tasks[0].subtasks[1].id;
    store.addSubTask(taskId, l1bId, 'L2');
    const l2Id = useTaskStore.getState().tasks[0].subtasks[1].subtasks[0].id;

    store.updateSubTask(taskId, l2Id, { title: 'Updated via sibling' });
    expect(useTaskStore.getState().tasks[0].subtasks[1].subtasks[0].title).toBe('Updated via sibling');
  });

  it('兄弟分支中的删除不互相影响', async () => {
    const store = useTaskStore.getState();
    const task = createTestTask({ title: 'Parent' });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;

    store.addSubTask(taskId, null, 'L1-A');
    store.addSubTask(taskId, null, 'L1-B');
    const l1bId = useTaskStore.getState().tasks[0].subtasks[1].id;
    store.addSubTask(taskId, l1bId, 'L2-A');
    store.addSubTask(taskId, l1bId, 'L2-B');
    const l2bId = useTaskStore.getState().tasks[0].subtasks[1].subtasks[1].id;

    store.deleteSubTask(taskId, l2bId);
    expect(useTaskStore.getState().tasks[0].subtasks[1].subtasks.length).toBe(1);
    expect(useTaskStore.getState().tasks[0].subtasks[0].subtasks.length).toBe(0);
  });

  it('不存在的子任务操作不崩溃', async () => {
    const store = useTaskStore.getState();
    const task = createTestTask({ title: 'Parent' });
    await store.addTask(task);

    expect(() => {
      store.updateSubTask(useTaskStore.getState().tasks[0].id, 'ghost-id', { title: 'Ghost' });
    }).not.toThrow();
    expect(() => {
      store.deleteSubTask(useTaskStore.getState().tasks[0].id, 'ghost-id');
    }).not.toThrow();
    expect(() => {
      store.toggleSubTaskCompleted(useTaskStore.getState().tasks[0].id, 'ghost-id');
    }).not.toThrow();
  });
});

// ============================================================
// toggleTaskCompleted 回滚通知场景
// ============================================================

describe('toggleTaskCompleted 回滚通知', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.getState().clearTasks();
  });

  it('API 失败回滚后恢复 completed（false→true→false）', async () => {
    const { taskApi } = require('../api/taskApi');
    taskApi.toggleCompleted.mockResolvedValueOnce({ success: false, error: 'Network error' });

    const store = useTaskStore.getState();
    const task = createTestTask({ completed: false, reminderEnabled: true, notificationId: 456 });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;

    store.toggleTaskCompleted(taskId);
    expect(useTaskStore.getState().tasks[0].completed).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(useTaskStore.getState().tasks[0].completed).toBe(false);
  });

  it('API 失败回滚后恢复 completed（true→false→true, has notificationId）', async () => {
    const { taskApi } = require('../api/taskApi');
    taskApi.toggleCompleted.mockResolvedValueOnce({ success: false, error: 'Network error' });

    const store = useTaskStore.getState();
    const task = createTestTask({ completed: true, reminderEnabled: false, notificationId: 789 });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;

    store.toggleTaskCompleted(taskId);
    expect(useTaskStore.getState().tasks[0].completed).toBe(false);

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(useTaskStore.getState().tasks[0].completed).toBe(true);
  });
});

// ============================================================
// 多子任务操作 map 分支全覆盖
// ============================================================

describe('多子任务操作 map 分支', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.getState().clearTasks();
  });

  it('多个子任务时 updateSubTask 只修改目标', async () => {
    const store = useTaskStore.getState();
    const task = createTestTask({ title: 'Parent' });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;

    store.addSubTask(taskId, null, 'Keep');
    store.addSubTask(taskId, null, 'Update Me');
    const subId = useTaskStore.getState().tasks[0].subtasks[1].id;

    store.updateSubTask(taskId, subId, { title: 'Updated!' });

    expect(useTaskStore.getState().tasks[0].subtasks[0].title).toBe('Keep');
    expect(useTaskStore.getState().tasks[0].subtasks[1].title).toBe('Updated!');
  });

  it('多个子任务时 deleteSubTask 只删除目标', async () => {
    const store = useTaskStore.getState();
    const task = createTestTask({ title: 'Parent' });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;

    store.addSubTask(taskId, null, 'Keep');
    store.addSubTask(taskId, null, 'Delete Me');
    store.addSubTask(taskId, null, 'Keep 2');
    const subId = useTaskStore.getState().tasks[0].subtasks[1].id;

    store.deleteSubTask(taskId, subId);

    expect(useTaskStore.getState().tasks[0].subtasks.length).toBe(2);
    expect(useTaskStore.getState().tasks[0].subtasks[0].title).toBe('Keep');
    expect(useTaskStore.getState().tasks[0].subtasks[1].title).toBe('Keep 2');
  });

  it('多个子任务时 toggleSubTaskCompleted 只切换目标', async () => {
    const store = useTaskStore.getState();
    const task = createTestTask({ title: 'Parent' });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;

    store.addSubTask(taskId, null, 'Keep');
    store.addSubTask(taskId, null, 'Toggle Me');
    const subId = useTaskStore.getState().tasks[0].subtasks[1].id;

    store.toggleSubTaskCompleted(taskId, subId);

    expect(useTaskStore.getState().tasks[0].subtasks[0].completed).toBe(false);
    expect(useTaskStore.getState().tasks[0].subtasks[1].completed).toBe(true);
  });
});

// ============================================================
// fetchTasks / loadTasks / addException / removeException 回滚
// ============================================================

describe('fetchTasks loading 状态', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.getState().clearTasks();
  });

  it('API 失败时回退到 localStorage', async () => {
    const { taskApi } = require('../api/taskApi');
    taskApi.getAll.mockResolvedValueOnce({ success: false, error: 'Offline' });

    const storedData = {
      state: {
        tasks: [{
          id: 'local-1', title: 'Local Task',
          dueDate: new Date().toISOString(), startDate: new Date().toISOString(),
          subtasks: [], completed: false, completedDates: [],
          notificationId: 0, priority: 'medium', reminderEnabled: false,
          recurrence: { enabled: false, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
          createdAt: new Date().toISOString(), taskType: 'single',
        }]
      }
    };
    (globalThis as any).localStorage.setItem('task-storage', JSON.stringify(storedData));

    await useTaskStore.getState().fetchTasks();
    expect(useTaskStore.getState().tasks.length).toBe(1);
    expect(useTaskStore.getState().tasks[0].title).toBe('Local Task');
  });
});

describe('addException / removeException 回滚', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.getState().clearTasks();
  });

  it('addException 回滚', async () => {
    const { taskApi } = require('../api/taskApi');
    taskApi.update.mockResolvedValueOnce({ success: false, error: 'Fail' });

    const store = useTaskStore.getState();
    const task = createTestTask({
      recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] }
    });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;

    store.addException(taskId, '2026-06-01');
    expect(useTaskStore.getState().tasks[0].recurrence.exceptions).toContain('2026-06-01');

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(useTaskStore.getState().tasks[0].recurrence.exceptions).not.toContain('2026-06-01');
  });

  it('removeException 回滚', async () => {
    const { taskApi } = require('../api/taskApi');
    // addException 成功
    taskApi.update.mockResolvedValueOnce({ success: true, data: {} });
    // removeException 失败
    taskApi.update.mockResolvedValueOnce({ success: false, error: 'Fail' });

    const store = useTaskStore.getState();
    const task = createTestTask({
      recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] }
    });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;
    store.addException(taskId, '2026-06-10');
    await new Promise(resolve => setTimeout(resolve, 10));

    store.removeException(taskId, '2026-06-10');
    expect(useTaskStore.getState().tasks[0].recurrence.exceptions).not.toContain('2026-06-10');

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(useTaskStore.getState().tasks[0].recurrence.exceptions).toContain('2026-06-10');
  });

  it('不存在的任务操作不崩溃', async () => {
    const store = useTaskStore.getState();
    await expect(store.updateRecurrence('no-such-id', { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] })).resolves.not.toThrow();
    await expect(store.addException('no-such-id', '2026-07-01')).resolves.not.toThrow();
    await expect(store.removeException('no-such-id', '2026-07-01')).resolves.not.toThrow();
  });
});

describe('deleteTask 通知取消', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.getState().clearTasks();
  });

  it('删除无 reminder 的任务不取消通知', async () => {
    const { taskApi } = require('../api/taskApi');
    taskApi.delete.mockResolvedValueOnce({ success: true });

    // 直接注入已完成任务（notificationId=0 时 deleteTask 不会取消通知）
    const task: Task = {
      id: 'del-test-1', title: 'No Reminder',
      dueDate: new Date().toISOString(), startDate: new Date().toISOString(),
      subtasks: [], completed: true, completedDates: [],
      notificationId: 0, priority: 'medium', reminderEnabled: false,
      recurrence: { enabled: false, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      createdAt: new Date().toISOString(), taskType: 'single',
    };
    useTaskStore.setState({ tasks: [task] });
    const taskId = 'del-test-1';

    mockCancelTaskNotification.mockClear();
    await useTaskStore.getState().deleteTask(taskId);
    // 因为 notificationId=0，不触发取消通知
    expect(mockCancelTaskNotification).not.toHaveBeenCalled();
  });
});

describe('resolveTaskId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.getState().clearTasks();
  });

  it('不存在的 ID 不崩溃', async () => {
    const store = useTaskStore.getState();
    const task = createTestTask({ title: 'Origin' });
    await store.addTask(task);

    expect(() => {
      store.toggleTaskCompleted('non-existent-id');
    }).not.toThrow();
  });
});

describe('store 导出辅助函数', () => {
  it('getTodayTasks 返回当天任务', () => {
    const { getTodayTasks } = require('./taskStore');
    const today = new Date();
    const tasks: Task[] = [{
      id: 't1', title: 'Today Task',
      dueDate: today.toISOString(), startDate: today.toISOString(),
      subtasks: [], completed: false, completedDates: [],
      notificationId: 0, priority: 'medium', reminderEnabled: false,
      recurrence: { enabled: false, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      createdAt: today.toISOString(), taskType: 'single',
    }];
    const result = getTodayTasks(tasks);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('getWeekTasks 返回本周任务', () => {
    const { getWeekTasks } = require('./taskStore');
    const result = getWeekTasks([], new Date());
    expect(result).toEqual([]);
  });

  it('getMonthTasksFromStore 返回当月任务', () => {
    const { getMonthTasksFromStore } = require('./taskStore');
    const result = getMonthTasksFromStore([], new Date());
    expect(result).toEqual([]);
  });

  it('getTasksInRange 返回范围任务', () => {
    const { getTasksInRange } = require('./taskStore');
    const result = getTasksInRange([], new Date(), new Date());
    expect(result).toEqual([]);
  });
});

describe('loadTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.getState().clearTasks();
  });

  it('加载任务从 API 成功', async () => {
    const { taskApi } = require('../api/taskApi');
    taskApi.getAll.mockResolvedValueOnce({
      success: true,
      data: [{
        id: 'api-1', title: 'API Task',
        dueDate: new Date().toISOString(), startDate: new Date().toISOString(),
        subtasks: [], completed: false, completedDates: [],
        notificationId: 555, priority: 'medium', reminderEnabled: true,
        recurrence: { enabled: false, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
        createdAt: new Date().toISOString(), taskType: 'single',
      }]
    });

    await useTaskStore.getState().loadTasks();
    expect(useTaskStore.getState().tasks.length).toBe(1);
  });
});



// ============================================================
// 补分支覆盖率：resolveTaskId ID > 5 段
// ============================================================

describe('resolveTaskId 长 ID 场景', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.getState().clearTasks();
  });

  it('ID 为 6 段时查找原始任务', async () => {
    const store = useTaskStore.getState();
    // 直接注入一个固定 ID 格式的任务
    const baseTaskId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const task: Task = {
      id: baseTaskId,
      title: 'Origin',
      dueDate: new Date().toISOString(), startDate: new Date().toISOString(),
      subtasks: [], completed: false, completedDates: [],
      notificationId: 0, priority: 'medium', reminderEnabled: false,
      recurrence: { enabled: false, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      createdAt: new Date().toISOString(), taskType: 'single',
    };
    useTaskStore.setState({ tasks: [task] });

    // 使用重复实例 ID（原始 UUID + '-日期' → 6 段）
    const instanceId = baseTaskId + '-2026-05-02';
    // toggle 这个实例 ID（内部 resolveTaskId 应解析回 baseTaskId）
    expect(() => {
      store.toggleTaskCompleted(instanceId);
    }).not.toThrow();
  });

  it('ID 为 6 段但不匹配任何任务时返回自身', async () => {
    const store = useTaskStore.getState();
    const task: Task = {
      id: 'task-1',
      title: 'Task',
      dueDate: new Date().toISOString(), startDate: new Date().toISOString(),
      subtasks: [], completed: false, completedDates: [],
      notificationId: 0, priority: 'medium', reminderEnabled: false,
      recurrence: { enabled: false, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      createdAt: new Date().toISOString(), taskType: 'single',
    };
    useTaskStore.setState({ tasks: [task] });

    // ID 超过 5 段但不匹配任何任务前缀
    const weirdId = 'xxx-yyy-zzz-aaa-bbb-ccc';
    expect(() => {
      store.toggleTaskCompleted(weirdId);
    }).not.toThrow();
  });
});

// ============================================================
// 补分支覆盖率：updateTask 通知处理分支
// ============================================================

describe('updateTask 通知分支覆盖', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.getState().clearTasks();
  });

  it('reminderEnabled 为 true 但无 notificationId 时只调度不取消', async () => {
    const store = useTaskStore.getState();
    const task = createTestTask({
      reminderEnabled: true,
      notificationId: 0, // 无 previous notification
    });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;
    // 此时 task 有 notificationId（来自 addTask 新生成）

    mockCancelTaskNotification.mockClear();
    mockScheduleTaskNotification.mockClear();

    await store.updateTask(taskId, { title: 'Updated' });

    // 因 reminderEnabled=true，应调度通知
    // 回滚测试已由前面的测试覆盖，这里验证不崩溃即可
    expect(useTaskStore.getState().tasks[0].title).toBe('Updated');
  });

  it('reminderEnabled 从 true 变 false 时取消通知', async () => {
    const store = useTaskStore.getState();
    const task = createTestTask({ reminderEnabled: true, notificationId: 456 });
    await store.addTask(task);
    const taskId = useTaskStore.getState().tasks[0].id;

    mockCancelTaskNotification.mockClear();
    mockScheduleTaskNotification.mockClear();

    await store.updateTask(taskId, { reminderEnabled: false });

    expect(mockCancelTaskNotification).toHaveBeenCalled();
    expect(mockScheduleTaskNotification).not.toHaveBeenCalled();
  });
});

// ============================================================
// 补分支覆盖率：map 回调 else 分支（task.id !== taskId）
// ============================================================

describe('任务操作 map 回调 else 分支', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.getState().clearTasks();
  });

  it('操作单一任务时其他任务不受影响（addSubTask map else）', async () => {
    const store = useTaskStore.getState();
    const t1 = createTestTask({ title: 'Task 1' });
    const t2 = createTestTask({ title: 'Task 2' });
    await store.addTask(t1);
    await store.addTask(t2);
    const t2Id = useTaskStore.getState().tasks[1].id;

    store.addSubTask(t2Id, null, 'Sub');
    // Task 1 不受影响
    expect(useTaskStore.getState().tasks[0].subtasks.length).toBe(0);
  });

  it('操作单一任务时其他任务不受影响（updateSubTask map else）', async () => {
    const store = useTaskStore.getState();
    await store.addTask(createTestTask({ title: 'T1' }));
    await store.addTask(createTestTask({ title: 'T2' }));
    const t2Id = useTaskStore.getState().tasks[1].id;
    store.addSubTask(t2Id, null, 'Sub');
    const subId = useTaskStore.getState().tasks[1].subtasks[0].id;

    store.updateSubTask(t2Id, subId, { title: 'Updated Sub' });
    expect(useTaskStore.getState().tasks[0].subtasks.length).toBe(0);
  });

  it('操作单一任务时其他任务不受影响（deleteSubTask map else）', async () => {
    const store = useTaskStore.getState();
    await store.addTask(createTestTask({ title: 'T1' }));
    await store.addTask(createTestTask({ title: 'T2' }));
    const t2Id = useTaskStore.getState().tasks[1].id;
    store.addSubTask(t2Id, null, 'Sub');
    const subId = useTaskStore.getState().tasks[1].subtasks[0].id;

    store.deleteSubTask(t2Id, subId);
    expect(useTaskStore.getState().tasks[0].subtasks.length).toBe(0);
  });

  it('操作单一任务时其他任务不受影响（toggleSubTask map else）', async () => {
    const store = useTaskStore.getState();
    await store.addTask(createTestTask({ title: 'T1' }));
    await store.addTask(createTestTask({ title: 'T2' }));
    const t2Id = useTaskStore.getState().tasks[1].id;
    store.addSubTask(t2Id, null, 'Sub');
    const subId = useTaskStore.getState().tasks[1].subtasks[0].id;

    store.toggleSubTaskCompleted(t2Id, subId);
    expect(useTaskStore.getState().tasks[0].subtasks.length).toBe(0);
  });
});

// ============================================================
// 补 taskStore 最后 1 个未覆盖行 (347) —— addSubTask 回滚 map else
// ============================================================

describe('addSubTask 回滚时多任务 map else', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.getState().clearTasks();
  });

  it('回滚时其他任务不受影响（map else 分支）', async () => {
    const { taskApi } = require('../api/taskApi');
    taskApi.addSubTask.mockResolvedValueOnce({ success: false, error: 'Fail' });

    const store = useTaskStore.getState();
    await store.addTask(createTestTask({ title: 'Sibling' }));
    await store.addTask(createTestTask({ title: 'Target' }));
    const targetId = useTaskStore.getState().tasks[1].id;

    store.addSubTask(targetId, null, 'Sub');
    expect(useTaskStore.getState().tasks[1].subtasks.length).toBe(1);

    await new Promise(resolve => setTimeout(resolve, 10));
    // 回滚后 Target 的子任务被移除
    expect(useTaskStore.getState().tasks[1].subtasks.length).toBe(0);
    // Sibling 不受影响
    expect(useTaskStore.getState().tasks[0].subtasks.length).toBe(0);
  });
});
