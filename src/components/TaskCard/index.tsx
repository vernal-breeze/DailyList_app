import React, { useState } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatBeijingTime, isTaskExpiring } from '../../utils/dateUtils';
import { CheckCircle2, Circle, Edit, Trash2, Clock, Flag, Repeat, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SubTaskItem from '../SubTaskItem';
import DeleteConfirmationModal from '../DeleteConfirmationModal';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    recurrence?: {
      enabled: boolean;
      type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
      days: number[];
    };
    subtasks: {
      id: string;
      title: string;
      completed: boolean;
      parentId: string;
      level: number;
      subtasks: any[];
    }[];
  };
  onDragStart?: (task: any, e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart, onDragEnd }) => {
  const { toggleTaskCompleted, deleteTask, addSubTask, updateSubTask, deleteSubTask, toggleSubTaskCompleted } = useTaskStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();
  const isDark = settings.theme === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddSubTask, setShowAddSubTask] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleToggleCompleted = () => {
    toggleTaskCompleted(task.id);
  };

  const handleEdit = () => {
    navigate(`/task/${task.id}`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    deleteTask(task.id);
    setShowDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleAddSubTask = () => {
    if (newSubTaskTitle.trim()) {
      addSubTask(task.id, null, newSubTaskTitle.trim());
      setNewSubTaskTitle('');
      setShowAddSubTask(false);
      setIsExpanded(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSubTask();
    } else if (e.key === 'Escape') {
      setShowAddSubTask(false);
      setNewSubTaskTitle('');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-amber-400';
      case 'low':
        return 'text-emerald-400';
      default:
        return 'text-gray-400';
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-400';
      case 'medium':
        return 'bg-amber-400';
      case 'low':
        return 'bg-emerald-400';
      default:
        return 'bg-gray-400';
    }
  };

  // 计算子任务完成进度
  const getSubTaskProgress = () => {
    const allSubTasks = getAllSubTasks(task.subtasks);
    if (allSubTasks.length === 0) return 0;
    const completedSubTasks = allSubTasks.filter(st => st.completed).length;
    return Math.round((completedSubTasks / allSubTasks.length) * 100);
  };

  // 递归获取所有子任务
  const getAllSubTasks = (subtasks: any[]): any[] => {
    return subtasks.reduce((acc, st) => {
      return [...acc, st, ...getAllSubTasks(st.subtasks)];
    }, [] as any[]);
  };

  // 处理拖拽事件
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(task, e);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  const progress = getSubTaskProgress();
  const allSubTasks = getAllSubTasks(task.subtasks);

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`rounded-[28px] p-6 mb-4 shadow-lg border card-hover backdrop-blur-sm transition-all duration-300 ${
          isDark
            ? 'bg-gray-800/90 border-gray-700/50 shadow-gray-900/50'
            : 'bg-white/90 border-white/50 shadow-pink-100/50'
        }`}
      >
        <div className="flex items-start gap-4">
          <button
            onClick={handleToggleCompleted}
            className="flex-shrink-0 mt-1"
          >
            {task.completed ? (
              <CheckCircle2 size={32} className="text-emerald-400 check-animation" />
            ) : (
              <Circle size={32} className={`${isDark ? 'text-gray-600 hover:text-rose-500' : 'text-gray-200 hover:text-pink-300'} transition-colors`} />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getPriorityDot(task.priority)}`} />
                <h3 className={`text-lg font-semibold ${task.completed ? `line-through ${isDark ? 'text-gray-600' : 'text-gray-400'}` : (isDark ? 'text-gray-100' : 'text-gray-800')} transition-all duration-300`}>
                  {task.title}
                </h3>
                {task.recurrence?.enabled && (
                  <span className={`flex items-center text-xs px-2 py-0.5 rounded-full ${isDark ? 'text-rose-400 bg-rose-900/40' : 'text-pink-500 bg-pink-50'}`}>
                    <Repeat size={12} className="mr-1" />
                    {task.recurrence.type === 'daily' ? '每天' : 
                     task.recurrence.type === 'weekly' ? '每周' : 
                     task.recurrence.type === 'monthly' ? '每月' : 
                     task.recurrence.type === 'yearly' ? '每年' : '自定义'}
                  </span>
                )}
              </div>
              {isTaskExpiring(task) && !task.completed && (
                <span className="ml-2 px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-xs font-medium rounded-full">
                  即将到期
                </span>
              )}
            </div>
            
            {task.description && (
              <p className={`text-sm ${task.completed ? (isDark ? 'text-gray-600' : 'text-gray-300') : (isDark ? 'text-gray-400' : 'text-gray-500')} transition-all duration-300 mb-4 line-clamp-2`}>
                {task.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className={`flex items-center text-xs px-3 py-1.5 rounded-full ${isDark ? 'text-gray-300 bg-gray-700/50' : 'text-gray-400 bg-gray-50'}`}>
                <Clock size={14} className="mr-1.5" />
                <span>{formatBeijingTime(new Date(task.dueDate))}</span>
              </div>
              <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-pink-50 to-orange-50 ${getPriorityColor(task.priority)}`}>
                <Flag size={14} className="mr-1.5" />
                <span>
                  {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                </span>
              </div>
            </div>

            {/* 子任务部分 */}
            {allSubTasks.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className={`flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>子任务</span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({allSubTasks.filter(st => st.completed).length}/{allSubTasks.length})</span>
                  </div>
                  <div className={`w-24 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div 
                      className="h-full bg-gradient-to-r from-pink-400 to-orange-400 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="ml-4 mt-2">
                    {task.subtasks.map((subTask) => (
                      <SubTaskItem
                        key={subTask.id}
                        subTask={subTask}
                        taskId={task.id}
                        onToggleCompleted={toggleSubTaskCompleted}
                        onAddSubTask={addSubTask}
                        onUpdateSubTask={updateSubTask}
                        onDeleteSubTask={deleteSubTask}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 添加子任务按钮 */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowAddSubTask(!showAddSubTask)}
                className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 transition-colors"
              >
                <Plus size={16} />
                <span>添加子任务</span>
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className={`transition-all duration-300 p-2 rounded-full ${isDark ? 'text-gray-600 hover:text-red-400 hover:bg-red-500/20' : 'text-gray-300 hover:text-red-400 hover:bg-red-50'}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            {showAddSubTask && (
              <div className="flex items-center gap-2 w-full mt-3">
                <input
                  type="text"
                  value={newSubTaskTitle}
                  onChange={(e) => setNewSubTaskTitle(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="输入子任务..."
                  className={`flex-1 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'border border-gray-300'}`}
                  autoFocus
                />
                <button
                  onClick={handleAddSubTask}
                  className="px-3 py-2 bg-pink-400 text-white rounded-md text-sm hover:bg-pink-500 transition-colors"
                >
                  添加
                </button>
                <button
                  onClick={() => setShowAddSubTask(false)}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 ml-2">
            <button
              onClick={handleEdit}
              className={`transition-all duration-300 p-2 rounded-full ${isDark ? 'text-gray-600 hover:text-rose-400 hover:bg-rose-500/20' : 'text-gray-300 hover:text-pink-400 hover:bg-pink-50'}`}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={handleDelete}
              className={`transition-all duration-300 p-2 rounded-full ${isDark ? 'text-gray-600 hover:text-red-400 hover:bg-red-500/20' : 'text-gray-300 hover:text-red-400 hover:bg-red-50'}`}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* 删除确认弹窗 */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default TaskCard;
