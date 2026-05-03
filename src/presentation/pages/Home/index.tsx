import React, { useEffect, useMemo, useCallback, memo, useState } from 'react';
import { useTaskStore, getTodayTasks } from '../../../store/taskStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { Calendar, ListTodo, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import TaskForm from '../../../components/TaskForm';
import QuickAddTask from '../../../components/QuickAddTask';
import OperationFeedback from '../../../components/OperationFeedback';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import { Task } from '../../../types';
import useUndo from '../../../hooks/useUndo';
import { useNavigate } from 'react-router-dom';
import { getBeijingTime, formatBeijingTimeOnly } from '../../../utils/dateUtils';

const Home: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'undo'; onUndo?: () => void } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [, forceUpdate] = useState({});
  const { addTask, loadTasks, tasks, toggleTaskCompletion, deleteTask } = useTaskStore();
  const { loadSettings, settings } = useSettingsStore();
  const { undo: undoOperation } = useUndo();
  const navigate = useNavigate();

  // 每天更新一次，确保跨天时todayTasks能正确更新
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const delay = tomorrow.getTime() - now.getTime();
    
    const timer = setTimeout(() => {
      forceUpdate({});
    }, delay);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadTasks();
    loadSettings();
  }, [loadTasks, loadSettings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setShowQuickAdd(true);
      }
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        const success = undoOperation();
        if (success) {
          setFeedback({
            message: '操作已撤销',
            type: 'info'
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoOperation]);

  const handleAddTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'subtasks'>) => {
    addTask(task);
    setShowAddForm(false);
    setFeedback({
      message: '任务添加成功',
      type: 'success'
    });
  }, [addTask]);

  const handleCancel = useCallback(() => {
    setShowAddForm(false);
  }, []);

  const handleDelete = useCallback((taskId: string) => {
    // 显示删除确认弹窗
    setTaskToDelete(taskId);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (taskToDelete) {
      // 先保存要删除的任务，用于撤销
      const taskToDeleteData = tasks.find(t => t.id === taskToDelete);
      
      deleteTask(taskToDelete);
      setShowDeleteModal(false);
      setTaskToDelete(null);
      
      setFeedback({
        message: '任务已删除',
        type: 'undo',
        onUndo: () => {
          if (taskToDeleteData) {
            // 撤销删除，重新添加任务
            addTask(taskToDeleteData);
            setFeedback({
              message: '任务已恢复',
              type: 'success'
            });
          }
        }
      });
    }
  }, [taskToDelete, tasks, deleteTask, addTask]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  }, []);

  const today = useMemo(() => {
    const beijingTime = getBeijingTime();
    return beijingTime.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }, [forceUpdate]);

  const todayTasks = useMemo(() => {
    return getTodayTasks(tasks);
  }, [tasks, forceUpdate]);

  const stats = useMemo(() => {
    // 使用任务id作为唯一标识，避免标题冲突问题
    const taskMap = new Map<string, boolean>(); // id -> 是否完成
    
    tasks.forEach(task => {
      if (task.id) {
        // 直接使用id作为key，确保唯一性
        taskMap.set(task.id, task.completed);
      }
    });
    
    // 统计结果
    let total = 0;
    let completed = 0;
    
    taskMap.forEach((isCompleted) => {
      total++;
      if (isCompleted) {
        completed++;
      }
    });
    
    const todayTotal = todayTasks.length;
    const todayCompleted = todayTasks.filter(t => t.completed).length;
    // 计算今日任务的进度，而不是所有任务的进度
    const progress = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
    
    return { total, completed, todayTotal, todayCompleted, progress };
  }, [tasks, todayTasks]);



  return (
    <div className={`min-h-screen py-6 px-4 relative z-10 transition-colors duration-300 ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50'}`}>
      {/* 顶部导航栏 - 毛玻璃风格 */}
      <div className="sticky top-0 z-20 mb-6 -mx-4 px-4 pt-4">
        <div className={`glass rounded-3xl px-6 py-5 ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-700'}`}>今日任务</h1>
              <p className={`text-sm mt-1 ${settings.theme === 'dark' ? 'text-rose-300' : 'text-rose-400'}`}>专注当下，轻松完成</p>
            </div>
            <div className={`flex items-center gap-2 ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-500'}`}>
              <Calendar size={20} />
              <span className="text-sm font-medium">{today}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* 总任务统计 */}
        <div className={`glass-purple glass-hover rounded-3xl p-5 cursor-pointer fade-in ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`} style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={24} className="text-rose-400" />
          </div>
          <div className={`text-3xl font-bold mb-1 ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`}>{stats.total}</div>
          <div className={`text-xs font-medium ${settings.theme === 'dark' ? 'text-gray-400' : 'text-rose-400/70'}`}>总任务</div>
        </div>

        {/* 已完成统计 */}
        <div className={`glass-green glass-hover rounded-3xl p-5 cursor-pointer fade-in ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`} style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3">
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
          <div className={`text-3xl font-bold mb-1 ${settings.theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{stats.completed}</div>
          <div className={`text-xs font-medium ${settings.theme === 'dark' ? 'text-gray-400' : 'text-emerald-400/70'}`}>已完成</div>
        </div>

        {/* 今日任务 */}
        <div className={`glass-blue glass-hover rounded-3xl p-5 cursor-pointer fade-in ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`} style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-3">
            <Clock size={24} className="text-amber-500" />
          </div>
          <div className={`text-3xl font-bold mb-1 ${settings.theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>{stats.todayTotal}</div>
          <div className={`text-xs font-medium ${settings.theme === 'dark' ? 'text-gray-400' : 'text-amber-400/70'}`}>今日任务</div>
        </div>
      </div>

      {/* 进度条 */}
      <div className={`glass rounded-3xl p-5 mb-8 fade-in ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`} style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-semibold ${settings.theme === 'dark' ? 'text-rose-300' : 'text-rose-600'}`}>完成进度</span>
          <span className={`text-sm font-bold ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-500'}`}>{stats.progress}%</span>
        </div>
        <div className={`h-3 rounded-full overflow-hidden ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-white/40'}`}>
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${stats.progress}%`,
              background: 'linear-gradient(90deg, #fda4af 0%, #f9a8d4 50%, #f472b6 100%)'
            }}
          />
        </div>
      </div>

      {/* 今日任务列表 */}
      <div className="fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-700'}`}>今日清单</h2>
          <button 
            onClick={() => navigate('/schedule')}
            className={`flex items-center gap-2 font-medium transition-all duration-300 hover:scale-105 ${settings.theme === 'dark' ? 'text-rose-400 hover:text-rose-300' : 'text-rose-500 hover:text-rose-600'}`}
          >
            <ListTodo size={18} />
            <span className="text-sm">查看全部</span>
          </button>
        </div>

        {showAddForm ? (
          <div className={`glass rounded-3xl p-6 mb-6 ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`}>
            <h2 className={`text-lg font-bold mb-4 ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-700'}`}>添加新任务</h2>
            <TaskForm onSubmit={handleAddTask} onCancel={handleCancel} />
          </div>
        ) : todayTasks.length > 0 ? (
          <div className="space-y-4">
            {todayTasks.map((task, index) => (
              <div 
                key={task.id} 
                className={`glass-light glass-hover rounded-3xl p-5 ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`}
                style={{ animationDelay: `${0.6 + index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleTaskCompletion(task.id)}
                    className="flex-shrink-0 mt-0.5 btn-press"
                  >
                    {task.completed ? (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                        <CheckCircle2 size={18} className="text-white check-animation" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full border-2 border-rose-200 hover:border-rose-300 transition-all duration-300 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-rose-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-lg transition-all duration-300 ${
                      task.completed 
                        ? 'line-through text-gray-400' 
                        : (settings.theme === 'dark' ? 'text-rose-300' : 'text-rose-700')
                    }`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`text-sm mt-2 transition-all duration-300 ${
                        task.completed ? 'text-gray-400' : (settings.theme === 'dark' ? 'text-gray-300' : 'text-rose-400')
                      }`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <div className={`flex items-center text-xs px-3 py-1.5 rounded-full ${settings.theme === 'dark' ? 'text-gray-300 bg-gray-700/50' : 'text-rose-400 bg-white/40'}`}>
                        <Clock size={14} className="mr-1.5" />
                        <span>{new Date(task.dueDate).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className={`flex-shrink-0 transition-all duration-300 p-2 rounded-2xl btn-press ${settings.theme === 'dark' ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/20' : 'text-gray-300 hover:text-red-400 hover:bg-red-50/50'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`glass rounded-3xl p-10 text-center ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`}>
            <div className="mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width={64} 
                height={64} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={`mx-auto ${settings.theme === 'dark' ? 'text-rose-400/30' : 'text-rose-200'}`}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className={`text-lg font-bold mb-2 ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`}>今天还没有任务</p>
            <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-rose-400'}`}>点击日程页面开始添加新任务吧 ✨</p>
          </div>
        )}
      </div>

      {/* 快速添加任务弹窗 */}
      <QuickAddTask isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} />

      {/* 删除确认弹窗 */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

      {/* 操作反馈 */}
      {feedback && (
        <OperationFeedback
          message={feedback.message}
          type={feedback.type}
          onUndo={feedback.onUndo as (() => void) | undefined}
          onClose={() => setFeedback(null)}
        />
      )}
    </div>
  );
};

export default memo(Home);

