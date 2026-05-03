import React, { useState, useEffect, useRef } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';
import { X, Plus } from 'lucide-react';

interface QuickAddTaskProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickAddTask: React.FC<QuickAddTaskProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addTask } = useTaskStore();
  const { settings } = useSettingsStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = settings.theme === 'dark';

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 自然语言解析日期时间
  const parseNaturalLanguage = (text: string): { title: string; dueDate: Date } => {
    const now = new Date();
    let title = text;
    let dueDate = new Date(now);

    // 解析明天
    if (text.includes('明天') || text.includes('tomorrow')) {
      dueDate.setDate(now.getDate() + 1);
      title = title.replace(/明天|tomorrow/gi, '');
    }

    // 解析后天
    if (text.includes('后天') || text.includes('day after tomorrow')) {
      dueDate.setDate(now.getDate() + 2);
      title = title.replace(/后天|day after tomorrow/gi, '');
    }

    // 解析本周几
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDaysEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    weekDays.forEach((day, index) => {
      if (text.includes(day)) {
        const today = now.getDay();
        let daysToAdd = index - today;
        if (daysToAdd <= 0) daysToAdd += 7;
        dueDate.setDate(now.getDate() + daysToAdd);
        title = title.replace(day, '');
      }
    });

    weekDaysEn.forEach((day, index) => {
      if (text.toLowerCase().includes(day)) {
        const today = now.getDay();
        let daysToAdd = index - today;
        if (daysToAdd <= 0) daysToAdd += 7;
        dueDate.setDate(now.getDate() + daysToAdd);
        title = title.toLowerCase().replace(day, '');
      }
    });

    // 解析时间
    const timeRegex = /(\d{1,2}):(\d{2})\s*(am|pm)?/i;
    const timeMatch = text.match(timeRegex);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2]);
      const ampm = timeMatch[3]?.toLowerCase();

      if (ampm === 'pm' && hour < 12) {
        hour += 12;
      } else if (ampm === 'am' && hour === 12) {
        hour = 0;
      }

      dueDate.setHours(hour, minute, 0, 0);
      title = title.replace(timeRegex, '');
    }

    return { title: title.trim(), dueDate };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);

    try {
      const { title: parsedTitle, dueDate } = parseNaturalLanguage(title);
      
      const task = {
        title: parsedTitle,
        description: '',
        dueDate: dueDate.toISOString(),
        priority: 'medium' as const,
        completed: false,
        recurrence: {
          enabled: false,
          type: 'daily' as const,
          interval: 1,
          days: [],
          end: {
            type: 'never' as const
          },
          exceptions: []
        },
        startDate: dueDate.toISOString(),
        taskType: 'single' as const,
        reminderEnabled: false,
        notificationId: 0,
        completedDates: []
      };

      addTask(task);
      setTitle('');
      onClose();
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`rounded-[28px] p-8 max-w-md w-full mx-4 shadow-2xl ${isDark ? 'bg-gray-800 border border-gray-700/50' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Plus size={24} className="text-pink-400" />
            <h2 className={`text-2xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>快速添加任务</h2>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入任务标题，支持自然语言日期（如：明天下午3点开会）"
              className={`w-full px-6 py-4 rounded-[20px] border-2 transition-all duration-300 placeholder-gray-400 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 focus:border-pink-500 focus:ring-4 focus:ring-pink-900/30 text-gray-100'
                  : 'border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-100/50 text-gray-800'
              }`}
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-6 py-3 rounded-[20px] font-medium transition-all duration-300 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex-1 px-6 py-3 rounded-[20px] bg-gradient-to-r from-pink-400 to-orange-400 text-white font-medium hover:from-pink-500 hover:to-orange-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '添加中...' : '添加任务'}
            </button>
          </div>
        </form>
        
        <div className={`mt-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <p>支持的自然语言格式：</p>
          <p>• 明天开会</p>
          <p>• 周五下午3:30提交报告</p>
          <p>• 后天早上10点团队会议</p>
        </div>
      </div>
    </div>
  );
};

export default QuickAddTask;
