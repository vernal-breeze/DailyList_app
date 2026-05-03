import { Task } from '../types';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// 通知渠道ID
const NOTIFICATION_CHANNEL_ID = 'task-reminders';

// 初始化通知渠道
export async function initializeNotificationChannel(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: NOTIFICATION_CHANNEL_ID,
        name: '任务提醒',
        description: '任务到期提醒通知',
        importance: 5,
        lightColor: '#FF231F7C'
      });
    } catch (error) {
      console.error('初始化通知渠道失败:', error);
    }
  }
}

// 请求通知权限
export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('请求通知权限失败:', error);
      return false;
    }
  }
  return true;
}

export async function checkNotificationPermission(): Promise<{ display: 'granted' | 'denied' }> {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await LocalNotifications.checkPermissions();
      return { display: result.display === 'granted' ? 'granted' : 'denied' };
    } catch (error) {
      console.error('检查通知权限失败:', error);
      return { display: 'denied' };
    }
  }
  return { display: 'granted' };
}

export function calculateNotificationTime(task: Task): Date | null {
  const dueDate = new Date(task.dueDate);
  const startDate = new Date(task.startDate);
  const now = new Date();

  if (!task.recurrence.enabled) {
    return dueDate > now ? dueDate : null;
  }

  if (startDate > now) {
    return startDate;
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(dueDate.getHours(), dueDate.getMinutes(), 0, 0);
  return tomorrow;
}

// 调度任务通知
export async function scheduleTaskNotification(task: Task): Promise<void> {
  if (!task.reminderEnabled || !Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const dueDate = new Date(task.dueDate);
    const now = new Date();

    // 确保通知时间在当前时间之后
    if (dueDate <= now) {
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: task.notificationId,
          title: '任务提醒',
          body: task.title,
          extra: { taskId: task.id },
          schedule: {
            at: dueDate,
            allowWhileIdle: true
          },
          channelId: NOTIFICATION_CHANNEL_ID,
          sound: 'default'
        }
      ]
    });
  } catch (error) {
    console.error('调度通知失败:', error);
  }
}

// 取消任务通知
export async function cancelTaskNotification(task: Task): Promise<void> {
  if (!task.notificationId || !Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: task.notificationId }]
    });
  } catch (error) {
    console.error('取消通知失败:', error);
  }
}

export async function rescheduleAllNotifications(tasks: Task[]): Promise<void> {
  for (const task of tasks) {
    if (task.reminderEnabled && !task.completed) {
      await scheduleTaskNotification(task);
    }
  }
}

// 注册通知监听器
export function registerNotificationListeners(onNotificationClick: (taskId: string) => void): void {
  if (Capacitor.isNativePlatform()) {
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      const taskId = notification.notification.extra?.taskId;
      if (taskId) {
        onNotificationClick(taskId);
      }
    });
  }
}

// 取消所有通知
export async function cancelAllNotifications(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.cancel({ notifications: [] });
    } catch (error) {
      console.error('取消所有通知失败:', error);
    }
  }
}
