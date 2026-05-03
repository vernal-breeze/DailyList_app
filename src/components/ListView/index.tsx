import React, { useState } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';
import TaskCard from '../TaskCard';
import { Filter, SortDesc, Calendar, Flag } from 'lucide-react';

const ListView: React.FC = () => {
  const { tasks } = useTaskStore();
  const { settings } = useSettingsStore();
  const isDark = settings.theme === 'dark';
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [completedFilter, setCompletedFilter] = useState<'all' | 'completed' | 'active'>('all');

  // 筛选和排序任务
  const getFilteredAndSortedTasks = () => {
    let filteredTasks = [...tasks];

    // 按时间范围筛选
    if (filter !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      
      if (filter === 'today') {
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = new Date(task.dueDate);
          return taskDate >= startOfDay && taskDate <= endOfDay;
        });
      } else if (filter === 'week') {
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + 7);
        endOfWeek.setHours(23, 59, 59, 999);
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = new Date(task.dueDate);
          return taskDate >= startOfDay && taskDate <= endOfWeek;
        });
      } else if (filter === 'month') {
        const endOfMonth = new Date(now);
        endOfMonth.setMonth(now.getMonth() + 1);
        endOfMonth.setHours(23, 59, 59, 999);
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = new Date(task.dueDate);
          return taskDate >= startOfDay && taskDate <= endOfMonth;
        });
      }
    }

    // 按优先级筛选
    if (priorityFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
    }

    // 按完成状态筛选
    if (completedFilter !== 'all') {
      if (completedFilter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
      } else if (completedFilter === 'active') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
      }
    }

    // 排序
    filteredTasks.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filteredTasks;
  };

  const filteredTasks = getFilteredAndSortedTasks();

  return (
    <div className={`${isDark ? 'bg-gray-800/80 border border-gray-700/50' : 'bg-white/80'} rounded-[28px] p-6 shadow-lg`}>
      {/* 筛选和排序栏 */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* 时间范围筛选 */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
            className={`px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border border-gray-200'}`}
          >
            <option value="all">全部时间</option>
            <option value="today">今天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>
        </div>

        {/* 优先级筛选 */}
        <div className="flex items-center gap-2">
          <Flag size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'all' | 'low' | 'medium' | 'high')}
            className={`px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border border-gray-200'}`}
          >
            <option value="all">全部优先级</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>

        {/* 完成状态筛选 */}
        <div className="flex items-center gap-2">
          <Filter size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <select
            value={completedFilter}
            onChange={(e) => setCompletedFilter(e.target.value as 'all' | 'completed' | 'active')}
            className={`px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border border-gray-200'}`}
          >
            <option value="all">全部状态</option>
            <option value="active">未完成</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        {/* 排序 */}
        <div className="flex items-center gap-2 ml-auto">
          <SortDesc size={16} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'createdAt')}
            className={`px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border border-gray-200'}`}
          >
            <option value="dueDate">按提醒时间</option>
            <option value="priority">按优先级</option>
            <option value="createdAt">按创建时间</option>
          </select>
        </div>
      </div>

      {/* 任务列表 */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>暂无任务</p>
          <p className="text-sm mt-1">点击右下角的 + 按钮添加新任务</p>
        </div>
      )}
    </div>
  );
};

export default ListView;
