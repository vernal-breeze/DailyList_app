import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskStore } from '@/store/taskStore';
import TaskForm from '@/components/TaskForm';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { ArrowLeft } from 'lucide-react';
import { Task } from '@/types';

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, updateTask, deleteTask, loadTasks } = useTaskStore();
  const [task, setTask] = useState<Task | null>(null);
  // 删除确认弹窗状态
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (id) {
      const foundTask = tasks.find(t => t.id === id);
      setTask(foundTask || null);
    }
  }, [id, tasks]);

  const handleUpdateTask = (updatedTask: Omit<Task, 'id' | 'createdAt'>) => {
    if (id) {
      updateTask(id, updatedTask);
      navigate('/');
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  // 确认删除任务
  const handleConfirmDelete = () => {
    if (id) {
      deleteTask(id);
      navigate('/');
    }
    setShowDeleteModal(false);
  };

  // 取消删除
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors mr-4"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{task ? '编辑任务' : '任务详情'}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {!task ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            <p>任务不存在</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
              <TaskForm task={task} onSubmit={handleUpdateTask} onCancel={handleCancel} />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                删除任务
              </button>
            </div>
          </>
        )}
      </div>

      {/* 删除确认弹窗 */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="删除任务"
        message="确定要删除这个任务吗？此操作无法撤销。"
      />
    </div>
  );
};

export default TaskDetail;
