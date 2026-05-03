import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Task } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { CheckCircle2, Circle, Clock, Flag, Trash2, Check } from 'lucide-react';
import { formatBeijingTime, isTaskExpiring } from '../../utils/dateUtils';
import { useTaskStore } from '../../store/taskStore';

interface SwipeableTaskCardProps {
  task: Task;
  onToggleCompleted: (id: string) => void;
  onDelete: (id: string) => void;
  onSwipeOpen: (id: string) => void;
  isSwipeOpen: boolean;
}

const SwipeableTaskCard: React.FC<SwipeableTaskCardProps> = ({ 
  task, 
  onToggleCompleted, 
  onDelete, 
  onSwipeOpen, 
  isSwipeOpen 
}) => {
  const { settings } = useSettingsStore();
  const isDark = settings.theme === 'dark';
  const [swipePosition, setSwipePosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const thresholdRef = useRef(0.3); // 30% 阈值

  // 优先级颜色映射
  const priorityColors = useMemo(() => ({
    high: isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700',
    medium: isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700',
    low: isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
  }), [isDark]);

  // 处理触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimating || isDeleting || isCompleting) return;
    
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  }, [isAnimating, isDeleting, isCompleting]);

  // 处理触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || isAnimating || isDeleting || isCompleting) return;
    
    currentXRef.current = e.touches[0].clientX;
    const deltaX = currentXRef.current - startXRef.current;
    
    // 限制滑动范围
    let newPosition = deltaX;
    if (newPosition > 120) newPosition = 120; // 右滑最大距离
    if (newPosition < -160) newPosition = -160; // 左滑最大距离
    
    // 使用requestAnimationFrame优化性能
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      setSwipePosition(newPosition);
    });
  }, [isDragging, isAnimating, isDeleting, isCompleting]);

  // 获取原始任务ID（处理重复任务实例）
  const getOriginalTaskId = useCallback(() => {
    // 尝试直接匹配
    const taskStore = useTaskStore.getState();
    if (taskStore.tasks.some(t => t.id === task.id)) {
      return task.id;
    }
    
    // 如果直接匹配不到，尝试提取原始任务ID（重复任务实例）
    // 重复任务实例ID格式为 "原始ID-YYYY-MM-DD"，UUID有5个部分（4个分隔符）
    const idParts = task.id.split('-');
    if (idParts.length > 5) {
      const allTaskIds = taskStore.tasks.map(t => t.id);
      for (const taskId of allTaskIds) {
        if (task.id.startsWith(taskId + '-')) {
          return taskId;
        }
      }
      
      // 备用方案：去掉最后3个部分（日期）
      const possibleOriginalId = idParts.slice(0, 5).join('-');
      if (taskStore.tasks.some(t => t.id === possibleOriginalId)) {
        return possibleOriginalId;
      }
    }
    
    // 如果都找不到，返回原始ID
    return task.id;
  }, [task.id]);

  // 处理触摸结束
  const handleTouchEnd = useCallback(() => {
    if (!isDragging || isAnimating || isDeleting || isCompleting) return;
    
    setIsDragging(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    const cardWidth = cardRef.current?.offsetWidth || 0;
    const threshold = cardWidth * thresholdRef.current;
    const originalTaskId = getOriginalTaskId();
    
    setIsAnimating(true);
    
    // 根据滑动距离和方向决定操作
    if (swipePosition > threshold) {
      // 右滑超过阈值，触发完成操作
      setIsCompleting(true);
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      
      // 完成动画
      setTimeout(() => {
        onToggleCompleted(originalTaskId);
        setSwipePosition(0);
        setIsAnimating(false);
        setIsCompleting(false);
      }, 300);
    } else if (swipePosition < -threshold) {
      // 左滑超过阈值，展开操作按钮
      setSwipePosition(-160);
      onSwipeOpen(task.id); // 这里使用生成的ID，用于滑动状态管理
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    } else {
      // 未超过阈值，回弹
      setSwipePosition(0);
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  }, [isDragging, isAnimating, isDeleting, isCompleting, swipePosition, getOriginalTaskId, onToggleCompleted, onSwipeOpen]);

  // 处理删除操作
  const handleDelete = useCallback(() => {
    setIsDeleting(true);
    if (navigator.vibrate) {
      navigator.vibrate(150);
    }
    
    const originalTaskId = getOriginalTaskId();
    // 删除动画
    setTimeout(() => {
      onDelete(originalTaskId);
    }, 300);
  }, [getOriginalTaskId, onDelete]);

  // 处理完成操作
  const handleComplete = useCallback(() => {
    setIsCompleting(true);
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    const originalTaskId = getOriginalTaskId();
    // 完成动画
    setTimeout(() => {
      onToggleCompleted(originalTaskId);
      setSwipePosition(0);
      setIsAnimating(false);
      setIsCompleting(false);
    }, 300);
  }, [getOriginalTaskId, onToggleCompleted]);

  // 处理点击完成按钮
  const handleToggleCompletedClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleComplete();
  }, [handleComplete]);



  // 当isSwipeOpen变化时，关闭滑动
  useEffect(() => {
    if (!isSwipeOpen && swipePosition !== 0) {
      setIsAnimating(true);
      setSwipePosition(0);
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  }, [isSwipeOpen, swipePosition]);

  // 计算按钮透明度
  const deleteButtonOpacity = useMemo(() => {
    return Math.max(0, Math.min(1, -swipePosition / 160));
  }, [swipePosition]);

  const completeButtonOpacity = useMemo(() => {
    return Math.max(0, Math.min(1, -swipePosition / 80));
  }, [swipePosition]);

  // 计算子任务完成率
  const subTaskCompletionRate = useMemo(() => {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(st => st.completed).length;
    return (completed / task.subtasks.length) * 100;
  }, [task.subtasks]);

  return (
    <div className="relative overflow-hidden">
      {/* 操作按钮 */}
      <div className="absolute top-0 right-0 h-full flex">
        <button
          onClick={handleComplete}
          className="w-16 h-full bg-emerald-500 flex items-center justify-center transition-opacity duration-300"
          style={{ opacity: completeButtonOpacity }}
          aria-label="标记为完成"
        >
          <Check size={24} className="text-white" />
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-full bg-red-500 flex items-center justify-center transition-opacity duration-300"
          style={{ opacity: deleteButtonOpacity }}
          aria-label="删除任务"
        >
          <Trash2 size={24} className="text-white" />
        </button>
      </div>
      
      {/* 任务卡片 */}
      <div
        ref={cardRef}
        className={`rounded-[20px] p-6 shadow-lg transition-all duration-300 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDeleting ? 'opacity-0 h-0' : ''} ${isCompleting ? 'opacity-0 transform translate-x-12' : ''} ${
          isDark
            ? 'bg-gray-800/90 border border-gray-700/50 shadow-gray-900/50'
            : 'bg-white/90 border border-white/70 shadow-pink-100/30'
        }`}
        style={{
          transform: `translateX(${swipePosition}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div className="flex items-start gap-4">
          {/* 完成状态 */}
          <button
            onClick={handleToggleCompletedClick}
            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isDark ? 'border-gray-600 hover:border-rose-500' : 'border-gray-300 hover:border-pink-400'}`}
            aria-label={task.completed ? "标记为未完成" : "标记为完成"}
          >
            {task.completed ? (
              <CheckCircle2 size={16} className="text-pink-500" />
            ) : (
              <Circle size={16} className="text-transparent" />
            )}
          </button>

          {/* 任务内容 */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium mb-2 ${task.completed ? 'line-through text-gray-400' : (isDark ? 'text-gray-100' : 'text-gray-800')}`}>
              {task.title}
            </h3>
            
            <div className="flex items-center gap-3 text-sm">
              {/* 提醒时间 */}
              <div className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Clock size={14} />
                <span>{formatBeijingTime(new Date(task.dueDate))}</span>
              </div>

              {/* 优先级 */}
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                <Flag size={12} />
                <span>{task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}</span>
              </div>

              {/* 即将到期标签 */}
              {isTaskExpiring(task) && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  <Clock size={12} />
                  <span>即将到期</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 子任务进度（如果有） */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className={`mt-4 pt-4 ${isDark ? 'border-t border-gray-700' : 'border-t border-gray-100'}`}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>子任务</span>
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div 
                className="h-full bg-pink-400 transition-all duration-300"
                style={{
                  width: `${subTaskCompletionRate}%`
                }}
              />
            </div>
          </div>
        )}

        {/* 重复任务标记 */}
        {task.recurrence && (
          <div className={`mt-3 pt-3 ${isDark ? 'border-t border-gray-700' : 'border-t border-gray-100'}`}>
            <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Clock size={12} />
              <span>重复任务</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(SwipeableTaskCard);
