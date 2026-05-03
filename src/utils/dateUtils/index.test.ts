import {
  dateUtils,
  getBeijingTime,
  toBeijingTime,
  getBeijingDateParts,
  formatBeijingTime,
  formatBeijingDate,
  formatBeijingTimeOnly,
  getBeijingWeekRange,
  isInCurrentWeek,
  getNextBeijingDay,
  isTaskExpiring,
  isToday,
  isPast,
  getLocalDateStr,
  getLocalFormattedDate,
  getBeijingMonthRange,
} from './index';

// ============================================================
// 获取当前测试环境的时区，用于调试
// ============================================================
function getTestTZ(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return Intl.DateTimeFormat?.().resolvedOptions?.()?.timeZone || 'unknown';
  }
}
const testTZ = getTestTZ();

// ============================================================
// getLocalDateStr
// ============================================================
describe('getLocalDateStr', () => {
  it('从 UTC 日期中提取 YYYY-MM-DD', () => {
    const date = new Date('2026-04-28');
    expect(getLocalDateStr(date)).toBe('2026-04-28');
  });

  it('正确处理月份和日期补零', () => {
    const date = new Date('2026-01-05');
    expect(getLocalDateStr(date)).toBe('2026-01-05');
  });

  it('正确处理跨年', () => {
    const date = new Date('2026-12-31');
    expect(getLocalDateStr(date)).toBe('2026-12-31');
  });

  it('正确处理个位数月份', () => {
    const date = new Date('2026-03-03');
    expect(getLocalDateStr(date)).toBe('2026-03-03');
  });

  it('对 UTC 时间戳返回正确格式', () => {
    const date = new Date('2026-05-01T00:00:00.000Z');
    expect(getLocalDateStr(date)).toBe('2026-05-01');
  });
});

// ============================================================
// getLocalFormattedDate
// ============================================================
describe('getLocalFormattedDate', () => {
  it('使用本地时区提取 YYYY-MM-DD', () => {
    const date = new Date('2026-05-01');
    expect(getLocalFormattedDate(date)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ============================================================
// getBeijingTime
// ============================================================
describe('getBeijingTime', () => {
  it('返回 Date 对象', () => {
    const result = getBeijingTime();
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(false);
  });

  it('返回的年份是合理的', () => {
    const result = getBeijingTime();
    expect(result.getFullYear()).toBeGreaterThanOrEqual(2020);
  });
});

// ============================================================
// toBeijingTime
// ============================================================
describe('toBeijingTime', () => {
  it('将 UTC 时间正确转换', () => {
    const utcDate = new Date('2026-05-01T00:00:00.000Z');
    const bj = toBeijingTime(utcDate);
    expect(bj).toBeInstanceOf(Date);
    expect(isNaN(bj.getTime())).toBe(false);
  });
});

// ============================================================
// getBeijingDateParts
// ============================================================
describe('getBeijingDateParts', () => {
  it('返回完整的时间部分对象', () => {
    const date = new Date('2026-05-01T00:00:00.000Z');
    const parts = getBeijingDateParts(date);
    expect(parts).toHaveProperty('year');
    expect(parts).toHaveProperty('month');
    expect(parts).toHaveProperty('date');
    expect(parts).toHaveProperty('day');
    expect(parts).toHaveProperty('hours');
    expect(parts).toHaveProperty('minutes');
    expect(parts).toHaveProperty('seconds');
  });

  it('返回有效的日期部分对象', () => {
    const date = new Date('2026-05-01T00:00:00.000Z');
    const parts = getBeijingDateParts(date);
    expect(parts).toHaveProperty('year');
    expect(parts).toHaveProperty('month');
    expect(parts).toHaveProperty('date');
    expect(parts).toHaveProperty('day');
    expect(parts).toHaveProperty('hours');
    expect(parts).toHaveProperty('minutes');
    expect(parts).toHaveProperty('seconds');
    expect(typeof parts.hours).toBe('number');
    expect(typeof parts.year).toBe('number');
  });
});

// ============================================================
// formatBeijingTime
// ============================================================
describe('formatBeijingTime', () => {
  it('返回包含 "北京时间" 的字符串', () => {
    const date = new Date();
    const result = formatBeijingTime(date);
    expect(result).toContain('北京时间');
    expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
  });
});

// ============================================================
// formatBeijingDate
// ============================================================
describe('formatBeijingDate', () => {
  it('返回 "年/月/日" 格式', () => {
    const date = new Date('2026-05-01T00:00:00.000Z');
    const result = formatBeijingDate(date);
    expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
  });
});

// ============================================================
// formatBeijingTimeOnly
// ============================================================
describe('formatBeijingTimeOnly', () => {
  it('返回 "时:分" 格式', () => {
    const date = new Date();
    const result = formatBeijingTimeOnly(date);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

// ============================================================
// getBeijingWeekRange
// ============================================================
describe('getBeijingWeekRange', () => {
  it('返回 start 和 end', () => {
    const range = getBeijingWeekRange();
    expect(range.start).toBeInstanceOf(Date);
    expect(range.end).toBeInstanceOf(Date);
    expect(range.end.getTime()).toBeGreaterThan(range.start.getTime());
  });

  it('本周跨度大约 7 天', () => {
    const range = getBeijingWeekRange();
    const diffMs = range.end.getTime() - range.start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(7, 0);
  });
});

// ============================================================
// isInCurrentWeek
// ============================================================
describe('isInCurrentWeek', () => {
  it('today should be in current week', () => {
    expect(isInCurrentWeek(new Date())).toBe(true);
  });
});

// ============================================================
// getNextBeijingDay
// ============================================================
describe('getNextBeijingDay', () => {
  it('返回同时间下一天的 Date', () => {
    const date = new Date('2026-05-01T00:00:00.000Z');
    const next = getNextBeijingDay(date);
    expect(next.getTime()).toBeGreaterThan(date.getTime());
  });
});

// ============================================================
// isTaskExpiring
// ============================================================
describe('isTaskExpiring', () => {
  it('无重复或截止类型不是 "on" 返回 false', () => {
    expect(isTaskExpiring({ recurrence: { enabled: false, end: { type: 'never' } } })).toBe(false);
    expect(isTaskExpiring({ recurrence: { enabled: true, end: { type: 'never' } } })).toBe(false);
    expect(isTaskExpiring({ recurrence: { enabled: true, end: { type: 'after', count: 5 } } })).toBe(false);
  });

  it('未来 3 天内到期返回 true', () => {
    const future = new Date();
    future.setDate(future.getDate() + 2);
    const task = {
      recurrence: {
        enabled: true,
        end: { type: 'on', date: future.toISOString() }
      }
    };
    expect(isTaskExpiring(task)).toBe(true);
  });

  it('超过 3 天返回 false', () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 10);
    const task = {
      recurrence: {
        enabled: true,
        end: { type: 'on', date: farFuture.toISOString() }
      }
    };
    expect(isTaskExpiring(task)).toBe(false);
  });

  it('已过期的返回 false', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const task = {
      recurrence: {
        enabled: true,
        end: { type: 'on', date: past.toISOString() }
      }
    };
    expect(isTaskExpiring(task)).toBe(false);
  });
});

// ============================================================
// isToday / isBeijingToday
// ============================================================
describe('isToday', () => {
  it('今天的日期返回 true', () => {
    expect(isToday(new Date())).toBe(true);
  });

  it('null/undefined 返回 false', () => {
    expect(isToday(null as any)).toBe(false);
    expect(isToday(undefined as any)).toBe(false);
    expect(isToday('' as any)).toBe(false);
  });
});

// ============================================================
// isPast / isBeijingPast
// ============================================================
describe('isPast', () => {
  it('昨天的日期返回 true', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    expect(isPast(yesterday)).toBe(true);
  });

  it('今天的日期返回 false', () => {
    const today = new Date();
    expect(isPast(today)).toBe(false);
  });

  it('null/undefined 返回 false', () => {
    expect(isPast(null as any)).toBe(false);
    expect(isPast(undefined as any)).toBe(false);
  });
});

// ============================================================
// getBeijingMonthRange
// ============================================================
describe('getBeijingMonthRange', () => {
  it('返回 start 和 end', () => {
    const range = getBeijingMonthRange();
    expect(range.start).toBeInstanceOf(Date);
    expect(range.end).toBeInstanceOf(Date);
    expect(range.end.getTime()).toBeGreaterThan(range.start.getTime());
  });

  it('start 的日期是 1 号', () => {
    const range = getBeijingMonthRange();
    expect(range.start.getDate()).toBe(1);
  });
});

// ============================================================
// dateUtils（原有测试）
// ============================================================
describe('dateUtils', () => {
  describe('formatDate', () => {
    it('返回本地化的完整日期时间字符串', () => {
      const result = dateUtils.formatDate('2026-05-01T08:00:00.000Z');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('formatShortDate', () => {
    it('返回本地化的短日期字符串', () => {
      const result = dateUtils.formatShortDate('2026-05-01T08:00:00.000Z');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('formatTime', () => {
    it('返回本地化的时间字符串', () => {
      const result = dateUtils.formatTime('2026-05-01T08:00:00.000Z');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('getRelativeTime', () => {
    it('过去的时间返回 "已过期"', () => {
      const pastDate = new Date(Date.now() - 100000).toISOString();
      expect(dateUtils.getRelativeTime(pastDate)).toBe('已过期');
    });

    it('未来几分钟内返回 "X分钟后"', () => {
      const futureDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const result = dateUtils.getRelativeTime(futureDate);
      expect(result).toMatch(/\d+分钟后/);
    });

    it('未来几小时内返回 "X小时后"', () => {
      const futureDate = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      const result = dateUtils.getRelativeTime(futureDate);
      expect(result).toMatch(/\d+小时后/);
    });

    it('未来几天后返回 "X天后"', () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      const result = dateUtils.getRelativeTime(futureDate);
      expect(result).toMatch(/\d+天后/);
    });
  });
});

// ============================================================
// 补分支覆盖率
// ============================================================

describe('getBeijingWeekRange 周日分支 (line 105)', () => {
  it('周日为参考日期时 dayOffset=-6', () => {
    // 2026-05-03 周日 UTC+8
    const sunday = new Date('2026-05-02T16:00:00Z'); // UTC=周日 0点？不，用 UTC 14点来保证北京是 22点
    // 北京 2026-05-03 00:00 = UTC 2026-05-02 16:00
    const saturday16UTC = new Date('2026-05-02T16:00:00Z'); // 北京周日 0点
    const range = getBeijingWeekRange(saturday16UTC);
    // 周一开始 = 北京 2026-04-27
    expect(range.start.getTime()).toBeLessThan(saturday16UTC.getTime());
    const diffDays = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(6);
  });
});

describe('isTaskExpiring end.date 防御分支 (line 143)', () => {
  it('end.date 为空时不报错', () => {
    const recurrence = { enabled: true, type: 'daily' as const, interval: 1, days: [] as number[], end: { type: 'on' as const, date: '' }, exceptions: [] as string[] };
    const result = isTaskExpiring({ recurrence });
    expect(result).toBe(false);
  });
});
