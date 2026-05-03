import { create } from 'zustand';
import { Task, SubTask } from '../types';
import { getBeijingTime } from '../utils/dateUtils';
import { getTodayTasks as getTodayTasksFromUtils, getWeekTasks as getWeekTasksFromUtils, getMonthTasks, getTasksInRange as getTasksInRangeFromUtils } from '../utils/recurrenceUtils';
import {
  scheduleTaskNotification,
  cancelTaskNotification
} from '../services/notificationService';
import { taskApi } from '../api/taskApi';

// ============================================================
// 同步队列：离线重试机制
// ============================================================

const SYNC_RETRY_KEY = 'sync_queue';
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 2000;

interface SyncOp {
  id: string;
  kind: 'create' | 'update' | 'delete' | 'toggle' | 'addSubTask' | 'updateSubTask' | 'deleteSubTask';
  payload: any;
  createdAt: number;
  retries: number;
  nextRetryAt: number;
}

export function loadSyncQueue(): SyncOp[] {
  try {
    const raw = localStorage.getItem(SYNC_RETRY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSyncQueue(queue: SyncOp[]): void {
  try {
    localStorage.setItem(SYNC_RETRY_KEY, JSON.stringify(queue));
  } catch { /* localStorage 满则丢弃 */ }
}

function enqueueSync(kind: SyncOp['kind'], payload: any): void {
  const queue = loadSyncQueue();
  queue.push({
    id: crypto.randomUUID(),
    kind,
    payload,
    createdAt: Date.now(),
    retries: 0,
    nextRetryAt: Date.now() + INITIAL_BACKOFF_MS,
  });
  saveSyncQueue(queue);
}

export async function executeSyncOp(op: SyncOp): Promise<boolean> {
  try {
    switch (op.kind) {
      case 'create': {
        const res = await taskApi.create(op.payload.task);
        if (res.success && res.data && op.payload.taskId) {
          useTaskStore.getState()._updateTaskById(op.payload.taskId, {
            ...res.data,
            subtasks: op.payload.task.subtasks,
            startDate: op.payload.task.startDate,
            taskType: op.payload.task.taskType,
            reminderEnabled: op.payload.task.reminderEnabled,
            notificationId: op.payload.task.notificationId,
            completedDates: op.payload.task.completedDates,
            recurrence: op.payload.task.recurrence,
          });
        }
        return true;
      }
      case 'update':
        await taskApi.update(op.payload.id, op.payload.updates);
        return true;
      case 'delete':
        await taskApi.delete(op.payload.id);
        return true;
      case 'toggle':
        await taskApi.toggleCompleted(op.payload.id, op.payload.completed);
        return true;
      case 'addSubTask':
        await taskApi.addSubTask(op.payload.taskId, op.payload.body);
        return true;
      case 'updateSubTask':
        await taskApi.updateSubTask(op.payload.taskId, op.payload.subTaskId, op.payload.updates);
        return true;
      case 'deleteSubTask':
        await taskApi.deleteSubTask(op.payload.taskId, op.payload.subTaskId);
        return true;
    }
  } catch {
    return false;
  }
}

async function flushSyncQueue(): Promise<void> {
  const queue = loadSyncQueue();
  const now = Date.now();
  const pending: SyncOp[] = [];
  let changed = false;

  for (const op of queue) {
    if (op.nextRetryAt > now) {
      pending.push(op);
      continue;
    }

    const ok = await executeSyncOp(op);
    if (ok) {
      changed = true;
    } else {
      op.retries++;
      if (op.retries >= MAX_RETRIES) {
        // 超过最大重试次数，丢弃
        changed = true;
        continue;
      }
      op.nextRetryAt = now + INITIAL_BACKOFF_MS * Math.pow(2, op.retries - 1);
      pending.push(op);
    }
  }

  if (changed) saveSyncQueue(pending);
}

/** 初始化同步队列心跳 */
function initSyncHeartbeat(): void {
  setInterval(flushSyncQueue, 10000);
}

// ============================================================
// 辅助函数：与后端同步（fire-and-sync，失败入队重试）
// ============================================================

async function syncCreate(task: Task): Promise<void> {
  try {
    const res = await taskApi.create(task);
    if (res.success && res.data) {
      useTaskStore.getState()._updateTaskById(task.id, {
        ...res.data,
        // 保留前端的嵌套和本地字段
        subtasks: task.subtasks,
        startDate: task.startDate,
        taskType: task.taskType,
        reminderEnabled: task.reminderEnabled,
        notificationId: task.notificationId,
        completedDates: task.completedDates,
        recurrence: task.recurrence,
      });
    }
  } catch {
    enqueueSync('create', { taskId: task.id, task });
  }
}

async function syncUpdate(id: string, updates: Partial<Task>): Promise<void> {
  try {
    await taskApi.update(id, updates);
  } catch {
    enqueueSync('update', { id, updates });
  }
}

async function syncDelete(id: string): Promise<void> {
  try {
    await taskApi.delete(id);
  } catch {
    enqueueSync('delete', { id });
  }
}

async function syncToggle(id: string, completed: boolean): Promise<void> {
  try {
    await taskApi.toggleCompleted(id, completed);
  } catch {
    enqueueSync('toggle', { id, completed });
  }
}

async function syncSubTask(taskId: string, body: Partial<SubTask> & { title: string }): Promise<void> {
  try {
    await taskApi.addSubTask(taskId, body);
  } catch {
    enqueueSync('addSubTask', { taskId, body });
  }
}

async function syncUpdateSubTask(taskId: string, subTaskId: string, updates: Partial<SubTask>): Promise<void> {
  try {
    await taskApi.updateSubTask(taskId, subTaskId, updates);
  } catch {
    enqueueSync('updateSubTask', { taskId, subTaskId, updates });
  }
}

async function syncDeleteSubTask(taskId: string, subTaskId: string): Promise<void> {
  try {
    await taskApi.deleteSubTask(taskId, subTaskId);
  } catch {
    enqueueSync('deleteSubTask', { taskId, subTaskId });
  }
}

// ============================================================
// Store 接口
// ============================================================

interface TaskStore {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'subtasks'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompleted: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  loadTasks: () => void;
  generateRecurringTasks: () => void;
  clearTasks: () => void;
  exportTasks: () => void;

  // 子任务相关方法
  addSubTask: (taskId: string, parentSubTaskId: string | null, title: string) => void;
  updateSubTask: (taskId: string, subTaskId: string, updates: Partial<SubTask>) => void;
  deleteSubTask: (taskId: string, subTaskId: string) => void;
  toggleSubTaskCompleted: (taskId: string, subTaskId: string) => void;

  // 重复任务相关方法
  updateRecurrence: (taskId: string, recurrence: Task['recurrence']) => void;
  addException: (taskId: string, date: string) => void;
  removeException: (taskId: string, date: string) => void;

  // 每日巡检
  dailyInspection: () => void;

  // 内部工具
  _updateTaskById: (id: string, updates: Partial<Task>) => void;
}

// ============================================================
// 辅助函数
// ============================================================

function resolveTaskId(tasks: Task[], id: string): string {
  if (tasks.some(t => t.id === id)) return id;
  const idParts = id.split('-');
  if (idParts.length > 5) {
    for (const taskId of tasks.map(t => t.id)) {
      if (id.startsWith(taskId + '-')) return taskId;
    }
    const possibleOriginalId = idParts.slice(0, 5).join('-');
    if (tasks.some(t => t.id === possibleOriginalId)) return possibleOriginalId;
  }
  return id;
}

function getSubTaskLevel(subtasks: SubTask[], subTaskId: string): number {
  for (const subtask of subtasks) {
    if (subtask.id === subTaskId) return subtask.level;
    const level = getSubTaskLevel(subtask.subtasks, subTaskId);
    if (level !== -1) return level;
  }
  return -1;
}

function addSubTaskToParent(subtasks: SubTask[], parentId: string, newSubTask: SubTask): SubTask[] {
  return subtasks.map(subtask => {
    if (subtask.id === parentId)
      return { ...subtask, subtasks: [...subtask.subtasks, newSubTask] };
    return { ...subtask, subtasks: addSubTaskToParent(subtask.subtasks, parentId, newSubTask) };
  });
}

function updateSubTaskInTree(subtasks: SubTask[], subTaskId: string, updates: Partial<SubTask>): SubTask[] {
  return subtasks.map(subtask => {
    if (subtask.id === subTaskId) return { ...subtask, ...updates };
    return { ...subtask, subtasks: updateSubTaskInTree(subtask.subtasks, subTaskId, updates) };
  });
}

function deleteSubTaskFromTree(subtasks: SubTask[], subTaskId: string): SubTask[] {
  return subtasks.filter(subtask => {
    if (subtask.id === subTaskId) return false;
    subtask.subtasks = deleteSubTaskFromTree(subtask.subtasks, subTaskId);
    return true;
  });
}

function toggleSubTaskInTree(subtasks: SubTask[], subTaskId: string): SubTask[] {
  return subtasks.map(subtask => {
    if (subtask.id === subTaskId) return { ...subtask, completed: !subtask.completed };
    return { ...subtask, subtasks: toggleSubTaskInTree(subtask.subtasks, subTaskId) };
  });
}

/** 从 localStorage 恢复 tasks（安全反序列化） */
function loadTasksFromLocal(): Task[] {
  try {
    const raw = localStorage.getItem('task-storage');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const { state } = parsed;
    if (state && Array.isArray(state.tasks)) return state.tasks;
    return [];
  } catch {
    return [];
  }
}

/** 保存 tasks 到 localStorage */
function saveTasksToLocal(tasks: Task[]): void {
  try {
    localStorage.setItem('task-storage', JSON.stringify({
      state: { tasks },
      version: 0,
    }));
  } catch {
    // localStorage 可能满
  }
}

// ============================================================
// Store 实现（无 persist 中间件，手动 localStorage 管理）
// ============================================================

export const useTaskStore = create<TaskStore>()((set, get) => ({
  tasks: loadTasksFromLocal(),

  // ---- 内部方法 ----
  _updateTaskById: (id, updates) =>
    set((state) => {
      const updated = state.tasks.map(t => (t.id === id ? { ...t, ...updates } : t));
      saveTasksToLocal(updated);
      return { tasks: updated };
    }),

  // ---- CRUD ----

  addTask: (task) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: getBeijingTime().toISOString(),
      subtasks: [],
      startDate: task.startDate || getBeijingTime().toISOString(),
      taskType: task.taskType || 'single',
      reminderEnabled: task.reminderEnabled || false,
      notificationId: Math.floor(Math.random() * 1000000),
      completedDates: [],
      recurrence: task.recurrence || {
        enabled: false, type: 'daily', interval: 1, days: [],
        end: { type: 'never' }, exceptions: [],
      },
    };

    set((state) => {
      const updatedTasks = [...state.tasks, newTask];
      if (newTask.reminderEnabled) scheduleTaskNotification(newTask);
      saveTasksToLocal(updatedTasks);
      return { tasks: updatedTasks };
    });

    syncCreate(newTask);
  },

  updateTask: (id, updates) => {
    const resolvedId = resolveTaskId(get().tasks, id);
    set((state) => {
      const updatedTasks = state.tasks.map(task => {
        if (task.id === resolvedId) {
          const updated = { ...task, ...updates };
          if (updated.reminderEnabled) {
            if (task.notificationId) cancelTaskNotification(task);
            scheduleTaskNotification(updated);
          } else {
            if (task.notificationId) cancelTaskNotification(task);
          }
          return updated;
        }
        return task;
      });
      saveTasksToLocal(updatedTasks);
      return { tasks: updatedTasks };
    });
    syncUpdate(resolvedId, updates);
  },

  deleteTask: (id) => {
    const resolvedId = resolveTaskId(get().tasks, id);
    const task = get().tasks.find(t => t.id === resolvedId);
    if (task?.notificationId) cancelTaskNotification(task);
    set((state) => {
      const updatedTasks = state.tasks.filter(t => t.id !== resolvedId);
      saveTasksToLocal(updatedTasks);
      return { tasks: updatedTasks };
    });
    syncDelete(resolvedId);
  },

  toggleTaskCompleted: (id) => {
    const originalTaskId = resolveTaskId(get().tasks, id);
    let newCompleted = false;
    set((state) => {
      const updatedTasks = state.tasks.map(task => {
        if (task.id === originalTaskId) {
          const flipped = !task.completed;
          newCompleted = flipped;
          const updated = { ...task, completed: flipped };
          if (flipped) {
            if (task.notificationId) cancelTaskNotification(task);
          } else if (updated.reminderEnabled) {
            scheduleTaskNotification(updated);
          }
          return updated;
        }
        return task;
      });
      saveTasksToLocal(updatedTasks);
      return { tasks: updatedTasks };
    });
    syncToggle(originalTaskId, newCompleted);
  },

  // 兼容旧方法名
  toggleTaskCompletion: (id) => get().toggleTaskCompleted(id),

  clearTasks: () => {
    get().tasks.forEach(t => { if (t.notificationId) cancelTaskNotification(t); });
    set({ tasks: [] });
    saveTasksToLocal([]);
  },

  exportTasks: () => { /* 不做任何事情，保持接口兼容 */ },

  loadTasks: () => {
    // 页面加载时尝试刷新同步队列
    flushSyncQueue();

    taskApi.getAll().then(res => {
      if (res.success && res.data) {
        const apiTasks: Task[] = res.data.map((t: any) => ({
          ...t,
          notificationId: t.notificationId || Math.floor(Math.random() * 1000000),
        }));

        // 合并策略：本地有数据则按 id 合并，取版本号大的
        const localTasks = get().tasks;
        if (localTasks.length > 0) {
          const apiMap = new Map(apiTasks.map(t => [t.id, t]));
          const merged = localTasks.map(local => {
            const api = apiMap.get(local.id);
            if (api) {
              apiMap.delete(local.id);
              return (api as any).version > (local as any).version ? api : local;
            }
            return local;
          });
          const extra = Array.from(apiMap.values()).filter(
            api => !merged.some(m => m.id === api.id)
          );
          const finalTasks = [...merged, ...extra];
          set({ tasks: finalTasks });
          saveTasksToLocal(finalTasks);
        } else {
          set({ tasks: apiTasks });
          saveTasksToLocal(apiTasks);
        }

        get().tasks.forEach(t => {
          if (!t.completed && t.reminderEnabled) scheduleTaskNotification(t);
        });
        return;
      }
      const tasks = get().tasks;
      tasks.forEach(t => {
        if (!t.completed && t.reminderEnabled) scheduleTaskNotification(t);
      });
    }).catch(() => {
      const tasks = get().tasks;
      tasks.forEach(t => {
        if (!t.completed && t.reminderEnabled) scheduleTaskNotification(t);
      });
    });
  },

  generateRecurringTasks: () => { /* 不再预生成 */ },

  // ---- 子任务 ----

  addSubTask: (taskId, parentSubTaskId, title) => {
    set((state) => {
      const updatedTasks = state.tasks.map(task => {
        if (task.id === taskId) {
          const newSubTask: SubTask = {
            id: crypto.randomUUID(), title, completed: false,
            parentId: parentSubTaskId || taskId,
            level: parentSubTaskId ? getSubTaskLevel(task.subtasks, parentSubTaskId) + 1 : 0,
            subtasks: [],
          };
          return {
            ...task,
            subtasks: !parentSubTaskId
              ? [...task.subtasks, newSubTask]
              : addSubTaskToParent(task.subtasks, parentSubTaskId, newSubTask),
          };
        }
        return task;
      });
      saveTasksToLocal(updatedTasks);
      return { tasks: updatedTasks };
    });
    syncSubTask(taskId, { title });
  },

  updateSubTask: (taskId, subTaskId, updates) => {
    set((state) => {
      const updatedTasks = state.tasks.map(task =>
        task.id === taskId
          ? { ...task, subtasks: updateSubTaskInTree(task.subtasks, subTaskId, updates) }
          : task
      );
      saveTasksToLocal(updatedTasks);
      return { tasks: updatedTasks };
    });
    syncUpdateSubTask(taskId, subTaskId, updates);
  },

  deleteSubTask: (taskId, subTaskId) => {
    set((state) => {
      const updatedTasks = state.tasks.map(task =>
        task.id === taskId
          ? { ...task, subtasks: deleteSubTaskFromTree(task.subtasks, subTaskId) }
          : task
      );
      saveTasksToLocal(updatedTasks);
      return { tasks: updatedTasks };
    });
    syncDeleteSubTask(taskId, subTaskId);
  },

  toggleSubTaskCompleted: (taskId, subTaskId) => {
    let newCompleted = false;
    set((state) => {
      const updatedTasks = state.tasks.map(task => {
        if (task.id === taskId) {
          const toggled = toggleSubTaskInTree(task.subtasks, subTaskId);
          const findSub = (list: SubTask[]): SubTask | null => {
            for (const s of list) {
              if (s.id === subTaskId) return s;
              const found = findSub(s.subtasks);
              if (found) return found;
            }
            return null;
          };
          const found = findSub(toggled);
          if (found) newCompleted = found.completed;
          return { ...task, subtasks: toggled };
        }
        return task;
      });
      saveTasksToLocal(updatedTasks);
      return { tasks: updatedTasks };
    });
    syncUpdateSubTask(taskId, subTaskId, { completed: newCompleted });
  },

  // ---- 重复任务 ----

  updateRecurrence: (taskId, recurrence) => {
    set((state) => {
      const updatedTasks = state.tasks.map(t => (t.id === taskId ? { ...t, recurrence } : t));
      saveTasksToLocal(updatedTasks);
      return { tasks: updatedTasks };
    });
    syncUpdate(taskId, { recurrence } as any);
  },

  addException: (taskId, date) => {
    set((state) => {
      const updatedTasks = state.tasks.map(t =>
        t.id === taskId
          ? { ...t, recurrence: { ...t.recurrence, exceptions: [...t.recurrence.exceptions, date] } }
          : t
      );
      saveTasksToLocal(updatedTasks);
      return { tasks: updatedTasks };
    });
  },

  removeException: (taskId, date) => {
    set((state) => {
      const updatedTasks = state.tasks.map(t =>
        t.id === taskId
          ? { ...t, recurrence: { ...t.recurrence, exceptions: t.recurrence.exceptions.filter(d => d !== date) } }
          : t
      );
      saveTasksToLocal(updatedTasks);
      return { tasks: updatedTasks };
    });
  },

  dailyInspection: () => set((state) => ({ tasks: state.tasks })),
}));

// 模块加载时初始化同步心跳
initSyncHeartbeat();

// 导出工具函数（保持不变）
export function getTodayTasks(tasks: Task[]): Task[] {
  return getTodayTasksFromUtils(tasks);
}
export function getWeekTasks(tasks: Task[], refDate?: Date): Task[] {
  return getWeekTasksFromUtils(tasks, refDate);
}
export function getMonthTasksFromStore(tasks: Task[], date?: Date): Task[] {
  return getMonthTasks(tasks, date);
}
export function getTasksInRange(tasks: Task[], startDate: Date, endDate: Date): Task[] {
  return getTasksInRangeFromUtils(tasks, startDate, endDate);
}
