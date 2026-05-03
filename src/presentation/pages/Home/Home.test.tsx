import { Task } from '@/types';
import { getBeijingTime, toBeijingTime } from '../../../utils/dateUtils';

const mockTasks: Task[] = [
  {
    id: '1',
    title: '任务1',
    description: '测试任务1',
    dueDate: new Date().toISOString(),
    priority: 'medium',
    completed: false,
    createdAt: new Date().toISOString(),
    subtasks: [],
    startDate: new Date().toISOString(),
    taskType: 'single',
    recurrence: { enabled: false, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
    reminderEnabled: false,
    notificationId: 0,
    completedDates: []
  },
  {
    id: '2',
    title: '任务2',
    description: '测试任务2',
    dueDate: new Date().toISOString(),
    priority: 'medium',
    completed: false,
    createdAt: new Date().toISOString(),
    subtasks: [],
    startDate: new Date().toISOString(),
    taskType: 'single',
    recurrence: { enabled: false, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
    reminderEnabled: false,
    notificationId: 0,
    completedDates: []
  }
];

function getTodaySortedTasks(tasks: Task[]): Task[] {
  const beijingTime = getBeijingTime();
  const todayStr = beijingTime.toISOString().split('T')[0];
  const todayStart = new Date(todayStr);
  todayStart.setHours(0, 0, 0, 0);

  return tasks
    .filter(task => {
      const taskDate = new Date(task.dueDate);
      const taskBeijingTime = toBeijingTime(taskDate);
      const taskDateStr = taskBeijingTime.toISOString().split('T')[0];
      const isSameDay = taskDateStr === todayStr;

      let isRecurringToday = false;
      if (task.recurrence.enabled) {
        const taskStartDate = new Date(task.startDate);
        taskStartDate.setHours(0, 0, 0, 0);
        const isAfterStartDate = todayStart >= taskStartDate;
        let isBeforeEndDate = true;
        if (task.recurrence.end.type === 'on' && task.recurrence.end.date) {
          const endDate = new Date(task.recurrence.end.date);
          endDate.setHours(23, 59, 59, 999);
          isBeforeEndDate = todayStart <= endDate;
        }
        isRecurringToday = isAfterStartDate && isBeforeEndDate;
      }

      return isSameDay || isRecurringToday;
    })
    .sort((a, b) => {
      const timeA = new Date(a.dueDate).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      const timeB = new Date(b.dueDate).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      if (timeA !== timeB) return timeA.localeCompare(timeB);
      if (a.createdAt && b.createdAt) return a.createdAt.localeCompare(b.createdAt);
      return a.id.localeCompare(b.id);
    });
}

describe('Home Page - todayTasks calculation', () => {
  it('should display all today tasks', () => {
    const result = getTodaySortedTasks(mockTasks);
    expect(result).toHaveLength(2);
    expect(result.map(task => task.id)).toEqual(['1', '2']);
  });

  it('should display recurring tasks that start today', () => {
    const recurringTask: Task = {
      id: '4',
      title: '重复任务',
      description: '每天重复',
      dueDate: new Date().toISOString(),
      priority: 'medium',
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: [],
      startDate: new Date().toISOString(),
      taskType: 'recurring',
      recurrence: { enabled: true, type: 'daily', interval: 1, days: [], end: { type: 'never' }, exceptions: [] },
      reminderEnabled: false,
      notificationId: 0,
      completedDates: []
    };

    const result = getTodaySortedTasks([recurringTask]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });
});
