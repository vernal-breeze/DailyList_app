import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { Moon, Sun, Download, Upload } from 'lucide-react';
import OperationFeedback from '../OperationFeedback';

// 内联数据导入/导出（直接操作 Zustand persist 的 localStorage key）
const TASK_STORAGE_KEY = 'task-storage';
const SETTINGS_STORAGE_KEY = 'settings-storage';

const handleExportData = () => {
  try {
    const taskRaw = localStorage.getItem(TASK_STORAGE_KEY);
    const settingsRaw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const tasks = taskRaw ? JSON.parse(taskRaw).state?.tasks || [] : [];
    const settings = settingsRaw ? JSON.parse(settingsRaw).state?.settings || {} : [];
    const data = JSON.stringify({ tasks, settings }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('导出数据失败:', error);
  }
};

const SettingsPanel: React.FC = () => {
  const { settings, updateTheme, updateSortBy, toggleShowCompleted } = useSettingsStore();
  // 操作反馈状态
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'undo' } | null>(null);

  const handleThemeToggle = () => {
    updateTheme(settings.theme === 'light' ? 'dark' : 'light');
  };

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSortBy(e.target.value as 'dueDate' | 'priority' | 'createdAt');
  };

  // 数据导入处理（移入组件内部以使用 feedback 状态）
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const parsed = JSON.parse(text);
          if (parsed.tasks) {
            localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify({ state: { tasks: parsed.tasks } }));
          }
          if (parsed.settings) {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ state: { settings: parsed.settings } }));
          }
          setFeedback({ message: '数据导入成功！', type: 'success' });
          window.location.reload();
        } catch {
          setFeedback({ message: '数据导入失败，请检查文件格式', type: 'error' });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">外观设置</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {settings.theme === 'light' ? <Sun size={20} className="text-gray-500 mr-2" /> : <Moon size={20} className="text-gray-400 mr-2" />}
            <span className="text-gray-700 dark:text-gray-300">{settings.theme === 'light' ? '浅色模式' : '深色模式'}</span>
          </div>
          <button
            onClick={handleThemeToggle}
            className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-pressed={settings.theme === 'dark'}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full transition-transform ${settings.theme === 'dark' ? 'translate-x-6 bg-white' : 'translate-x-1 bg-gray-300'}`} />
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">任务设置</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              排序方式
            </label>
            <select
              id="sortBy"
              value={settings.sortBy}
              onChange={handleSortByChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="dueDate">按提醒时间</option>
              <option value="priority">按优先级</option>
              <option value="createdAt">按创建时间</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showCompleted"
              checked={settings.showCompleted}
              onChange={toggleShowCompleted}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="showCompleted" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              显示已完成任务
            </label>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">数据管理</h2>
        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download size={16} className="mr-2" />
            导出数据
          </button>
          <div className="relative">
            <input
              type="file"
              id="importData"
              accept=".json"
              onChange={handleImportData}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Upload size={16} className="mr-2" />
              导入数据
            </button>
          </div>
        </div>
      </div>

      {/* 操作反馈 */}
      {feedback && (
        <OperationFeedback
          message={feedback.message}
          type={feedback.type}
          onClose={() => setFeedback(null)}
        />
      )}
    </div>
  );
};

export default SettingsPanel;