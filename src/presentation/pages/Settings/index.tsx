import React, { useEffect, useState } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Download, Trash2, Sun, Moon, Bell, Info } from 'lucide-react';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import OperationFeedback from '@/components/OperationFeedback';

const Settings: React.FC = () => {
  const { clearTasks, tasks } = useTaskStore();
  const { settings, updateTheme, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const [taskReminder, setTaskReminder] = useState(() => {
    const saved = localStorage.getItem('notification-settings');
    if (saved) {
      try { return JSON.parse(saved).taskReminder ?? true; } catch { /* ignore */ }
    }
    return true;
  });
  const [dailySummary, setDailySummary] = useState(() => {
    const saved = localStorage.getItem('notification-settings');
    if (saved) {
      try { return JSON.parse(saved).dailySummary ?? false; } catch { /* ignore */ }
    }
    return false;
  });

  const handleNotificationChange = (key: 'taskReminder' | 'dailySummary', value: boolean) => {
    if (key === 'taskReminder') setTaskReminder(value);
    else setDailySummary(value);
    const current = { taskReminder, dailySummary };
    current[key] = value;
    localStorage.setItem('notification-settings', JSON.stringify(current));
  };

  const handleToggleDarkMode = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateTheme(newTheme);
  };

  // 删除确认弹窗状态
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // 操作反馈状态
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'undo' } | null>(null);

  const handleClearTasks = () => {
    setShowDeleteModal(true);
  };

  // 确认清除所有任务
  const handleConfirmClear = () => {
    clearTasks();
    setShowDeleteModal(false);
    setFeedback({ message: '所有任务已清除', type: 'success' });
  };

  // 取消清除
  const handleCancelClear = () => {
    setShowDeleteModal(false);
  };

  const handleExportTasks = () => {
    const data = JSON.stringify(tasks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen py-6 px-4 relative z-10 transition-colors duration-300 ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50'}`}>
      {/* 顶部导航栏 - 毛玻璃风格 */}
      <div className="sticky top-0 z-20 mb-6 -mx-4 px-4 pt-4">
        <div className={`glass rounded-3xl px-6 py-5 ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-700'}`}>设置</h1>
              <p className={`text-sm mt-1 ${settings.theme === 'dark' ? 'text-rose-300' : 'text-rose-400'}`}>个性化你的体验</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto">
        {/* 设置内容 */}
        <div className="space-y-5">
          {/* 外观设置 */}
          <div className={`glass rounded-3xl p-6 fade-in ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`} style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-5">
              {settings.theme === 'dark' ? <Moon size={24} className="text-rose-400" /> : <Sun size={24} className="text-rose-500" />}
              <h2 className={`text-lg font-bold ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-700'}`}>外观设置</h2>
            </div>
            <div className="flex items-center justify-between">
              <span className={`font-medium ${settings.theme === 'dark' ? 'text-rose-300' : 'text-rose-600'}`}>深色模式</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.theme === 'dark'}
                  onChange={handleToggleDarkMode}
                />
                <div className={`w-12 h-7 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:shadow-md after:transition-all ${settings.theme === 'dark' ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-rose-100/60 peer-checked:bg-gradient-to-r peer-checked:from-rose-300 peer-checked:to-rose-400'}`}></div>
              </label>
            </div>
          </div>

          {/* 通知设置 */}
          <div className={`glass rounded-3xl p-6 fade-in ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`} style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-5">
              <Bell size={24} className={settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-500'} />
              <h2 className={`text-lg font-bold ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-700'}`}>通知设置</h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${settings.theme === 'dark' ? 'text-rose-300' : 'text-rose-600'}`}>任务提醒</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={taskReminder} onChange={(e) => handleNotificationChange('taskReminder', e.target.checked)} />
                  <div className={`w-12 h-7 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:shadow-md after:transition-all ${settings.theme === 'dark' ? 'bg-rose-500/30 peer-checked:bg-gradient-to-r peer-checked:from-rose-400 peer-checked:to-rose-500' : 'bg-rose-100/60 peer-checked:bg-gradient-to-r peer-checked:from-rose-300 peer-checked:to-rose-400'}`}></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-medium ${settings.theme === 'dark' ? 'text-rose-300' : 'text-rose-600'}`}>每日摘要</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={dailySummary} onChange={(e) => handleNotificationChange('dailySummary', e.target.checked)} />
                  <div className={`w-12 h-7 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:shadow-md after:transition-all ${settings.theme === 'dark' ? 'bg-rose-500/30 peer-checked:bg-gradient-to-r peer-checked:from-rose-400 peer-checked:to-rose-500' : 'bg-rose-100/60 peer-checked:bg-gradient-to-r peer-checked:from-rose-300 peer-checked:to-rose-400'}`}></div>
                </label>
              </div>
            </div>
          </div>

          {/* 数据管理 */}
          <div className={`glass rounded-3xl p-6 fade-in ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`} style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-5">
              <Download size={24} className={settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-500'} />
              <h2 className={`text-lg font-bold ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-700'}`}>数据管理</h2>
            </div>
            <div className="space-y-4">
              <button 
                onClick={handleExportTasks}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-rose-400 to-rose-500 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 btn-press hover:scale-[1.02]"
              >
                <Download size={20} />
                导出数据
              </button>
              <button 
                onClick={handleClearTasks}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 font-bold transition-all duration-300 btn-press ${settings.theme === 'dark' ? 'border-red-400/40 text-red-300 bg-gray-700/30 hover:bg-red-500/20' : 'border-red-200/60 text-red-400 bg-white/30 hover:bg-red-50/50'}`}
              >
                <Trash2 size={20} />
                清除所有任务
              </button>
            </div>
          </div>

          {/* 关于 */}
          <div className={`glass rounded-3xl p-6 fade-in ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`} style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 mb-5">
              <Info size={24} className={settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-500'} />
              <h2 className={`text-lg font-bold ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-700'}`}>关于</h2>
            </div>
            <div className="space-y-3">
              <p className={`font-medium ${settings.theme === 'dark' ? 'text-rose-300' : 'text-rose-600'}`}>日程管理应用</p>
              <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-400' : 'text-rose-400'}`}>版本 1.0.0</p>
              <p className={`text-sm mt-5 leading-relaxed ${settings.theme === 'dark' ? 'text-gray-400' : 'text-rose-400'}`}>一个采用极致毛玻璃拟态设计的优雅日程管理工具，帮助你更好地管理时间和任务。✨</p>
            </div>
          </div>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelClear}
        onConfirm={handleConfirmClear}
        title="清除所有任务"
        message="确定要清除所有任务吗？此操作不可恢复。"
      />

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

export default Settings;
