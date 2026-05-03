import { Task } from '../types';
import { getBeijingTime, toBeijingTime } from './dateUtils';

// ============================================================
// 第一步：统一的日期格式化工具（无时区偏差）
// ============================================================

/**
 * 直接复制的函数，确保 YYYY-MM-DD 格式完全一致
 * @param date 日期对象
 * @returns 格式化后的日期字符串
 */
export function getLocalDateStr(date: Date): string {
  const d = new Date(date);
  const Y = d.getUTCFullYear();
  const M = String(d.getUTCMonth() + 1).padStart(2, '0');
  const D = String(d.getUTCDate()).padStart(2, '0');
  return `${Y}-${M}-${D}`;
}

/**
 * 检查任务实例是否应该被标记为已完成
 */
function checkIfInstanceCompleted(task: Task, instanceDate: Date): boolean {
  // 如果模板任务已经完成，所有过去的实例也应该被标记为完成
  if (task.completed) {
    const now = getBeijingTime();
    if (instanceDate <= now) {
      return true;
    }
  }
  
  // 检查是否有异常日期标记了完成
  const dateStr = getLocalDateStr(instanceDate);
  return task.recurrence.exceptions.includes(dateStr + '-completed');
}

/**
 * 统一的任务实例生成引擎。
 *
 * 核心设计：
 * 1. 从 task.startDate 开始逐天推演，保证 generatedCount 正确累计历史次数
 * 2. 例外日期匹配使用 getLocalDateStr，杜绝时区偏差
 * 3. 只有非例外且符合规则的日期才计入 generatedCount
 * 4. 只有处于视图范围内的实例才会被收集返回
 *
 * @param task      任务模板
 * @param viewStart 视图范围起点
 * @param viewEnd   视图范围终点
 * @returns 该视图范围内的所有任务实例
 */
export function generateTaskInstances(
  task: Task,
  viewStart: Date,
  viewEnd: Date
): Task[] {
  const instances: Task[] = [];

  // 非重复任务：仅当在视图范围内时返回
  if (!task.recurrence?.enabled) {
    const dueDate = toBeijingTime(new Date(task.dueDate));
    if (dueDate >= viewStart && dueDate <= viewEnd) {
      instances.push(task);
    }
    return instances;
  }

  let currentDate = toBeijingTime(new Date(task.startDate));
  let generatedCount = 0; // 实际生成的有效次数
  const maxCount = task.recurrence.end.type === 'after' ? (task.recurrence.end.count || 0) : Infinity;
  const endOnDate = task.recurrence.end.type === 'on' ? toBeijingTime(new Date(task.recurrence.end.date || 0)) : null;

  // 必须从任务开始日期推演，否则计数永远不对
  // 限制循环上限，防止由于逻辑错误导致的死循环（设置 1000 次安全阀）
  let safetyValve = 0;
  while (currentDate <= viewEnd && safetyValve < 1000) {
    safetyValve++;
    
    // A. 检查日期截止
    if (endOnDate && currentDate > endOnDate) break;

    const dateStr = getLocalDateStr(currentDate);
    
    // B. 检查是否符合重复规律 (例如周几)
    let matchesRule = false;
    if (task.recurrence.type === 'daily') matchesRule = true;
    else if (task.recurrence.type === 'weekly') matchesRule = task.recurrence.days.includes(currentDate.getUTCDay());
    else if (task.recurrence.type === 'monthly') {
      // 每月重复，检查是否是同一天
      const startDate = toBeijingTime(new Date(task.startDate));
      matchesRule = currentDate.getUTCDate() === startDate.getUTCDate();
    }
    else if (task.recurrence.type === 'yearly') {
      // 每年重复，检查是否是同一月同一天
      const startDate = toBeijingTime(new Date(task.startDate));
      matchesRule = currentDate.getUTCMonth() === startDate.getUTCMonth() && currentDate.getUTCDate() === startDate.getUTCDate();
    }
    else if (task.recurrence.type === 'custom') {
      // 自定义重复，检查是否是指定的星期几
      matchesRule = task.recurrence.days.includes(currentDate.getUTCDay());
    }

    if (matchesRule) {
      // C. 只有"非例外"日期才处理
      if (!task.recurrence.exceptions.includes(dateStr)) {
        generatedCount++; // 只有真正显示的才计数
        
        // D. 检查次数是否超限 (要在计数后判断)
        if (generatedCount > maxCount) break;

        // E. 如果在视图显示范围内，存入结果
        if (currentDate >= viewStart && currentDate <= viewEnd) {
          instances.push({
            ...task,
            id: `${task.id}-${dateStr}`,
            dueDate: new Date(currentDate).toISOString(),
            completed: checkIfInstanceCompleted(task, currentDate),
            createdAt: task.createdAt,
            recurrence: {
              ...task.recurrence,
              enabled: false, // 禁用实例的重复设置，避免二次展开
            },
          });
        }
      }
      // 注意：如果是例外日期，matchesRule 为 true 但不计数也不显示，继续往后推演
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return instances;
}

/**
 * @deprecated 请使用 generateTaskInstances 代替。
 * 保留此导出以兼容 taskStore 中的旧引用。
 */
export function generateTaskInstancesForView(
  template: Task,
  viewStart: Date,
  viewEnd: Date
): Task[] {
  return generateTaskInstances(template, viewStart, viewEnd);
}

// ============================================================
// 第三步：统一视图函数（全部委托给 generateTaskInstances）
// ============================================================

/**
 * 获取今天的所有任务实例（包括重复任务）
 */
export function getTodayTasks(tasks: Task[]): Task[] {
  const now = getBeijingTime();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const todayTasks: Task[] = [];

  tasks.forEach((task) => {
    const instances = generateTaskInstances(task, todayStart, todayEnd);
    todayTasks.push(...instances);
  });

  return todayTasks.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}

/**
 * 获取本周的所有任务实例（包括重复任务）
 * @param tasks  任务列表
 * @param refDate 参考日期（默认为当前北京时间），用于确定"本周"的范围
 */
export function getWeekTasks(tasks: Task[], refDate?: Date): Task[] {
  const now = refDate || getBeijingTime();
  // 使用 getUTCDay() 来获取北京时间的星期几
  const day = now.getUTCDay();
  const weekStart = new Date(now);
  // 使用 setUTCDate() 来设置北京时间的日期
  weekStart.setUTCDate(now.getUTCDate() - day);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  const weekTasks: Task[] = [];

  tasks.forEach((task) => {
    const instances = generateTaskInstances(task, weekStart, weekEnd);
    weekTasks.push(...instances);
  });

  return weekTasks.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}

/**
 * 获取本月的所有任务实例（包括重复任务）
 * @param tasks  任务列表
 * @param date   参考日期（默认为当前北京时间）
 */
export function getMonthTasks(tasks: Task[], date?: Date): Task[] {
  const ref = date || getBeijingTime();
  const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  const monthTasks: Task[] = [];

  tasks.forEach((task) => {
    const instances = generateTaskInstances(task, monthStart, monthEnd);
    monthTasks.push(...instances);
  });

  return monthTasks.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}

/**
 * 获取指定日期范围的任务实例
 */
export function getTasksInRange(
  tasks: Task[],
  startDate: Date,
  endDate: Date
): Task[] {
  const tasksInRange: Task[] = [];

  tasks.forEach((task) => {
    const instances = generateTaskInstances(task, startDate, endDate);
    tasksInRange.push(...instances);
  });

  return tasksInRange.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}

/**
 * 获取任务的统计信息（去重后的数量）
 */
export function getTaskStatistics(tasks: Task[]): {
  total: number;
  completed: number;
  todayTotal: number;
  todayCompleted: number;
  progress: number;
} {
  const todayTasks = getTodayTasks(tasks);

  const uniqueTemplateIds = new Set<string>();
  const completedTemplateIds = new Set<string>();

  tasks.forEach((task) => {
    uniqueTemplateIds.add(task.id);
    if (task.completed) {
      completedTemplateIds.add(task.id);
    }
  });

  const total = uniqueTemplateIds.size;
  const completed = completedTemplateIds.size;
  const todayTotal = todayTasks.length;
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    todayTotal,
    todayCompleted,
    progress,
  };
}
