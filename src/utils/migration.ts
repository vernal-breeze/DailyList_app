import { apiClient } from '../api/client';

/**
 * 从 LocalStorage 读取旧数据并迁移到后端。
 * 迁移成功后清除 LocalStorage 中的旧数据。
 */
export async function migrateFromLocalStorage(): Promise<{
  success: boolean;
  importedTasks: number;
  importedSubtasks: number;
}> {
  const taskStorageRaw = localStorage.getItem('task-storage');
  const settingsStorageRaw = localStorage.getItem('settings-storage');

  let tasks: unknown[] = [];
  let settings: Record<string, unknown> = {};

  if (taskStorageRaw) {
    try {
      const parsed = JSON.parse(taskStorageRaw);
      tasks = parsed.state?.tasks || [];
    } catch {
      console.error('解析任务数据失败');
    }
  }

  if (settingsStorageRaw) {
    try {
      const parsed = JSON.parse(settingsStorageRaw);
      settings = parsed.state?.settings || {};
    } catch {
      console.error('解析设置数据失败');
    }
  }

  if (tasks.length === 0 && Object.keys(settings).length === 0) {
    return { success: true, importedTasks: 0, importedSubtasks: 0 };
  }

  const result = await apiClient.post<{
    imported_tasks: number;
    imported_subtasks: number;
  }>('/migration/import', { tasks, settings });

  if (result.success && result.data) {
    localStorage.removeItem('task-storage');
    localStorage.removeItem('settings-storage');
    return {
      success: true,
      importedTasks: result.data.imported_tasks,
      importedSubtasks: result.data.imported_subtasks,
    };
  }

  return { success: false, importedTasks: 0, importedSubtasks: 0 };
}
