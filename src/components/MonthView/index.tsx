import React, { useState, useEffect, useMemo } from 'react';
import { useTaskStore, getTasksInRange } from '../../store/taskStore';
import { useViewStore } from '../../store/viewStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getLocalDateStr } from '../../utils/recurrenceUtils';

const MonthView: React.FC = () => {
  const { tasks } = useTaskStore();
  const { selectedDate, navigateToDate, switchView } = useViewStore();
  const { settings } = useSettingsStore();
  const [calendarDays, setCalendarDays] = useState<{ date: Date; isCurrentMonth: boolean; isToday: boolean }[]>([]);
  const isDark = settings.theme === 'dark';

  useEffect(() => {
    const date = new Date(selectedDate);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();

    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const firstDayOfWeek = firstDay.getUTCDay();
    const daysInMonth = lastDay.getUTCDate();

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(Date.UTC(year, month, -i));
      days.push({ date: prevDate, isCurrentMonth: false, isToday: checkIsToday(prevDate) });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(Date.UTC(year, month, i));
      days.push({ date: currentDate, isCurrentMonth: true, isToday: checkIsToday(currentDate) });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(Date.UTC(year, month + 1, i));
      days.push({ date: nextDate, isCurrentMonth: false, isToday: checkIsToday(nextDate) });
    }

    setCalendarDays(days);
  }, [selectedDate]);

  const checkIsToday = (date: Date) => {
    return getLocalDateStr(date) === getLocalDateStr(new Date());
  };

  // 一次性生成整月的任务实例
  const monthTasks = useMemo(() => {
    const date = new Date(selectedDate);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const monthStart = new Date(Date.UTC(year, month, 1));
    const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    return getTasksInRange(tasks, monthStart, monthEnd);
  }, [tasks, selectedDate]);

  // 获取某天的任务（按日期字符串匹配）
  const getTasksForDay = (date: Date) => {
    const dateStr = getLocalDateStr(date);
    return monthTasks.filter(task => {
      const taskDateStr = getLocalDateStr(new Date(task.dueDate));
      return taskDateStr === dateStr;
    });
  };

  const handleDateClick = (date: Date) => {
    navigateToDate(date);
    switchView('day');
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className={`${isDark ? 'bg-gray-800/80 border border-gray-700/50' : 'bg-white/80'} rounded-[28px] p-6 shadow-lg`}>
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map((day, index) => (
          <div key={index} className={`text-center text-sm font-medium py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dayTasks = getTasksForDay(day.date);
          return (
            <div
              key={index}
              className={`h-24 rounded-lg p-2 transition-all duration-300 cursor-pointer ${
                day.isToday
                  ? (isDark ? 'bg-rose-900/50 border border-rose-700/50' : 'bg-pink-100 border border-pink-300')
                  : day.isCurrentMonth
                  ? (isDark ? 'bg-gray-800/40 hover:bg-gray-700/40 border border-gray-700/30' : 'bg-white hover:bg-gray-50 border border-gray-100')
                  : (isDark ? 'bg-gray-900/30 text-gray-500 border border-gray-800/30' : 'bg-gray-50 text-gray-400 border border-gray-100')
              }`}
              onClick={() => handleDateClick(day.date)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-medium ${
                  day.isToday ? (isDark ? 'text-rose-300' : 'text-pink-700')
                  : day.isCurrentMonth ? (isDark ? 'text-gray-300' : 'text-gray-800')
                  : (isDark ? 'text-gray-600' : 'text-gray-400')
                }`}>
                  {day.date.getUTCDate()}
                </span>
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={`text-xs p-1 rounded truncate ${
                      task.recurrence.enabled && task.recurrence.type === 'daily'
                        ? isDark ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700'
                        : isDark ? 'bg-rose-900/30 text-rose-300' : 'bg-pink-50 text-pink-700'
                    }`}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    +{dayTasks.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
