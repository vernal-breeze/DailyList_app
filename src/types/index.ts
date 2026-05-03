// ============================================================
// 核心领域类型
// ============================================================

// ---- 重复任务子类型 ----

/** 重复结束条件 */
export type RecurrenceEndType = 'never' | 'after' | 'on';

/** 重复规则 */
export type RecurrenceRule = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

/** 重复结束条件配置 */
export interface RecurrenceEnd {
  type: RecurrenceEndType;
  count?: number;
  date?: string; // ISO 日期字符串 YYYY-MM-DD
}

/** 重复规则配置 */
export interface Recurrence {
  enabled: boolean;
  type: RecurrenceRule;
  interval: number;
  days: number[]; // 0-6，代表周日到周六
  end: RecurrenceEnd;
  exceptions: string[]; // ISO 日期字符串 YYYY-MM-DD，例外日期
}

// ---- 优先级 ----

export type PriorityLevel = 'high' | 'medium' | 'low';

// ---- 任务类型 ----

export type TaskType = 'single' | 'recurring';

// ---- 任务 ----

/** 任务实体 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO 日期字符串
  priority: PriorityLevel;
  completed: boolean;
  createdAt: string; // ISO 日期字符串
  category?: string;
  subtasks: SubTask[];
  startDate: string; // ISO 日期字符串，重复任务开始日期
  taskType: TaskType;
  recurrence: Recurrence;
  // 提醒相关字段
  reminderEnabled: boolean;
  notificationId: number; // 安卓通知ID，用于取消
  completedDates: string[]; // 已完成的日期
}

// ---- 子任务 ----

/** 子任务实体 */
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  parentId: string;
  level: number;
  subtasks: SubTask[];
}

// ---- 应用设置 ----

/** 应用设置 */
export interface AppSettings {
  theme: 'light' | 'dark';
  sortBy: 'dueDate' | 'priority' | 'createdAt';
  showCompleted: boolean;
}

// ---- 视图 ----

/** 视图状态类型 */
export type ViewType = 'week' | 'day' | 'month' | 'list' | 'schedule';

/** 操作反馈类型 */
export type FeedbackType = 'success' | 'error' | 'info' | 'undo';

// ---- 统计 ----

/** 任务统计信息 */
export interface TaskStatistics {
  total: number;
  completed: number;
  todayTotal: number;
  todayCompleted: number;
  progress: number;
}

// ============================================================
// 常量与映射
// ============================================================

/** 优先级颜色映射 */
export const priorityColors: Record<PriorityLevel, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
};

/** 优先级标签映射 */
export const priorityLabels: Record<PriorityLevel, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

/** 重复任务类型标签映射 */
export const recurrenceLabels: Record<RecurrenceRule, string> = {
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
  yearly: '每年',
  custom: '自定义',
};

// ============================================================
// 生成辅助函数
// ============================================================

/** 创建默认的 Recurrence 配置 */
export function createDefaultRecurrence(): Recurrence {
  return {
    enabled: false,
    type: 'daily',
    interval: 1,
    days: [],
    end: { type: 'never' },
    exceptions: [],
  };
}

/** 创建默认的 Task 部分字段（用于 addTask 的默认值） */
export function createDefaultTaskFields(): Pick<
  Task,
  | 'subtasks'
  | 'startDate'
  | 'taskType'
  | 'reminderEnabled'
  | 'notificationId'
  | 'completedDates'
  | 'recurrence'
> {
  return {
    subtasks: [],
    startDate: new Date().toISOString(),
    taskType: 'single',
    reminderEnabled: false,
    notificationId: Math.floor(Math.random() * 1000000),
    completedDates: [],
    recurrence: createDefaultRecurrence(),
  };
}
