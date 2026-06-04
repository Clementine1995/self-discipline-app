import { LocalNotifications } from '@capacitor/local-notifications';
import type { Habit } from '@/types/habit';

export type ReminderSyncResult = {
  scheduled: boolean;
  permissionGranted: boolean;
  message: string;
};

export const requestReminderPermission = async () => {
  const currentPermission = await LocalNotifications.checkPermissions();

  if (currentPermission.display === 'granted') {
    return currentPermission;
  }

  return LocalNotifications.requestPermissions();
};

export const syncDailyReminder = async (habit: Habit): Promise<ReminderSyncResult> => {
  try {
    await cancelDailyReminder(habit.id);

    if (!habit.reminderEnabled) {
      return {
        scheduled: false,
        permissionGranted: true,
        message: '提醒已关闭',
      };
    }

    const permission = await requestReminderPermission();

    if (permission.display !== 'granted') {
      return {
        scheduled: false,
        permissionGranted: false,
        message: '任务已保存，但通知权限未开启，暂时不会提醒',
      };
    }

    await scheduleDailyReminder(habit);

    return {
      scheduled: true,
      permissionGranted: true,
      message: `${habit.reminderTime} 的每日提醒已设置`,
    };
  } catch {
    return {
      scheduled: false,
      permissionGranted: false,
      message: '任务已保存，当前环境暂不支持本地通知',
    };
  }
};

export const cancelDailyReminder = async (habitId: string) => {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: getHabitNotificationId(habitId) }],
    });
  } catch {
    // Browser preview may not support Capacitor local notifications.
  }
};

export const scheduleDailyReminder = async (habit: Habit) => {
  if (!habit.reminderEnabled) {
    return;
  }

  const [hour, minute] = habit.reminderTime.split(':').map(Number);

  await LocalNotifications.schedule({
    notifications: [
      {
        id: getHabitNotificationId(habit.id),
        title: '自律打卡提醒',
        body: `现在是 ${habit.name} 的时间`,
        schedule: {
          on: { hour, minute },
          repeats: true,
        },
      },
    ],
  });
};

const getHabitNotificationId = (habitId: string) => Math.abs(hashString(habitId));

const hashString = (value: string) =>
  value.split('').reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0);
