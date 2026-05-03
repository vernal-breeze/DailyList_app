import { useState, useCallback } from 'react';

/**
 * 撤销操作接口
 * 每个操作包含 undo（撤销）、redo（重做）和描述信息
 */
interface UndoOperation {
  undo: () => void;
  redo: () => void;
  description: string;
}

/**
 * 撤销/重做 Hook
 * 提供通用的撤销和重做功能，支持注册任意操作
 */
export default function useUndo() {
  const [undoStack, setUndoStack] = useState<UndoOperation[]>([]);
  const [redoStack, setRedoStack] = useState<UndoOperation[]>([]);

  /**
   * 注册一个新的可撤销操作
   * 新操作会清空重做栈（与标准编辑器行为一致）
   */
  const addOperation = useCallback((operation: UndoOperation) => {
    setUndoStack(prev => [...prev, operation]);
    setRedoStack([]); // 新操作清空重做栈
  }, []);

  /**
   * 撤销最近一次操作
   * 将操作从撤销栈移至重做栈，并执行 undo 回调
   */
  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack(redo => [...redo, last]);
      last.undo();
      return prev.slice(0, -1);
    });
  }, []);

  /**
   * 重做最近一次被撤销的操作
   * 将操作从重做栈移回撤销栈，并执行 redo 回调
   */
  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setUndoStack(undo => [...undo, last]);
      last.redo();
      return prev.slice(0, -1);
    });
  }, []);

  /**
   * 清空所有撤销和重做记录
   */
  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    addOperation,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    clear,
  };
}
