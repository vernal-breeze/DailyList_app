import React, { useMemo } from 'react';
import { useTaskStore, getWeekTasks } from '../../store/taskStore';
import { useViewStore } from '../../store/viewStore';
import { useSettingsStore } from '../../store/settingsStore';
import SwipeableTaskCard from '../SwipeableTaskCard';
import { getLocalDateStr } from '../../utils/recurrenceUtils';

const WeekView: React.FC = () => {
  const { tasks, toggleTaskCompleted, deleteTask } = useTaskStore();
  const { selectedDate } = useViewStore();
  const { settings } = useSettingsStore();
  const [swipeOpenTaskId, setSwipeOpenTaskId] = React.useState<string | null>(null);
  const isDark = settings.theme === 'dark';

  const handleSwipeOpen = React.useCallback((taskId: string) => {
    setSwipeOpenTaskId(prev => prev === taskId ? null : taskId);
  }, []);

  // 计算本周范围（周一起始，与 getWeekTasks 内部逻辑一致）
  const weekRange = useMemo(() => {
    const now = new Date(selectedDate);
    const day = now.getUTCDay();
    const dayOffset = day === 0 ? -6 : 1 - day;

    const weekStart = new Date(now);
    weekStart.setUTCDate(weekStart.getUTCDate() + dayOffset);
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    return { start: weekStart, end: weekEnd };
  }, [selectedDate]);

  // 获取本周任务实例
  const weekTasks = useMemo(() => {
    return getWeekTasks(tasks, new Date(selectedDate));
  }, [tasks, selectedDate]);

  // 生成 7 天的日期数组
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekRange.start.getTime());
      date.setUTCDate(weekRange.start.getUTCDate() + i);
      days.push(date);
    }
    return days;
  }, [weekRange.start]);

  // 获取某天的任务
  const getTasksForDay = (date: Date) => {
    const dateStr = getLocalDateStr(date);
    return weekTasks.filter(task => {
      const taskDateStr = getLocalDateStr(new Date(task.dueDate));
      return taskDateStr === dateStr;
    });
  };

  return (
    <div className={`${isDark ? 'bg-gray-800/80 border border-gray-700/50' : 'bg-white/80'} rounded-[28px] p-6 shadow-lg`}>
      <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-rose-300' : 'text-gray-700'}`}>本周任务</h3>

      <div className={`grid grid-cols-1 md:grid-cols-7 gap-4 mb-6`}>
        {weekDays.map((day, index) => {
          const dayTasks = getTasksForDay(day);
          const todayStr = getLocalDateStr(new Date());
          const dayStr = getLocalDateStr(day);
          const isToday = dayStr === todayStr;
          return (
            <div
              key={index}
              className={`rounded-lg p-4 transition-all duration-300 ${
                isToday
                  ? `${isDark ? 'bg-rose-900/40 border border-rose-700/50' : 'bg-pink-50 border border-pink-200'}`
                  : `${isDark ? 'bg-gray-800/40 border border-gray-700/30 hover:bg-gray-700/40' : 'bg-white border border-gray-100 hover:bg-gray-50'}`
              }`}
            >
              <div className="text-center mb-3">
                <div className={`text-sm font-medium ${isToday ? (isDark ? 'text-rose-300' : 'text-pink-700') : (isDark ? 'text-gray-400' : 'text-gray-700')}`}>
                  {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day.getUTCDay()]}
                </div>
                <div className={`text-lg font-bold mt-1 ${isToday ? (isDark ? 'text-rose-400' : 'text-pink-500') : (isDark ? 'text-gray-300' : 'text-gray-800')}`}>
                  {day.getUTCDate()}
                </div>
              </div>

              <div className="space-y-2">
                {dayTasks.length > 0 ? (
                  dayTasks.map((task) => (
                    <div key={task.id} className="text-xs">
                      <SwipeableTaskCard
                        task={task}
                        onToggleCompleted={toggleTaskCompleted}
                        onDelete={deleteTask}
                        onSwipeOpen={handleSwipeOpen}
                        isSwipeOpen={swipeOpenTaskId === task.id}
                      />
                    </div>
                  ))
                ) : (
                  <div className={`text-xs text-center py-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    无任务
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {weekTasks.length === 0 && (
        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>本周暂无任务</p>
          <p className="text-sm mt-1">点击右下角的 + 按钮添加新任务</p>
        </div>
      )}
    </div>
  );
};

export default WeekView;
