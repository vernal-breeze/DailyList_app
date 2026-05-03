import React from 'react';
import TaskCard from '../TaskCard';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';

interface TaskListProps {
  filter: 'all' | 'active' | 'completed';
}

const TaskList: React.FC<TaskListProps> = ({ filter }) => {
  const { tasks } = useTaskStore();
  const { settings } = useSettingsStore();

  // 根据筛选条件过滤任务
  let filteredTasks = tasks;
  if (filter === 'active') {
    filteredTasks = tasks.filter(task => !task.completed);
  } else if (filter === 'completed') {
    filteredTasks = tasks.filter(task => task.completed);
  }

  // 根据设置排序任务
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (settings.sortBy) {
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

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>{filter === 'active' ? '暂无未完成任务' : filter === 'completed' ? '暂无已完成任务' : '暂无任务'}</p>
        <p className="text-sm mt-1">点击右下角的 + 按钮添加新任务</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedTasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
};

export default TaskList;