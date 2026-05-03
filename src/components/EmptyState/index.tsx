import React from 'react';

/**
 * 空状态组件属性
 */
interface EmptyStateProps {
  /** 标题文字 */
  title?: string;
  /** 描述文字 */
  description?: string;
  /** 是否为深色主题 */
  isDark?: boolean;
}

/**
 * 共享的空状态组件
 * 用于 Home 和 Schedule 页面中任务列表为空时的展示
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title = '还没有任务',
  description = '点击右下角按钮添加新任务吧 ✨',
  isDark = false,
}) => {
  return (
    <div className={`glass rounded-3xl p-10 text-center ${isDark ? 'bg-gray-800/80 border border-gray-700/50' : ''}`}>
      <div className="mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={64}
          height={64}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`mx-auto ${isDark ? 'text-rose-400/30' : 'text-rose-200'}`}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className={`text-lg font-bold mb-2 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>{title}</p>
      <p className={`${isDark ? 'text-gray-400' : 'text-rose-400'}`}>{description}</p>
    </div>
  );
};

export default EmptyState;
