import React, { useState, useEffect } from 'react';
import { Task } from '../../types';
import { Calendar, Flag, Repeat, Bell } from 'lucide-react';
import RecurrenceSettings from '../RecurrenceSettings';
import DeleteConfirmationModal from '../DeleteConfirmationModal';
import { formatBeijingTime, isBeijingPast, getBeijingTime, getBeijingDateParts } from '../../utils/dateUtils';
import { getLocalDateStr } from '../../utils/recurrenceUtils';

interface TaskFormProps {
  task?: Task;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onSubmit, onCancel }) => {
  // 获取默认时间（只包含时和分）
  const getDefaultTime = (): string => {
    if (task?.dueDate) {
      const date = new Date(task.dueDate);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    
    // 使用当天的精确时间作为默认值
    const now = getBeijingTime();
    const parts = getBeijingDateParts(now);
    
    // 格式化为 HH:mm
    const hours = String(parts.hours).padStart(2, '0');
    const minutes = String(parts.minutes).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  };
  
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [time, setTime] = useState<string>(getDefaultTime());
  const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'medium');
  const [taskType, setTaskType] = useState<'single' | 'recurring'>(task?.taskType || 'single');
  const [date, setDate] = useState<string>(task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : getBeijingTime().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState<string>(task?.startDate || getBeijingTime().toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState<Task['recurrence']>(task?.recurrence || {
    enabled: false,
    type: 'daily',
    interval: 1,
    days: [],
    end: {
      type: 'never'
    },
    exceptions: []
  });
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(task?.reminderEnabled || false);
  const [showRecurrenceSettings, setShowRecurrenceSettings] = useState(false);
  // 表单验证错误状态
  const [validationError, setValidationError] = useState<string | null>(null);
  // 每日重复任务确认弹窗状态
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 计算完整的 dueDate
  const getDueDate = (): string => {
    const [hours, minutes] = time.split(':').map(Number);
    
    let baseDate;
    if (taskType === 'single') {
      // 单次任务：使用选择的日期
      baseDate = new Date(date);
    } else {
      // 重复任务：使用开始日期
      baseDate = new Date(startDate);
    }
    
    baseDate.setHours(hours, minutes, 0, 0);
    
    return baseDate.toISOString();
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      
      // 从 task.dueDate 中提取时间部分
      const taskDate = new Date(task.dueDate);
      const hours = String(taskDate.getHours()).padStart(2, '0');
      const minutes = String(taskDate.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
      
      setPriority(task.priority);
      setTaskType(task.taskType || 'single');
      setDate(new Date(task.dueDate).toISOString().split('T')[0]);
      
      // 确保例外日期格式一致
      const formattedRecurrence = {
        ...task.recurrence,
        exceptions: task.recurrence.exceptions.map((dateStr) => {
          const date = new Date(dateStr);
          return getLocalDateStr(date);
        })
      };
      setRecurrence(formattedRecurrence);
      
      setStartDate(task.startDate || getBeijingTime().toISOString().split('T')[0]);
      setReminderEnabled(task.reminderEnabled || false);
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 清除之前的验证错误
    setValidationError(null);
    
    if (!title.trim()) {
      setValidationError('请输入任务标题');
      return;
    }

    if (!time) {
      setValidationError('请设置提醒时间');
      return;
    }

    const dueDate = getDueDate();
    
    // 时间合法性校验（基于北京时间） - 仅提示，不强校验
    const selectedDate = new Date(dueDate);
    if (isBeijingPast(selectedDate)) {
      // 不再强制确认，允许设置过去的时间
      console.log('您设置的时间是过去的时间');
    }

    // 每日重复任务强校验
    if (recurrence.enabled && recurrence.type === 'daily') {
      if (recurrence.interval !== 1) {
        setValidationError('每日重复任务的间隔必须为1天');
        return;
      }
      
      // 显示确认弹窗
      setShowConfirmModal(true);
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      priority,
      completed: task?.completed || false,
      startDate: taskType === 'recurring' ? startDate : dueDate,
      taskType,
      recurrence: taskType === 'recurring' ? recurrence : {
        enabled: false,
        type: 'daily',
        interval: 1,
        days: [],
        end: {
          type: 'never'
        },
        exceptions: []
      },
      reminderEnabled,
      notificationId: task?.notificationId || 0,
      completedDates: task?.completedDates || [],
      subtasks: task?.subtasks || []
    });
  };

  // 确认创建每日重复任务
  const handleConfirmRecurring = () => {
    const dueDate = getDueDate();
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      priority,
      completed: task?.completed || false,
      startDate: taskType === 'recurring' ? startDate : dueDate,
      taskType,
      recurrence: taskType === 'recurring' ? recurrence : {
        enabled: false,
        type: 'daily',
        interval: 1,
        days: [],
        end: {
          type: 'never'
        },
        exceptions: []
      },
      reminderEnabled,
      notificationId: task?.notificationId || 0,
      completedDates: task?.completedDates || [],
      subtasks: task?.subtasks || []
    });
    setShowConfirmModal(false);
  };

  // 取消创建每日重复任务
  const handleCancelRecurring = () => {
    setShowConfirmModal(false);
  };

  const handleUpdateRecurrence = (updatedRecurrence: Task['recurrence']) => {
    setRecurrence(updatedRecurrence);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 表单验证错误提示 */}
      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[20px]">
          <p className="text-sm text-red-600 font-medium">{validationError}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">任务标题</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入任务标题"
          className="w-full px-4 py-3 rounded-[20px] border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-100/50 transition-all duration-300 text-gray-800 placeholder-gray-400"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">任务描述</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="输入任务描述"
          rows={3}
          className="w-full px-4 py-3 rounded-[20px] border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-100/50 transition-all duration-300 text-gray-800 placeholder-gray-400 resize-none"
        />
      </div>

      {/* 任务类型选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">任务类型</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setTaskType('single')}
            className={`flex-1 px-4 py-2 rounded-[20px] font-medium transition-all duration-300 ${
              taskType === 'single'
                ? 'bg-pink-100 text-pink-700 border-2 border-pink-200'
                : 'bg-gray-100 text-gray-600 border-2 border-gray-100 hover:bg-gray-200'
            }`}
          >
            单次任务
          </button>
          <button
            type="button"
            onClick={() => setTaskType('recurring')}
            className={`flex-1 px-4 py-2 rounded-[20px] font-medium transition-all duration-300 ${
              taskType === 'recurring'
                ? 'bg-pink-100 text-pink-700 border-2 border-pink-200'
                : 'bg-gray-100 text-gray-600 border-2 border-gray-100 hover:bg-gray-200'
            }`}
          >
            重复任务
          </button>
        </div>
      </div>

      {/* 日期选择 */}
      {taskType === 'single' && (
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-1.5">
              <Calendar size={16} />
              <span>日期</span>
            </div>
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-[20px] border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-100/50 transition-all duration-300 text-gray-800"
          />
        </div>
      )}

      <div>
        <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-1.5">
            <Calendar size={16} />
            <span>提醒时间</span>
          </div>
        </label>
        <input
          type="time"
          id="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full px-4 py-3 rounded-[20px] border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-100/50 transition-all duration-300 text-gray-800"
        />
      </div>

      {/* 提醒开关 */}
      <div>
        <label className="flex items-center justify-between block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-1.5">
            <Bell size={16} />
            <span>开启提醒</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={reminderEnabled}
              onChange={() => setReminderEnabled(!reminderEnabled)}
            />
            <div className="w-12 h-7 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:shadow-md after:transition-all peer-checked:bg-pink-500"></div>
          </label>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-1.5">
            <Flag size={16} />
            <span>优先级</span>
          </div>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPriority('low')}
            className={`flex-1 px-4 py-2 rounded-[20px] font-medium transition-all duration-300 ${
              priority === 'low'
                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
                : 'bg-gray-100 text-gray-600 border-2 border-gray-100 hover:bg-gray-200'
            }`}
          >
            低
          </button>
          <button
            type="button"
            onClick={() => setPriority('medium')}
            className={`flex-1 px-4 py-2 rounded-[20px] font-medium transition-all duration-300 ${
              priority === 'medium'
                ? 'bg-amber-100 text-amber-700 border-2 border-amber-200'
                : 'bg-gray-100 text-gray-600 border-2 border-gray-100 hover:bg-gray-200'
            }`}
          >
            中
          </button>
          <button
            type="button"
            onClick={() => setPriority('high')}
            className={`flex-1 px-4 py-2 rounded-[20px] font-medium transition-all duration-300 ${
              priority === 'high'
                ? 'bg-red-100 text-red-700 border-2 border-red-200'
                : 'bg-gray-100 text-gray-600 border-2 border-gray-100 hover:bg-gray-200'
            }`}
          >
            高
          </button>
        </div>
      </div>

      {/* 重复设置只在任务类型为 recurring 时显示 */}
      {taskType === 'recurring' && (
        <div>
          <button
            type="button"
            onClick={() => setShowRecurrenceSettings(!showRecurrenceSettings)}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-[20px] bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all duration-300"
          >
            <Repeat size={18} />
            <span>重复设置</span>
            {recurrence.enabled && (
              <span className="ml-auto px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                已启用
              </span>
            )}
          </button>
          {/* 例外日期提示 */}
          {recurrence.enabled && recurrence.exceptions.length > 0 && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-[20px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <span className="text-sm text-yellow-700 font-medium">已设置 {recurrence.exceptions.length} 个例外日期</span>
              </div>
            </div>
          )}
        </div>
      )}

      {taskType === 'recurring' && showRecurrenceSettings && (
        <div className="mt-4">
          <RecurrenceSettings
            recurrence={recurrence}
            onUpdateRecurrence={handleUpdateRecurrence}
            onCancel={() => setShowRecurrenceSettings(false)}
            onSave={() => setShowRecurrenceSettings(false)}
          />
        </div>
      )}

      {taskType === 'recurring' && recurrence.enabled && (
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-1.5">
              <Calendar size={16} />
              <span>开始日期</span>
            </div>
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3 rounded-[20px] border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-100/50 transition-all duration-300 text-gray-800"
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 rounded-[20px] bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-all duration-300"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-3 rounded-[20px] bg-gradient-to-r from-pink-400 to-orange-400 text-white font-medium hover:from-pink-500 hover:to-orange-500 transition-all duration-300"
        >
          {task ? '更新任务' : '添加任务'}
        </button>
      </div>

      {/* 每日重复任务确认弹窗 */}
      <DeleteConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelRecurring}
        onConfirm={handleConfirmRecurring}
        title="确认创建每日重复任务"
        message={`任务名称：${title.trim()}\n每日提醒时间：${time}\n重复周期：每天\n结束日期：${recurrence.end.type === 'never' ? '无' : recurrence.end.type === 'on' ? formatBeijingTime(new Date(recurrence.end.date || 0)) : `重复${recurrence.end.count || 0}次后`}`}
      />
    </form>
  );
};

export default TaskForm;
