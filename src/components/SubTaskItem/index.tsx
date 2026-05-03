import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';
import { SubTask } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import DeleteConfirmationModal from '../DeleteConfirmationModal';

interface SubTaskItemProps {
  subTask: SubTask;
  taskId: string;
  onToggleCompleted: (taskId: string, subTaskId: string) => void;
  onAddSubTask: (taskId: string, parentSubTaskId: string | null, title: string) => void;
  onUpdateSubTask: (taskId: string, subTaskId: string, updates: Partial<SubTask>) => void;
  onDeleteSubTask: (taskId: string, subTaskId: string) => void;
}

const SubTaskItem: React.FC<SubTaskItemProps> = ({
  subTask,
  taskId,
  onToggleCompleted,
  onAddSubTask,
  onUpdateSubTask,
  onDeleteSubTask
}) => {
  const { settings } = useSettingsStore();
  const isDark = settings.theme === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subTask.title);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleToggleCompleted = () => {
    onToggleCompleted(taskId, subTask.id);
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onUpdateSubTask(taskId, subTask.id, { title: editTitle.trim() });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(subTask.title);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    onDeleteSubTask(taskId, subTask.id);
    setShowDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleAddSubTask = () => {
    if (newSubTaskTitle.trim()) {
      onAddSubTask(taskId, subTask.id, newSubTaskTitle.trim());
      setNewSubTaskTitle('');
      setShowAddForm(false);
      setIsExpanded(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isEditing) {
        handleSaveEdit();
      } else if (showAddForm) {
        handleAddSubTask();
      }
    } else if (e.key === 'Escape') {
      if (isEditing) {
        handleCancelEdit();
      } else if (showAddForm) {
        setShowAddForm(false);
        setNewSubTaskTitle('');
      }
    }
  };

  const indentStyle = {
    marginLeft: `${subTask.level * 16}px`
  } as React.CSSProperties;

  return (
    <div className="w-full">
      <div 
        className="flex items-center gap-2 py-2 group"
        style={indentStyle}
      >
        {/* 展开/收起按钮 */}
        {subTask.subtasks.length > 0 && (
          <button
            onClick={handleToggleExpanded}
            className={`flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        {subTask.subtasks.length === 0 && (
          <div className="w-5 h-5 flex-shrink-0" />
        )}

        {/* 完成状态 */}
        <button
          onClick={handleToggleCompleted}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center"
        >
          {subTask.completed ? (
            <CheckCircle2 size={18} className="text-emerald-400" />
          ) : (
            <Circle size={18} className={`${isDark ? 'text-gray-600 hover:text-gray-500' : 'text-gray-300 hover:text-gray-400'} transition-colors`} />
          )}
        </button>

        {/* 子任务标题 */}
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleSaveEdit}
            className={`flex-1 px-2 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border border-gray-300'}`}
            autoFocus
          />
        ) : (
          <span className={`flex-1 text-sm ${subTask.completed ? 'line-through text-gray-400' : (isDark ? 'text-gray-300' : 'text-gray-700')}`}>
            {subTask.title}
          </span>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="p-1 text-green-500 hover:text-green-600 transition-colors"
              >
                <CheckCircle2 size={16} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-gray-500 hover:text-gray-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={handleEdit}
                className="p-1 text-gray-500 hover:text-gray-600 transition-colors"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-red-500 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 添加子任务表单 */}
      {showAddForm && (
        <div 
          className="flex items-center gap-2 py-2 ml-10"
          style={indentStyle}
        >
          <input
            type="text"
            value={newSubTaskTitle}
            onChange={(e) => setNewSubTaskTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="添加子任务..."
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
            onClick={() => setShowAddForm(false)}
            className={`px-3 py-2 rounded-md text-sm transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            取消
          </button>
        </div>
      )}

      {/* 子任务列表 */}
      {isExpanded && subTask.subtasks.length > 0 && (
        <div className="ml-4">
          {subTask.subtasks.map((childSubTask) => (
            <SubTaskItem
              key={childSubTask.id}
              subTask={childSubTask}
              taskId={taskId}
              onToggleCompleted={onToggleCompleted}
              onAddSubTask={onAddSubTask}
              onUpdateSubTask={onUpdateSubTask}
              onDeleteSubTask={onDeleteSubTask}
            />
          ))}
        </div>
      )}

      {/* 删除确认弹窗 */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="删除子任务"
        message="确定要删除这个子任务吗？此操作无法撤销。"
      />
    </div>
  );
};

export default SubTaskItem;
