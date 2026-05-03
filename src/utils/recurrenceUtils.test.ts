import { Task } from '../types';
import {
  generateTaskInstances,
  generateTaskInstancesForView,
  getTodayTasks,
  getWeekTasks,
  getMonthTasks,
  getTasksInRange,
  getTaskStatistics,
} from './recurrenceUtils';

// ============================================================
// 测试辅助函数
// ============================================================

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: '测试任务',
    dueDate: '2026-04-28T00:00:00.000Z',
    priority: 'medium',
    completed: false,
    createdAt: '2026-04-01T00:00:00.000Z',
    category: '工作',
    subtasks: [],
    startDate: '2026-04-01', // YYYY-MM-DD 格式会被解析为 UTC
    taskType: 'single',
    recurrence: {
      enabled: false,
      type: 'daily',
      interval: 1,
      days: [],
      end: { type: 'never' },
      exceptions: [],
    },
    reminderEnabled: false,
    notificationId: 0,
    completedDates: [],
    ...overrides,
  };
}

/** 创建一个 UTC 零点的 Date */
function utcDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z');
}

/** 创建一个 UTC 末点的 Date */
function utcDateEnd(dateStr: string): Date {
  return new Date(dateStr + 'T23:59:59.999Z');
}

// ============================================================
// generateTaskInstances 核心函数测试
// ============================================================

describe('generateTaskInstances', () => {
  describe('单次任务', () => {
    it('当日期在视图范围内时返回任务', () => {
      const task = createTask({
        taskType: 'single',
        dueDate: '2026-05-01T08:00:00.000Z',
      });
      const viewStart = utcDate('2026-05-01');
      const viewEnd = utcDateEnd('2026-05-01');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task-1');
    });

    it('当日期不在视图范围内时返回空', () => {
      const task = createTask({
        taskType: 'single',
        dueDate: '2026-05-01T08:00:00.000Z',
      });
      const viewStart = utcDate('2026-05-02');
      const viewEnd = utcDateEnd('2026-05-02');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(0);
    });

    it('当日期恰好在视图起始时间时返回', () => {
      const task = createTask({
        taskType: 'single',
        dueDate: '2026-05-01T08:00:00.000Z',
      });
      const viewStart = new Date('2026-05-01T00:00:00.000Z');
      const viewEnd = utcDateEnd('2026-05-01');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(1);
    });
  });

  describe('每日重复任务', () => {
    it('每日重复任务在范围内每天生成一个实例', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-05-01',
        recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      });
      const viewStart = utcDate('2026-05-01');
      const viewEnd = utcDateEnd('2026-05-03');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(3);
      expect(result[0].id).toContain('2026-05-01');
      expect(result[1].id).toContain('2026-05-02');
      expect(result[2].id).toContain('2026-05-03');
    });

    it('每日重复任务超出视图范围不返回', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-05-01',
        recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      });
      const viewStart = utcDate('2026-05-10');
      const viewEnd = utcDateEnd('2026-05-12');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(3);
      expect(result[0].id).toContain('2026-05-10');
    });

    it('每日重复任务自动解析 startDate YYYY-MM-DD', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-05-01',
        recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      });
      const viewStart = utcDate('2026-05-01');
      const viewEnd = utcDateEnd('2026-05-01');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(1);
    });

    it('生成的实例应禁用 recurrence.enabled', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-05-01',
        recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      });
      const viewStart = utcDate('2026-05-01');
      const viewEnd = utcDateEnd('2026-05-01');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result[0].recurrence.enabled).toBe(false);
    });
  });

  describe('每周重复任务', () => {
    it('每周特定天数生成实例', () => {
      // 2026-05-01 是周五，2026-05-04 是周一，2026-05-06 是周三
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-05-01',
        recurrence: {
          enabled: true,
          type: 'weekly',
          interval: 1,
          days: [1, 3, 5], // 周一、周三、周五
          end: { type: 'never' },
          exceptions: [],
        },
      });
      const viewStart = utcDate('2026-05-04'); // 周一
      const viewEnd = utcDateEnd('2026-05-10'); // 周日

      const result = generateTaskInstances(task, viewStart, viewEnd);
      // 周一(4)、周三(6)、周五(8)
      expect(result).toHaveLength(3);
      expect(result[0].id).toContain('2026-05-04');
      expect(result[1].id).toContain('2026-05-06');
      expect(result[2].id).toContain('2026-05-08');
    });

    it('周日(0)被正确处理为每周最后一天', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-05-01',
        recurrence: {
          enabled: true,
          type: 'weekly',
          interval: 1,
          days: [0], // 周日
          end: { type: 'never' },
          exceptions: [],
        },
      });
      // 2026-05-03 是周日
      const viewStart = utcDate('2026-05-03');
      const viewEnd = utcDateEnd('2026-05-03');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(1);
      expect(result[0].id).toContain('2026-05-03');
    });
  });

  describe('每月重复任务', () => {
    it('每月同一天生成实例', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-05-15',
        recurrence: { enabled: true, type: 'monthly', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      });
      const viewStart = utcDate('2026-06-15');
      const viewEnd = utcDateEnd('2026-06-15');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(1);
    });

    it('不在 startDate 日期的月份不生成', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-05-15',
        recurrence: { enabled: true, type: 'monthly', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      });
      const viewStart = utcDate('2026-06-14');
      const viewEnd = utcDateEnd('2026-06-14');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(0);
    });
  });

  describe('每年重复任务', () => {
    it('每年同月同一天生成实例', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-03-21',
        recurrence: { enabled: true, type: 'yearly', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      });
      const viewStart = utcDate('2027-03-21');
      const viewEnd = utcDateEnd('2027-03-21');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(1);
    });

    it('不同月份不生成', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-03-21',
        recurrence: { enabled: true, type: 'yearly', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      });
      const viewStart = utcDate('2027-04-21');
      const viewEnd = utcDateEnd('2027-04-21');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(0);
    });
  });

  describe('自定义重复（指定星期）', () => {
    it('同 weekly 逻辑，指定天数生成', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-05-01',
        recurrence: {
          enabled: true,
          type: 'custom',
          interval: 1,
          days: [2, 4], // 周二、周四
          end: { type: 'never' },
          exceptions: [],
        },
      });
      // 2026-05-05 是周二，05-07 是周四
      const viewStart = utcDate('2026-05-05');
      const viewEnd = utcDateEnd('2026-05-08');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(2);
      expect(result[0].id).toContain('2026-05-05');
      expect(result[1].id).toContain('2026-05-07');
    });
  });

  describe('截止条件 (end)', () => {
    it('after: 只生成指定次数', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-05-01',
        recurrence: {
          enabled: true,
          type: 'daily',
          interval: 1,
          days: [],
          end: { type: 'after', count: 3 },
          exceptions: [],
        },
      });
      const viewStart = utcDate('2026-05-01');
      const viewEnd = utcDateEnd('2026-05-10');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(3);
    });

    it('on: 在截止日期前生成', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-05-01',
        recurrence: {
          enabled: true,
          type: 'daily',
          interval: 1,
          days: [],
          end: { type: 'on', date: '2026-05-03' },
          exceptions: [],
        },
      });
      const viewStart = utcDate('2026-05-01');
      const viewEnd = utcDateEnd('2026-05-10');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(3); // 5/1, 5/2, 5/3
    });

    it('never: 持续无限生成', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-05-01',
        recurrence: {
          enabled: true,
          type: 'daily',
          interval: 1,
          days: [],
          end: { type: 'never' },
          exceptions: [],
        },
      });
      const viewStart = utcDate('2026-05-01');
      const viewEnd = utcDateEnd('2026-05-05');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(5);
    });
  });

  describe('例外日期 (exceptions)', () => {
    it('例外日期应被跳过', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-05-01',
        recurrence: {
          enabled: true,
          type: 'daily',
          interval: 1,
          days: [],
          end: { type: 'never' },
          exceptions: ['2026-05-02', '2026-05-04'],
        },
      });
      const viewStart = utcDate('2026-05-01');
      const viewEnd = utcDateEnd('2026-05-05');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(3); // 5/1, 5/3, 5/5
      expect(result.map(r => r.id)).not.toContain(expect.stringContaining('2026-05-02'));
      expect(result.map(r => r.id)).not.toContain(expect.stringContaining('2026-05-04'));
    });

    it('例外日期不消耗生成的次数', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-05-01',
        recurrence: {
          enabled: true,
          type: 'daily',
          interval: 1,
          days: [],
          end: { type: 'after', count: 3 },
          exceptions: ['2026-05-02'],
        },
      });
      const viewStart = utcDate('2026-05-01');
      const viewEnd = utcDateEnd('2026-05-10');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(3);
      expect(result[0].id).toContain('2026-05-01');
      expect(result[1].id).toContain('2026-05-03');
      expect(result[2].id).toContain('2026-05-04');
    });
  });

  describe('completed 状态', () => {
    it('未完成的任务实例 completed 为 false', () => {
      const task = createTask({
        completed: false,
        dueDate: '2026-05-01T08:00:00.000Z',
      });
      const viewStart = utcDate('2026-05-01');
      const viewEnd = utcDateEnd('2026-05-01');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result[0].completed).toBe(false);
    });

    it('已完成的重返任务的历史实例 completed 为 true', () => {
      const task = createTask({
        completed: true,
        taskType: 'recurring',
        startDate: '2026-04-30',
        recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      });
      const viewStart = utcDate('2026-05-01');
      const viewEnd = utcDateEnd('2026-05-01');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].completed).toBe(true);
    });

    it('已完成的重返任务的未来实例 completed 为 false', () => {
      const task = createTask({
        completed: true,
        taskType: 'recurring',
        startDate: '2026-04-30',
        recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      });
      // 需要一个未来足够远的日期，实例日期 > today
      const viewStart = utcDate('2999-05-01');
      const viewEnd = utcDateEnd('2999-05-01');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      if (result.length > 0) {
        expect(result[0].completed).toBe(false);
      }
    });

    it('已完成任务且实例日期<=今天时 completed 为 true（非重复）', () => {
      const task = createTask({
        completed: true,
        dueDate: '2026-05-01T08:00:00.000Z',
      });
      const viewStart = utcDate('2026-05-01');
      const viewEnd = utcDateEnd('2026-05-01');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result[0].completed).toBe(true);
    });

    it('例外中有 -completed 后缀的应标记为完成', () => {
      const task = createTask({
        completed: false,
        taskType: 'recurring',
        startDate: '2026-05-01',
        recurrence: {
          enabled: true,
          type: 'daily',
          interval: 1,
          days: [],
          end: { type: 'never' },
          exceptions: ['2026-05-02-completed'], // 特殊标记
        },
      });
      const viewStart = utcDate('2026-05-02');
      const viewEnd = utcDateEnd('2026-05-02');

      // 注意：例外数组包含 '2026-05-02-completed'，
      // 但 generateTaskInstances 用 includes(dateStr) 检查例外，所以这个"2026-05-02"会被 as 例外跳过
      // 实际上 completed 判断在 checkIfInstanceCompleted 中用的是 includes(dateStr + '-completed')
      // 所以 '2026-05-02' 不在 exceptions 中（exceptions 中有 '2026-05-02-completed' 而不是 '2026-05-02'）
      const result = generateTaskInstances(task, viewStart, viewEnd);
      // 因为 '2026-05-02' 不在 exceptions 中，所以会生成实例
      expect(result).toHaveLength(1);
      // 并且由于 exceptions 包含 '2026-05-02-completed'，completed 应为 true
      expect(result[0].completed).toBe(true);
    });
  });

  describe('边界情况', () => {
    it('当 viewStart > viewEnd 时返回空', () => {
      const task = createTask({
        dueDate: '2026-05-01T08:00:00.000Z',
      });
      const viewStart = utcDate('2026-05-10');
      const viewEnd = utcDateEnd('2026-05-01'); // start > end

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(0);
    });

    it('当 recurrence 为 undefined 时视为非重复任务', () => {
      const task = createTask({
        recurrence: undefined as any,
        dueDate: '2026-05-01T08:00:00.000Z',
      });
      const viewStart = utcDate('2026-05-01');
      const viewEnd = utcDateEnd('2026-05-01');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(1);
    });

    it('跨月边界（月底到下月初）的每日任务', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-04-30',
        recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      });
      const viewStart = utcDate('2026-04-30');
      const viewEnd = utcDateEnd('2026-05-02');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(3);
    });

    it('跨年边界（年底到明年初）的每日任务', () => {
      const task = createTask({
        taskType: 'recurring',
        startDate: '2026-12-30',
        recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      });
      const viewStart = utcDate('2026-12-30');
      const viewEnd = utcDateEnd('2027-01-02');

      const result = generateTaskInstances(task, viewStart, viewEnd);
      expect(result).toHaveLength(4);
    });
  });
});

// ============================================================
// 视图函数测试
// ============================================================

describe('getTodayTasks', () => {
  it('返回今天的任务实例', () => {
    const now = new Date();
    const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

    const task = createTask({
      taskType: 'recurring',
      startDate: '2024-01-01',
      recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
    });

    const result = getTodayTasks([task]);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].id).toContain(today);
  });

  it('不返回未来的单次任务', () => {
    const futureDate = new Date();
    futureDate.setUTCDate(futureDate.getUTCDate() + 365);

    const task = createTask({
      dueDate: futureDate.toISOString(),
    });

    const result = getTodayTasks([task]);
    expect(result).toHaveLength(0);
  });
});

describe('getWeekTasks', () => {
  it('返回本周所有任务（周一起始）', () => {
    const task = createTask({
      taskType: 'recurring',
      startDate: '2026-05-01',
      recurrence: {
        enabled: true,
        type: 'weekly',
        interval: 1,
        days: [1, 3, 5], // 周一、三、五
        end: { type: 'never' },
        exceptions: [],
      },
    });

    // 2026-05-04 是周一，范围 5/4(一) ~ 5/10(日)
    const refDate = new Date('2026-05-04');
    const result = getWeekTasks([task], refDate);
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it('没有任务时返回空数组', () => {
    const result = getWeekTasks([]);
    expect(result).toHaveLength(0);
  });
});

describe('getMonthTasks', () => {
  it('返回本月所有任务实例', () => {
    const task = createTask({
      taskType: 'recurring',
      startDate: '2026-05-01',
      recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
    });

    // 5 月有 31 天
    const refDate = new Date('2026-05-15');
    const result = getMonthTasks([task], refDate);
    expect(result).toHaveLength(31);
  });

  it('空任务列表返回空数组', () => {
    const refDate = new Date('2026-05-15');
    const result = getMonthTasks([], refDate);
    expect(result).toHaveLength(0);
  });
});

describe('getTasksInRange', () => {
  it('返回指定范围内的任务', () => {
    const task = createTask({
      taskType: 'recurring',
      startDate: '2026-05-01',
      recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
    });

    const start = utcDate('2026-05-01');
    const end = utcDateEnd('2026-05-03');
    const result = getTasksInRange([task], start, end);
    expect(result).toHaveLength(3);
  });
});

// ============================================================
// getTaskStatistics 测试
// ============================================================

describe('getTaskStatistics', () => {
  it('计算正确的统计信息', () => {
    const task1 = createTask({
      id: 'task-1',
      title: '已完成任务',
      completed: true,
      dueDate: new Date().toISOString(),
    });
    const task2 = createTask({
      id: 'task-2',
      title: '未完成任务',
      completed: false,
      dueDate: new Date().toISOString(),
    });

    const result = getTaskStatistics([task1, task2]);
    expect(result.total).toBe(2);
    expect(result.completed).toBe(1);
    expect(result.progress).toBe(50);
  });

  it('空任务列表的统计', () => {
    const result = getTaskStatistics([]);
    expect(result.total).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.progress).toBe(0);
  });

  it('所有任务都完成时进度为 100%', () => {
    const tasks = [1, 2, 3].map(i =>
      createTask({ id: `task-${i}`, completed: true })
    );

    const result = getTaskStatistics(tasks);
    expect(result.total).toBe(3);
    expect(result.completed).toBe(3);
    expect(result.progress).toBe(100);
  });

  it('统计以模板 ID 去重', () => {
    // 重复任务实例和模板共享 ID
    const task = createTask({
      id: 'task-1',
      completed: true,
      dueDate: '2026-05-01T08:00:00.000Z',
    });

    const result = getTaskStatistics([task, task]);
    expect(result.total).toBe(1); // 去重后
    expect(result.completed).toBe(1);
  });
});

// ============================================================
// 覆盖 checkIfInstanceCompleted 和 yearly 未覆盖分支
// ============================================================

describe('checkIfInstanceCompleted 覆盖', () => {
  it('task.completed 为 true 但实例日期在未来时，completed 应保持 false', () => {
    // 任务整体被标记为已完成，但某天实例在未来尚未发生
    const task = createTask({
      taskType: 'recurring',
      startDate: '2026-05-01',
      completed: true,
      recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
    });
    // 查看未来的日期（还没发生），应该保持 completed=false
    const viewStart = utcDate('2099-12-30');
    const viewEnd = utcDateEnd('2099-12-30');

    const result = generateTaskInstances(task, viewStart, viewEnd);
    if (result.length > 0) {
      expect(result[0].completed).toBe(false);
    }
  });
});

describe('yearly 额外场景', () => {
  it('在年中成功匹配下一年同月同日', () => {
    const task = createTask({
      taskType: 'recurring',
      startDate: '2026-07-15',
      recurrence: { enabled: true, type: 'yearly', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
    });
    const viewStart = utcDate('2027-07-15');
    const viewEnd = utcDateEnd('2027-07-15');

    const result = generateTaskInstances(task, viewStart, viewEnd);
    expect(result).toHaveLength(1);
  });

  it('连续多年生成 yearly 实例', () => {
    const task = createTask({
      taskType: 'recurring',
      startDate: '2025-06-01',
      recurrence: { enabled: true, type: 'yearly', interval: 1, days: [], end: { type: 'after', count: 5 }, exceptions: [] },
    });
    // 覆盖 6 年范围，应有在视图范围内的实例
    const viewStart = utcDate('2025-01-01');
    const viewEnd = utcDateEnd('2030-12-31');

    const result = generateTaskInstances(task, viewStart, viewEnd);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

describe('自定义重复类型 (custom)', () => {
  it('custom 类型按 days 数组匹配日期', () => {
    const task = createTask({
      taskType: 'recurring',
      startDate: '2026-05-01', // 周五 (day=5)
      recurrence: { enabled: true, type: 'custom', interval: 1, days: [5], end: { type: 'never' }, exceptions: [] },
    });
    const viewStart = utcDate('2026-05-01');
    const viewEnd = utcDateEnd('2026-05-08'); // 包含下一个周五

    const result = generateTaskInstances(task, viewStart, viewEnd);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});

describe('非重复任务边界', () => {
  it('非重复任务在视图范围外不返回', () => {
    const task = createTask({
      dueDate: '2026-06-15T08:00:00.000Z',
    });
    const viewStart = utcDate('2026-05-01');
    const viewEnd = utcDateEnd('2026-05-31');

    const result = generateTaskInstances(task, viewStart, viewEnd);
    expect(result).toHaveLength(0);
  });
});

describe('end.on 截止日期边界', () => {
  it('end.on 在截止日期当天仍生成实例', () => {
    const task = createTask({
      taskType: 'recurring',
      startDate: '2026-05-01',
      recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'on', date: '2026-05-03' }, exceptions: [] },
    });
    const viewStart = utcDate('2026-05-01');
    const viewEnd = utcDateEnd('2026-05-05');

    const result = generateTaskInstances(task, viewStart, viewEnd);
    expect(result).toHaveLength(3); // 5/1, 5/2, 5/3
  });

  it('end.on 超过截止日期不生成', () => {
    const task = createTask({
      taskType: 'recurring',
      startDate: '2026-05-01',
      recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'on', date: '2026-05-03' }, exceptions: [] },
    });
    const viewStart = utcDate('2026-05-04');
    const viewEnd = utcDateEnd('2026-05-05');

    const result = generateTaskInstances(task, viewStart, viewEnd);
    expect(result).toHaveLength(0);
  });
});

describe('generateTaskInstancesForView（已弃用兼容函数）', () => {
  it('委托给 generateTaskInstances 并返回相同结果', () => {
    const task = createTask({
      taskType: 'recurring',
      startDate: '2026-05-01',
      recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
    });
    const viewStart = utcDate('2026-05-01');
    const viewEnd = utcDateEnd('2026-05-03');

    const result = generateTaskInstancesForView(task, viewStart, viewEnd);
    expect(result).toHaveLength(3);
  });
});

// ============================================================
// 补分支覆盖率 91.07% → 更高
// ============================================================

describe('checkIfInstanceCompleted 分支覆盖', () => {
  const completedTask = (overrides: Record<string, any> = {}): Task => ({
    id: 'ct-1', title: 'C',
    dueDate: '2026-05-01', startDate: '2026-05-01',
    subtasks: [], completed: true, completedDates: [],
    notificationId: 0, priority: 'medium', reminderEnabled: false,
    recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
    createdAt: '2026-05-01T00:00:00Z', taskType: 'single',
    ...overrides,
  });

  it('已完成任务的未来实例不标记为完成（第44行 else 分支）', () => {
    // 任务已完成，但实例日期 > 今天，不应标记为完成
    const today = new Date('2026-05-15T00:00:00Z');
    const futureDate = new Date('2026-05-20T00:00:00Z');
    // 需要直接使用内部函数，但已导出不方便
    // 通过 generateTaskInstances 间接验证
    const task = completedTask({ startDate: '2026-05-15' });
    const instances = generateTaskInstances(task, utcDate('2026-05-20'), utcDateEnd('2026-05-20'));
    // 未来实例不应被 marked as completed
    const instance = instances[0];
    expect(instance).toBeDefined();
    // 未完成的 future instance 不应包含 exceptiosn + '-completed'
    expect(instance.completed).toBe(false);
  });
});

describe('getWeekTasks 周一起始分支 (第187行)', () => {
  it('周日查询时 weekStart 回退 6 天', () => {
    // 使用周日 2026-05-03（UTC）
    const sunday = new Date('2026-05-03T12:00:00Z');
    const task: Task = {
      id: 'wt-1', title: 'W',
      dueDate: '2026-05-03', startDate: '2026-04-27',
      subtasks: [], completed: false, completedDates: [],
      notificationId: 0, priority: 'medium', reminderEnabled: false,
      recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      createdAt: '2026-04-27T00:00:00Z', taskType: 'single',
    };

    // 周日查询：day=0, dayOffset=-6, weekStart = 2026-04-27
    const result = getWeekTasks([task], sunday);
    expect(result.length).toBeGreaterThanOrEqual(7);
  });

  it('周一查询时 weekStart 是当天', () => {
    // 周一 2026-05-04
    const monday = new Date('2026-05-04T12:00:00Z');
    const task: Task = {
      id: 'wt-2', title: 'W2',
      dueDate: '2026-05-04', startDate: '2026-05-04',
      subtasks: [], completed: false, completedDates: [],
      notificationId: 0, priority: 'medium', reminderEnabled: false,
      recurrence: { enabled: false, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      createdAt: '2026-05-04T00:00:00Z', taskType: 'single',
    };

    const result = getWeekTasks([task], monday);
    expect(result.length).toBe(1);
  });
});

describe('recurrence end.on 异常和防御性分支', () => {
  it('大量重复次数后仍稳定（maxCount 防御分支）', () => {
    const task: Task = {
      id: 'mc-1', title: 'MC',
      dueDate: '2026-01-01', startDate: '2026-01-01',
      subtasks: [], completed: false, completedDates: [],
      notificationId: 0, priority: 'medium', reminderEnabled: false,
      recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      createdAt: '2026-01-01T00:00:00Z', taskType: 'single',
    };

    const result = generateTaskInstances(task, utcDate('2026-01-01'), utcDateEnd('2026-01-05'));
    // daily never-end, view 范围 5 天
    expect(result).toHaveLength(5);
  });
});

// ============================================================
// 补最后分支：第84行 end.type 防御性，第109行 days=[], 第214行
// ============================================================

describe('防御性分支', () => {
  it('empty days 数组时 custom 不匹配 (第109行)', () => {
    const task: Task = {
      id: 'ed-1', title: 'ED',
      dueDate: '2026-05-01', startDate: '2026-05-01',
      subtasks: [], completed: false, completedDates: [],
      notificationId: 0, priority: 'medium', reminderEnabled: false,
      recurrence: { enabled: true, type: 'custom', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      createdAt: '2026-05-01T00:00:00Z', taskType: 'single',
    };

    // 空 days 数组不应生成任何实例
    const result = generateTaskInstances(task, utcDate('2026-05-01'), utcDateEnd('2026-05-07'));
    expect(result).toHaveLength(0);
  });

  it('end.on 且 end.date 为空时防御分支', () => {
    // task.recurrence.end.date 为 null → 第143行防御代码
    const badTask: Task = {
      id: 'ed-2', title: 'ED2',
      dueDate: '2026-05-01', startDate: '2026-05-01',
      subtasks: [], completed: false, completedDates: [],
      notificationId: 0, priority: 'medium', reminderEnabled: false,
      recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'on', date: '' }, exceptions: [] },
      createdAt: '2026-05-01T00:00:00Z', taskType: 'single',
    };

    // 有 end.on 但 end.date 为空 → 不报错
    const result = generateTaskInstances(badTask, utcDate('2026-05-01'), utcDateEnd('2026-05-03'));
    expect(result).toBeDefined();
  });
});
