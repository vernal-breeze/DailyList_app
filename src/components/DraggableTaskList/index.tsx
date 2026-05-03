import React, { useState, useCallback } from 'react';
import DraggableTaskCard from '../DraggableTaskCard';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';

interface DraggableTaskListProps {
  filter: 'all' | 'active' | 'completed';
}

const DraggableTaskList: React.FC<DraggableTaskListProps> = ({ filter }) => {
  const { tasks, updateTask, toggleTaskCompleted, deleteTask } = useTaskStore();
  const { settings } = useSettingsStore();
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [isOver, setIsOver] = useState(false);

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



  const handleDragEnd = useCallback((_task: any, _x: number, _y: number) => {
    setDraggedTask(null);
    setIsOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  }, []);

  const handleDragLeave = useCallback((_e: React.DragEvent) => {
    setIsOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);

    if (draggedTask) {
      // 这里可以实现跨日期拖拽逻辑
      // 例如，根据放置位置更新任务的dueDate
      console.log('Task dropped:', draggedTask);
      
      // 示例：将任务移到明天
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      updateTask(draggedTask.id, {
        dueDate: tomorrow.toISOString()
      });
    }
  }, [draggedTask, updateTask]);

  const handleEdit = (task: any) => {
    // 这里可以实现编辑任务的逻辑
    console.log('Edit task:', task);
  };

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>{filter === 'active' ? '暂无未完成任务' : filter === 'completed' ? '暂无已完成任务' : '暂无任务'}</p>
        <p className="text-sm mt-1">点击右下角的 + 按钮添加新任务</p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`space-y-4 transition-all duration-300 ${isOver ? (isDark ? 'bg-rose-900/20 rounded-lg p-4' : 'bg-pink-50/50 rounded-lg p-4') : ''}`}
    >
      {sortedTasks.map((task) => (
        <DraggableTaskCard
          key={task.id}
          task={task}
          onToggleCompleted={(id) => toggleTaskCompleted(id)}
          onEdit={(task) => handleEdit(task)}
          onDelete={(id) => deleteTask(id)}
          onDragEnd={handleDragEnd}
        />
      ))}
      
      {isOver && draggedTask && (
        <div className={`rounded-[28px] p-6 border-2 border-dashed ${isDark ? 'bg-rose-900/20 border-rose-500/50' : 'bg-pink-100/50 border-pink-300'}`}>
          <p className={`text-center font-medium ${isDark ? 'text-rose-400' : 'text-pink-600'}`}>
            释放以移动任务
          </p>
        </div>
      )}
    </div>
  );
};

export default DraggableTaskList;