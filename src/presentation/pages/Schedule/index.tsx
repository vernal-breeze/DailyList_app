import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTaskStore } from '../../../store/taskStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { useViewStore } from '../../../store/viewStore';
import TaskForm from '../../../components/TaskForm';
import QuickAddTask from '../../../components/QuickAddTask';
import OperationFeedback from '../../../components/OperationFeedback';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import ViewSwitcher from '../../../components/ViewSwitcher';
import DayView from '../../../components/DayView';
import WeekView from '../../../components/WeekView';
import MonthView from '../../../components/MonthView';
import { Plus, Calendar, CheckCircle2, Clock, RotateCw, Edit3, Trash2 } from 'lucide-react';
import { getTodayTasks as utilGetTodayTasks, generateTaskInstances } from '../../../utils/recurrenceUtils';
import { Task } from '../../../types';
import useUndo from '../../../hooks/useUndo';

/** 将 task.dueDate 转成 YYYY-MM-DD */
function toDateStr(d: string | Date): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/** 今日 YYYY-MM-DD */
function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const Schedule: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'undo'; onUndo?: () => void } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { addTask, updateTask, loadTasks, tasks, toggleTaskCompletion, deleteTask } = useTaskStore();
  const { loadSettings, settings } = useSettingsStore();
  const { currentView } = useViewStore();
  const { undo: undoOperation } = useUndo();
  const scheduleRef = useRef<HTMLDivElement>(null);

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
          setFeedback({ message: '操作已撤销', type: 'info' });
        }
      }
      if (e.ctrlKey && !e.shiftKey) {
        switch (e.key) {
          case '1': e.preventDefault(); useViewStore.getState().switchView('day'); break;
          case '2': e.preventDefault(); useViewStore.getState().switchView('week'); break;
          case '3': e.preventDefault(); useViewStore.getState().switchView('month'); break;
          case '4': e.preventDefault(); useViewStore.getState().switchView('schedule'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoOperation]);

  const handleAddTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'subtasks'>) => {
    addTask(task);
    setShowAddForm(false);
    setFeedback({ message: '任务添加成功', type: 'success' });
  }, [addTask]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
  }, []);

  const handleUpdateTask = useCallback((updates: Omit<Task, 'id' | 'createdAt' | 'subtasks'>) => {
    if (editingTask) {
      updateTask(editingTask.id, updates as Partial<Task>);
      setEditingTask(null);
      setFeedback({ message: '任务已更新', type: 'success' });
    }
  }, [editingTask, updateTask]);

  const handleCancelEdit = useCallback(() => {
    setEditingTask(null);
  }, []);

  const handleCancel = useCallback(() => {
    setShowAddForm(false);
  }, []);

  const handleDelete = useCallback((taskId: string) => {
    setTaskToDelete(taskId);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (taskToDelete) {
      const taskToDeleteData = tasks.find(t => t.id === taskToDelete);
      deleteTask(taskToDelete);
      setShowDeleteModal(false);
      setTaskToDelete(null);
      setFeedback({
        message: '任务已删除',
        type: 'undo',
        onUndo: () => {
          if (taskToDeleteData) {
            addTask(taskToDeleteData);
            setFeedback({ message: '任务已恢复', type: 'success' });
          }
        }
      });
    }
  }, [taskToDelete, tasks, deleteTask, addTask]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  }, []);

  // ---- 任务分类逻辑 ----

  const today = todayStr();

  /** 用统一的 recurrenceUtils 获取今天的全部任务实例 */
  const allTodayTasks = useMemo(() => utilGetTodayTasks(tasks), [tasks]);

  /** 今天的重复任务实例（由 generateTaskInstances 展开） */
  const todayRecurringTasks = useMemo(() =>
    allTodayTasks.filter(t => t.taskType === 'recurring'),
    [allTodayTasks]
  );

  /** 今天的单次任务 */
  const todaySingleTasks = useMemo(() =>
    allTodayTasks.filter(t => t.taskType === 'single'),
    [allTodayTasks]
  );

  /** 未来日期的单次任务（按日期分组） */
  const futureSingleTasks = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    tasks.forEach(t => {
      if (t.taskType !== 'single') return;
      const ds = toDateStr(t.dueDate);
      if (ds <= today) return;
      if (!grouped.has(ds)) grouped.set(ds, []);
      grouped.get(ds)!.push(t);
    });
    return grouped;
  }, [tasks, today]);

  /** 历史上的单次任务（已过期） */
  const pastSingleTasks = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    tasks.forEach(t => {
      if (t.taskType !== 'single') return;
      const ds = toDateStr(t.dueDate);
      if (ds >= today) return;
      if (!grouped.has(ds)) grouped.set(ds, []);
      grouped.get(ds)!.push(t);
    });
    return grouped;
  }, [tasks, today]);

  // ---- 任务卡片子组件 ----

  const TaskCard: React.FC<{ task: Task; showDate?: boolean }> = ({ task, showDate }) => {
    const isRecurring = task.taskType === 'recurring';
    return (
      <div
        className={`glass-light glass-hover rounded-3xl p-4 fade-in border-l-4 cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
          task.completed ? 'border-l-emerald-400/60' : 'border-l-rose-400/60'
        } ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : 'bg-white/80'}`}
        onClick={() => handleEditTask(task)}
      >
        <div className="flex items-start gap-3">
          {/* 完成切换 */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleTaskCompletion(task.id); }}
            className="flex-shrink-0 mt-0.5 btn-press"
          >
            {task.completed ? (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow">
                <CheckCircle2 size={14} className="text-white check-animation" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-rose-200 hover:border-rose-300 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-100 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </button>

          {/* 标题 + 描述 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold transition-all duration-300 truncate ${
                task.completed
                  ? 'line-through text-gray-400'
                  : (settings.theme === 'dark' ? 'text-rose-300' : 'text-rose-700')
              }`}>
                {task.title}
              </h3>
              {isRecurring && (
                <RotateCw size={14} className={`flex-shrink-0 ${settings.theme === 'dark' ? 'text-violet-400' : 'text-violet-500'}`} />
              )}
              {task.priority === 'high' && !task.completed && (
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-400" />
              )}
            </div>
            {task.description && (
              <p className={`text-sm mt-1 line-clamp-2 ${task.completed ? 'text-gray-400' : (settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500')}`}>
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {showDate && (
                <div className={`flex items-center text-xs px-2 py-1 rounded-full ${settings.theme === 'dark' ? 'text-gray-400 bg-gray-700/50' : 'text-rose-400 bg-white/40'}`}>
                  <Calendar size={12} className="mr-1" />
                  <span>{new Date(task.dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                </div>
              )}
              <div className={`flex items-center text-xs px-2 py-1 rounded-full ${settings.theme === 'dark' ? 'text-gray-400 bg-gray-700/50' : 'text-rose-400 bg-white/40'}`}>
                <Clock size={12} className="mr-1" />
                <span>{new Date(task.dueDate).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                className={`ml-auto p-1 rounded-xl transition-colors ${settings.theme === 'dark' ? 'text-gray-500 hover:text-red-400' : 'text-gray-300 hover:text-red-400'}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* 编辑图标 */}
          <Edit3 size={16} className={`flex-shrink-0 mt-1 opacity-40 group-hover:opacity-100 transition-opacity ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-500'}`} />
        </div>
      </div>
    );
  };

  // ---- 渲染日程视图 ----

  const renderScheduleView = () => {
    // 按日期分组渲染
    const sections: { label: string; tasks: Task[]; emptyText?: string }[] = [];

    // 1. 今日重复任务
    if (todayRecurringTasks.length > 0) {
      sections.push({ label: '🔄 每日任务', tasks: todayRecurringTasks });
    }

    // 2. 今日一次性任务
    if (todaySingleTasks.length > 0) {
      sections.push({ label: '📋 今日待办', tasks: todaySingleTasks });
    }

    // 3. 未来单次任务（按日期）
    const futureKeys = [...futureSingleTasks.keys()].sort();
    for (const dateStr of futureKeys) {
      const displayDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-CN', {
        weekday: 'long', month: 'long', day: 'numeric'
      });
      sections.push({ label: `📅 ${displayDate}`, tasks: futureSingleTasks.get(dateStr)! });
    }

    // 4. 已过期的单次任务
    const pastKeys = [...pastSingleTasks.keys()].sort();
    if (pastKeys.length > 0) {
      for (const dateStr of pastKeys) {
        sections.push({
          label: `⏰ 过期 · ${dateStr}`,
          tasks: pastSingleTasks.get(dateStr)!
        });
      }
    }

    if (sections.length === 0) {
      return (
        <div className={`glass rounded-3xl p-10 text-center fade-in ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`}>
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width={64} height={64} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
              className={`mx-auto ${settings.theme === 'dark' ? 'text-rose-400/30' : 'text-rose-200'}`}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className={`text-lg font-bold mb-2 ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`}>今天没有任务</p>
          <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-rose-400'}`}>点击右下角按钮添加新任务吧 ✨</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="fade-in" style={{ animationDelay: `${sIdx * 0.1}s` }}>
            <h3 className={`text-sm font-bold mb-3 px-1 ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`}>
              {section.label}
              <span className={`ml-2 text-xs font-normal ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
                ({section.tasks.length}项)
              </span>
            </h3>
            <div className="space-y-2">
              {section.tasks.map((task, tIdx) => (
                <TaskCard key={task.id} task={task} showDate={!todaySingleTasks.includes(task) && !todayRecurringTasks.includes(task)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCurrentView = useCallback(() => {
    switch (currentView) {
      case 'day': return <DayView />;
      case 'week': return <WeekView />;
      case 'month': return <MonthView />;
      case 'schedule': return renderScheduleView();
      default: return <WeekView />;
    }
  }, [currentView, tasks, todayRecurringTasks, todaySingleTasks, futureSingleTasks, pastSingleTasks]);

  return (
    <div
      ref={scheduleRef}
      className={`min-h-screen py-6 px-4 relative z-10 transition-colors duration-300 ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50'}`}
    >
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-20 mb-6 -mx-4 px-4 pt-4">
        <div className={`glass rounded-3xl px-6 py-5 ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-700'}`}>我的日程</h1>
              <p className={`text-sm mt-1 ${settings.theme === 'dark' ? 'text-rose-300' : 'text-rose-400'}`}>规划时间，掌控生活</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto">
        <div className="mb-6 fade-in" style={{ animationDelay: '0.1s' }}>
          <ViewSwitcher />
        </div>

        {showAddForm ? (
          <div className={`glass rounded-3xl p-6 mb-6 fade-in ${settings.theme === 'dark' ? 'bg-gray-800/80 border border-gray-700/50' : ''}`} style={{ animationDelay: '0.2s' }}>
            <h2 className={`text-lg font-bold mb-4 ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-700'}`}>添加新任务</h2>
            <TaskForm onSubmit={handleAddTask} onCancel={handleCancel} />
          </div>
        ) : (
          <div className="fade-in" style={{ animationDelay: '0.2s' }}>
            {renderCurrentView()}
          </div>
        )}

        <button
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-36 right-6 z-30 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center btn-press btn-glow transition-all duration-300 hover:scale-110"
          style={{ background: 'linear-gradient(135deg, #fda4af 0%, #f9a8d4 50%, #f472b6 100%)' }}
        >
          <Plus size={28} className="text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* 编辑弹窗 */}
      {editingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={handleCancelEdit}
        >
          <div
            className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl ${settings.theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'} fade-in`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={`text-lg font-bold mb-4 ${settings.theme === 'dark' ? 'text-rose-400' : 'text-rose-700'}`}>
              编辑任务
            </h2>
            <TaskForm
              task={editingTask}
              onSubmit={handleUpdateTask}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}

      <QuickAddTask isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

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

export default Schedule;
