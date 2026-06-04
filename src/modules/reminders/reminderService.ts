import { LocalNotifications } from '@capacitor/local-notifications';
import type { Habit, Weekday } from '@/types/habit';
import { formatRepeatRule, getRepeatRuleWeekdays } from '@/modules/habits/repeatRules';

export type ReminderSyncResult = {
  scheduled: boolean;
  permissionGranted: boolean;
  message: string;
};

export type ReminderPermissionStatus = {
  supported: boolean;
  display: string;
  message: string;
};

export const getReminderPermissionStatus = async (): Promise<ReminderPermissionStatus> => {
  try {
    const permission = await LocalNotifications.checkPermissions();

    return {
      supported: true,
      display: permission.display,
      message: getPermissionMessage(permission.display),
    };
  } catch {
    return {
      supported: false,
      display: 'unsupported',
      message: '当前环境暂不支持本地通知',
    };
  }
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
      message: `${habit.reminderTime} 的${formatRepeatRule(habit.repeatRule)}提醒已设置`,
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
      notifications: getHabitNotificationIds(habitId).map((id) => ({ id })),
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
  const weekdays = getRepeatRuleWeekdays(habit.repeatRule);

  await LocalNotifications.schedule({
    notifications: weekdays.map((weekday) => ({
      id: getHabitNotificationId(habit.id, weekday),
        title: '自律打卡提醒',
        body: `现在是 ${habit.name} 的时间`,
        schedule: {
          on: { weekday: toCapacitorWeekday(weekday), hour, minute },
          repeats: true,
        },
    })),
  });
};

export const sendTestReminder = async (): Promise<ReminderSyncResult> => {
  try {
    const permission = await requestReminderPermission();

    if (permission.display !== 'granted') {
      return {
        scheduled: false,
        permissionGranted: false,
        message: '通知权限未开启，无法发送测试提醒',
      };
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 900001,
          title: '自律打卡测试提醒',
          body: '如果你看到这条通知，说明本地提醒可以工作。',
          schedule: {
            at: new Date(Date.now() + 1000),
          },
        },
      ],
    });

    return {
      scheduled: true,
      permissionGranted: true,
      message: '测试提醒已发送',
    };
  } catch {
    return {
      scheduled: false,
      permissionGranted: false,
      message: '当前环境暂不支持本地通知',
    };
  }
};

const getPermissionMessage = (display: string) => {
  if (display === 'granted') {
    return '通知权限已开启';
  }

  if (display === 'denied') {
    return '通知权限已拒绝，请在系统设置中开启';
  }

  return '通知权限尚未确认';
};

const getHabitNotificationIds = (habitId: string) => [
  Math.abs(hashString(habitId)),
  ...([0, 1, 2, 3, 4, 5, 6] as const).map((weekday) => getHabitNotificationId(habitId, weekday)),
];

const getHabitNotificationId = (habitId: string, weekday: number) => Math.abs(hashString(`${habitId}:${weekday}`));

const toCapacitorWeekday = (weekday: Weekday) => (weekday === 0 ? 1 : weekday + 1);

const hashString = (value: string) =>
  value.split('').reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0);
