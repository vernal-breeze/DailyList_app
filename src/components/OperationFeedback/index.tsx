import React, { useState, useEffect } from 'react';
import { Check, Undo, AlertCircle, Info } from 'lucide-react';

interface OperationFeedbackProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'undo';
  onUndo?: (() => void) | undefined;
  onClose?: () => void;
}

const OperationFeedback: React.FC<OperationFeedbackProps> = ({ message, type, onUndo, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, type, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check size={20} className="text-emerald-500" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />;
      case 'info':
        return <Info size={20} className="text-blue-500" />;
      case 'undo':
        return <Undo size={20} className="text-amber-500" />;
      default:
        return <Info size={20} className="text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'undo':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-emerald-800';
      case 'error':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
      case 'undo':
        return 'text-amber-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${getBackgroundColor()} border rounded-lg shadow-lg p-4 flex items-center gap-3 animate-slide-in transition-all duration-300`}>
      {getIcon()}
      <div className="flex-1">
        <p className={`font-medium ${getTextColor()}`}>{message}</p>
      </div>
      {type === 'undo' && onUndo && (
        <button
          onClick={onUndo}
          className="text-amber-600 hover:text-amber-800 font-medium transition-colors"
        >
          撤销
        </button>
      )}
    </div>
  );
};

export default OperationFeedback;