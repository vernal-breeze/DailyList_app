import React from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '删除任务',
  message = '确定要删除这个任务吗？此操作无法撤销。'
}) => {
  const { settings } = useSettingsStore();
  const isDark = settings.theme === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm transition-opacity duration-300">
      {/* 弹窗内容 */}
      <div className={`rounded-3xl p-8 shadow-2xl backdrop-blur-md transition-all duration-500 transform scale-100 opacity-100 max-w-md w-full ${isDark ? 'bg-gray-800 border border-gray-700/50 shadow-gray-900/50' : 'bg-gradient-to-br from-rose-50 to-pink-50 shadow-rose-200/50 border border-rose-100/80'}`}>
        {/* 装饰元素 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </div>
        
        <div className="pt-8">
          <h2 className={`text-2xl font-bold mb-4 text-center ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>{title}</h2>
          <p className={`mb-8 text-center leading-relaxed ${isDark ? 'text-rose-300/80' : 'text-rose-600'}`}>{message}</p>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 btn-press shadow-sm ${isDark ? 'bg-gray-700/80 text-gray-300 border border-gray-600/50' : 'bg-white/80 text-gray-700 border border-rose-100'}`}
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-full text-sm font-medium hover:from-rose-500 hover:to-pink-600 transition-all duration-300 btn-press shadow-md"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
