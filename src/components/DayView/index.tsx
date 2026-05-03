import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTaskStore, getTasksInRange } from '../../store/taskStore';
import { useViewStore } from '../../store/viewStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getLocalDateStr } from '../../utils/recurrenceUtils';

import TaskCard from '../TaskCard';

const DayView: React.FC = () => {
  const { tasks } = useTaskStore();
  const { selectedDate } = useViewStore();
  const { settings } = useSettingsStore();
  const [hours, setHours] = useState<number[]>([]);

  const timelineRef = useRef<HTMLDivElement>(null);
  const isDark = settings.theme === 'dark';

  useEffect(() => {
    const hourArray = Array.from({ length: 24 }, (_, i) => i);
    setHours(hourArray);
  }, []);

  useEffect(() => {
    const now = new Date();
    const currentHour = now.getUTCHours();
    if (timelineRef.current) {
      const hourElement = timelineRef.current.querySelector(`[data-hour="${currentHour}"]`);
      if (hourElement) {
        hourElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  // 使用 getTasksInRange 获取当天任务（UTC 范围）
  const dayTasks = useMemo(() => {
    const dateStr = getLocalDateStr(new Date(selectedDate));
    const dayStart = new Date(dateStr + 'T00:00:00.000Z');
    const dayEnd = new Date(dateStr + 'T23:59:59.999Z');
    return getTasksInRange(tasks, dayStart, dayEnd);
  }, [tasks, selectedDate]);

  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  return (
    <div className={`${isDark ? 'bg-gray-800/80 border border-gray-700/50' : 'bg-white/80'} rounded-[28px] p-6 shadow-lg`}>
      <div className="overflow-y-auto max-h-[80vh]" ref={timelineRef}>
        <div className="relative">
          <div
            className="absolute left-0 right-0 h-0.5 bg-red-400 z-10"
            style={{
              top: `${(currentHour * 60 + currentMinute) / 1440 * 100}%`
            }}
          />

          {hours.map((hour) => (
            <div
              key={hour}
              className={`relative h-24 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
              data-hour={hour}
            >
              <div className={`absolute left-0 top-0 w-16 h-full flex items-start justify-center pt-2 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {hour.toString().padStart(2, '0')}:00
              </div>

              <div className={`ml-16 h-full cursor-pointer ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                {dayTasks.filter(task => {
                  const taskHour = new Date(task.dueDate).getUTCHours();
                  return taskHour === hour;
                }).map((task) => (
                  <div
                    key={task.id}
                    className={`ml-2 mr-4 mt-1 p-3 rounded-lg border transition-all duration-300 ${isDark ? 'bg-rose-900/30 border-rose-800/40' : 'bg-pink-50 border-pink-100 hover:shadow-md'}`}
                  >
                    <TaskCard task={task} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DayView;
