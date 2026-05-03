import { useState, useEffect, useCallback } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { Task } from '@/types';
import useUndo from '@/hooks/useUndo';

/**
 * 任务操作反馈类型
 */
interface Feedback {
  message: string;
  type: 'success' | 'error' | 'info' | 'undo';
  onUndo?: () => void;
}

/**
 * 共享的任务操作 Hook
 * 提取 Home 和 Schedule 页面中重复的状态管理和方法逻辑
 */
export function useTaskActions() {
  // 表单显示状态
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // 操作反馈状态
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // 删除确认弹窗状态
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // 获取 store 和 undo hook
  const { addTask, tasks, deleteTask } = useTaskStore();
  const { addOperation, undo: undoOperation, canUndo } = useUndo();

  // 键盘快捷键监听：Ctrl+N 打开快速添加、Ctrl+Z 撤销操作
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setShowQuickAdd(true);
      }
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (canUndo) {
          undoOperation();
          setFeedback({
            message: '操作已撤销',
            type: 'info'
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoOperation, canUndo]);

  // 添加任务
  const handleAddTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'subtasks'>) => {
    addTask(task);
    setShowAddForm(false);
    setFeedback({
      message: '任务添加成功',
      type: 'success'
    });
  }, [addTask]);

  // 取消添加任务
  const handleCancel = useCallback(() => {
    setShowAddForm(false);
  }, []);

  // 请求删除任务（弹出确认框）
  const handleDelete = useCallback((taskId: string) => {
    setTaskToDelete(taskId);
    setShowDeleteModal(true);
  }, []);

  // 确认删除任务
  const handleConfirmDelete = useCallback(() => {
    if (taskToDelete) {
      // 先保存要删除的任务，用于撤销/重做
      const taskToDeleteData = tasks.find(t => t.id === taskToDelete);

      deleteTask(taskToDelete);
      setShowDeleteModal(false);
      setTaskToDelete(null);

      // 注册撤销/重做操作到 undo 栈
      if (taskToDeleteData) {
        addOperation({
          description: `删除任务: ${taskToDeleteData.title}`,
          undo: () => {
            // 撤销删除：重新添加被删除的任务到 store
            addTask(taskToDeleteData);
          },
          redo: () => {
            // 重做删除：再次删除该任务
            deleteTask(taskToDeleteData.id);
          },
        });
      }

      setFeedback({
        message: '任务已删除',
        type: 'undo',
        onUndo: () => {
          if (taskToDeleteData) {
            // 撤销删除，重新添加任务
            addTask(taskToDeleteData);
            setFeedback({
              message: '任务已恢复',
              type: 'success'
            });
          }
        }
      });
    }
  }, [taskToDelete, tasks, deleteTask, addTask, addOperation]);

  // 取消删除任务
  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  }, []);

  return {
    showAddForm,
    setShowAddForm,
    showQuickAdd,
    setShowQuickAdd,
    feedback,
    setFeedback,
    showDeleteModal,
    taskToDelete,
    handleAddTask,
    handleCancel,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
  };
}
