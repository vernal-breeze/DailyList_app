import React, { useRef, useState, useEffect } from 'react';
import { Task } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { CheckCircle2, Circle, Clock, Flag, MoreHorizontal } from 'lucide-react';
import useGestures from '../../hooks/useGestures';

interface DraggableTaskCardProps {
  task: Task;
  onToggleCompleted: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDragEnd: (task: Task, x: number, y: number) => void;
}

const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({
  task,
  onToggleCompleted,
  onEdit,
  onDelete,
  onDragEnd
}) => {
  const { settings } = useSettingsStore();
  const isDark = settings.theme === 'dark';
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 优先级颜色映射
  const priorityColors = {
    high: isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700',
    medium: isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700',
    low: isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
  };

  // 处理拖拽开始
  const handleDragStart = (_x: number, _y: number) => {
    setIsDragging(true);
    setPosition({ x: 0, y: 0 });
  };

  // 处理拖拽中
  const handleDrag = (deltaX: number, deltaY: number) => {
    if (!elementRef.current || !containerRef.current) return;

    // 计算边界限制
    const cardRect = elementRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // 限制拖拽范围在容器内
    let newX = deltaX;
    let newY = deltaY;

    // 左边界
    if (cardRect.left + newX < containerRect.left) {
      newX = containerRect.left - cardRect.left;
    }

    // 右边界
    if (cardRect.right + newX > containerRect.right) {
      newX = containerRect.right - cardRect.right;
    }

    // 上边界
    if (cardRect.top + newY < containerRect.top) {
      newY = containerRect.top - cardRect.top;
    }

    // 下边界
    if (cardRect.bottom + newY > containerRect.bottom) {
      newY = containerRect.bottom - cardRect.bottom;
    }

    setPosition({ x: newX, y: newY });
  };

  // 处理拖拽结束
  const handleDragEnd = (x: number, y: number) => {
    // 顺滑回弹动画
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    onDragEnd(task, x, y);
  };

  // 使用手势hook
  const { elementRef, isDragging: gestureDragging } = useGestures({
    onDragStart: handleDragStart,
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
    onTap: () => {
      // 点击卡片时不做任何操作，保持原有点击行为
    },
    threshold: 10,
    longPressDelay: 500,
    enableVibration: true
  });

  // 同步拖拽状态
  useEffect(() => {
    setIsDragging(gestureDragging);
  }, [gestureDragging]);

  // 处理点击事件
  const handleCardClick = () => {
    // 这里可以添加卡片点击逻辑，比如打开详情页
  };

  // 处理菜单点击
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  // 处理菜单项点击
  const handleMenuItemClick = (action: 'edit' | 'delete') => {
    if (action === 'edit') {
      onEdit(task);
    } else if (action === 'delete') {
      onDelete(task.id);
    }
    setIsMenuOpen(false);
  };

  // 处理完成状态切换
  const handleToggleCompleted = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCompleted(task.id);
  };

  return (
    <div 
      ref={containerRef}
      className="relative"
    >
      <div
        ref={elementRef as React.RefObject<HTMLDivElement>}
        className={`rounded-[20px] p-6 shadow-lg transition-all duration-300 ${isDragging ? 'opacity-80 scale-105 z-50' : 'hover:shadow-xl'} ${
          isDark
            ? 'bg-gray-800/90 border border-gray-700/50 shadow-gray-900/50'
            : 'bg-white/90 border border-white/70 shadow-pink-100/30 hover:shadow-pink-100/50'
        }`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-4">
          {/* 完成状态 */}
          <button
            onClick={handleToggleCompleted}
            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isDark ? 'border-gray-600 hover:border-rose-500' : 'border-gray-300 hover:border-pink-400'}`}
          >
            {task.completed ? (
              <CheckCircle2 size={16} className="text-pink-500 check-animation" />
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
                <span>{new Date(task.dueDate).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* 优先级 */}
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                <Flag size={12} />
                <span>{task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}</span>
              </div>
            </div>
          </div>

          {/* 菜单按钮 */}
          <button
            onClick={handleMenuClick}
            className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <MoreHorizontal size={20} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
          </button>
        </div>

        {/* 子任务进度（如果有） */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className={`mt-4 pt-4 ${isDark ? 'border-t border-gray-700' : 'border-t border-gray-100'}`}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>子任务</span>
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div 
                className="h-full bg-pink-400 transition-all duration-300"
                style={{
                  width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`
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

      {/* 菜单 */}
      {isMenuOpen && (
        <div className={`absolute top-full right-0 mt-2 rounded-lg shadow-xl z-50 min-w-[120px] ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
          <button
            onClick={() => handleMenuItemClick('edit')}
            className={`w-full px-4 py-2 text-left text-sm transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            编辑
          </button>
          <button
            onClick={() => handleMenuItemClick('delete')}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 transition-colors"
          >
            删除
          </button>
        </div>
      )}
    </div>
  );
};

export default DraggableTaskCard;
