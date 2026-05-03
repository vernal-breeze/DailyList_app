// 基础日期工具函数
export const dateUtils = {
  // 格式化日期为本地字符串
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  },

  // 格式化日期为短日期
  formatShortDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  },

  // 格式化时间
  formatTime: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  },

  // 获取相对时间描述
  getRelativeTime: (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((date.getTime() - now.getTime()) / (1000 * 60));

    if (diffInMinutes < 0) {
      return '已过期';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟后`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}小时后`;
    } else {
      const days = Math.floor(diffInMinutes / (24 * 60));
      return `${days}天后`;
    }
  }
};

// 北京时间（UTC+8）工具函数 - 完全重写，正确处理时区

// 获取当前北京时间 Date 对象
export function getBeijingTime(): Date {
  const now = new Date();
  const offset = 8; // 北京时间是 UTC+8
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const beijingTime = new Date(utc + offset * 60 * 60 * 1000);
  return beijingTime;
}

// 将任意日期转换为北京时间 Date 对象
export function toBeijingTime(date: Date): Date {
  const offset = 8; // 北京时间是 UTC+8
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const beijingTime = new Date(utc + offset * 60 * 60 * 1000);
  return beijingTime;
}

// 将日期转换为本地时区显示，但实际上保持 UTC+8 时间
// 或者更准确地说：获取北京时间的各个部分
export function getBeijingDateParts(date: Date) {
  const beijingDate = toBeijingTime(date);
  return {
    year: beijingDate.getUTCFullYear(),
    month: beijingDate.getUTCMonth(),
    date: beijingDate.getUTCDate(),
    day: beijingDate.getUTCDay(),
    hours: beijingDate.getUTCHours(),
    minutes: beijingDate.getUTCMinutes(),
    seconds: beijingDate.getUTCSeconds()
  };
}

// 格式化日期为北京时间字符串
export function formatBeijingTime(date: Date): string {
  const { year, month, date: day, hours, minutes } = getBeijingDateParts(date);
  const paddedMonth = String(month + 1).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');
  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');
  return `${year}/${paddedMonth}/${paddedDay} ${paddedHours}:${paddedMinutes} 北京时间`;
}

// 格式化日期为短日期格式（不带时间
export function formatBeijingDate(date: Date): string {
  const { year, month, date: day } = getBeijingDateParts(date);
  const paddedMonth = String(month + 1).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');
  return `${year}/${paddedMonth}/${paddedDay}`;
}

// 格式化时间为北京时间格式（不带日期）
export function formatBeijingTimeOnly(date: Date): string {
  const { hours, minutes } = getBeijingDateParts(date);
  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');
  return `${paddedHours}:${paddedMinutes}`;
}

// 获取本周的开始和结束日期（北京时间，周一开始）
export function getBeijingWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const parts = getBeijingDateParts(date);
  // 周日是 0，调整到周一为开始
  const dayOffset = parts.day === 0 ? -6 : 1 - parts.day;
  
  // 创建北京时间的开始日期
  const start = new Date();
  start.setUTCFullYear(parts.year, parts.month, parts.date + dayOffset);
  start.setUTCHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  
  return { start, end };
}

// 检查日期是否在本周内（北京时间）
export function isInCurrentWeek(date: Date): boolean {
  const { start, end } = getBeijingWeekRange();
  const checkDate = toBeijingTime(date);
  // 将 checkDate 转换为 UTC+8 的纯时间戳比较
  return checkDate.getTime() >= start.getTime() && checkDate.getTime() <= end.getTime();
}

// 获取下一个自然日的北京时间
export function getNextBeijingDay(date: Date): Date {
  const parts = getBeijingDateParts(date);
  const nextDate = new Date();
  nextDate.setUTCFullYear(parts.year, parts.month, parts.date + 1);
  nextDate.setUTCHours(parts.hours, parts.minutes, parts.seconds);
  return nextDate;
}

// 检查任务是否即将到期（距离结束日期≤3天，北京时间）
export function isTaskExpiring(task: any): boolean {
  if (!task.recurrence.enabled || task.recurrence.end.type !== 'on') {
    return false;
  }

  const beijingNow = getBeijingTime();
  const endDate = toBeijingTime(new Date(task.recurrence.end.date || 0));
  const diffTime = endDate.getTime() - beijingNow.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= 3;
}

// 检查日期是否是今天（基于北京时区）
export function isToday(date: Date | string | number): boolean {
  if (!date) return false;
  const target = new Date(date);
  const now = new Date();

  // 使用统一的格式化器，强制指定北京时区
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  // 对比格式化后的字符串，例如 "2026/04/27" === "2026/04/27"
  return formatter.format(target) === formatter.format(now);
}

// 向后兼容别名
export { isToday as isBeijingToday };

// 检查日期是否已过去（早于今天零点）
export function isPast(date: Date | string | number): boolean {
  if (!date) return false;
  const target = new Date(date);
  const now = new Date();

  // 将当前时间的时分秒清零，只对比日期边界
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // 将目标时间的时分秒也清零
  const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();

  // 只有早于今天 0 点的才算过去
  return targetDate < todayStart;
}

// 向后兼容别名
export { isPast as isBeijingPast };

// 3. 获取本地时区（北京时间）的 YYYY-MM-DD 字符串
export function getLocalFormattedDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 4. 获取本地时区（北京时间）的 YYYY-MM-DD 字符串（使用 UTC 方法，保证跨时区一致性）
// 验证：getLocalDateStr(new Date("2026-04-28")) === "2026-04-28" 在任何时区下都成立
export function getLocalDateStr(date: Date): string {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// 4. 获取本月的范围
export function getBeijingMonthRange(date: Date = getBeijingTime()): { start: Date; end: Date } {
  const beijingDate = toBeijingTime(date);
  const start = new Date(beijingDate.getFullYear(), beijingDate.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(beijingDate.getFullYear(), beijingDate.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}