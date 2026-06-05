import { LocalNotifications } from '@capacitor/local-notifications';
import type { Habit, Weekday } from '@/types/habit';
import { formatRepeatRule, getRepeatRuleWeekdays } from '@/modules/habits/repeatRules';

const reminderChannelId = 'habit-reminders';

export type ReminderSyncResult = {
  scheduled: boolean;
  permissionGranted: boolean;
  message: string;
};

export type ReminderPermissionStatus = {
  supported: boolean;
  display: string;
  exactAlarm?: string;
  pendingCount?: number;
  message: string;
};

export const getReminderPermissionStatus = async (): Promise<ReminderPermissionStatus> => {
  try {
    const permission = await LocalNotifications.checkPermissions();
    const exactAlarm = await checkExactAlarmStatus();
    const pendingCount = await getPendingReminderCount();

    return {
      supported: true,
      display: permission.display,
      exactAlarm,
      pendingCount,
      message: getPermissionMessage(permission.display, exactAlarm, pendingCount),
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

export const openExactAlarmSettings = async (): Promise<ReminderSyncResult> => {
  try {
    const status = await LocalNotifications.checkExactNotificationSetting();

    if (status.exact_alarm === 'granted') {
      return {
        scheduled: false,
        permissionGranted: true,
        message: '精确闹钟已允许',
      };
    }

    await LocalNotifications.changeExactNotificationSetting();

    return {
      scheduled: false,
      permissionGranted: false,
      message: '已打开系统精确闹钟设置，开启后请回到 App 重新保存任务提醒',
    };
  } catch {
    return {
      scheduled: false,
      permissionGranted: false,
      message: '当前设备不支持打开精确闹钟设置',
    };
  }
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

    await ensureReminderChannel();
    await scheduleDailyReminder(habit);
    const pendingCount = await getPendingReminderCount(habit.id);
    const exactAlarm = await checkExactAlarmStatus();

    return {
      scheduled: true,
      permissionGranted: true,
      message: `${habit.reminderTime} 的${formatRepeatRule(habit.repeatRule)}提醒已设置，已排入 ${pendingCount ?? 0} 条提醒${exactAlarm === 'denied' ? '；如果仍不响，请在系统设置里允许精确闹钟' : ''}`,
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
      body: `现在是 ${habit.name} 的时间，别装没看见。`,
      channelId: reminderChannelId,
      autoCancel: true,
      schedule: {
        on: { weekday: toCapacitorWeekday(weekday), hour, minute, second: 0 },
        allowWhileIdle: true,
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

    await ensureReminderChannel();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 900001,
          title: '自律打卡测试提醒',
          body: '如果你看到这条通知，说明本地提醒可以工作。',
          channelId: reminderChannelId,
          autoCancel: true,
          schedule: {
            at: new Date(Date.now() + 1000),
            allowWhileIdle: true,
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

const ensureReminderChannel = async () => {
  try {
    await LocalNotifications.createChannel({
      id: reminderChannelId,
      name: '打卡提醒',
      description: '用于每天到点提醒你执行打卡任务',
      importance: 5,
      visibility: 1,
      lights: true,
      vibration: true,
    });
  } catch {
    // Notification channels are Android-only; web preview can ignore this.
  }
};

const checkExactAlarmStatus = async () => {
  try {
    const status = await LocalNotifications.checkExactNotificationSetting();
    return status.exact_alarm;
  } catch {
    return undefined;
  }
};

const getPendingReminderCount = async (habitId?: string) => {
  try {
    const pending = await LocalNotifications.getPending();
    const notificationIds = habitId ? new Set(getHabitNotificationIds(habitId)) : undefined;
    return pending.notifications.filter((notification) => !notificationIds || notificationIds.has(notification.id)).length;
  } catch {
    return undefined;
  }
};

const getPermissionMessage = (display: string, exactAlarm?: string, pendingCount?: number) => {
  if (display === 'granted') {
    if (exactAlarm === 'denied') {
      return `通知权限已开启，但精确闹钟未允许；当前已排入 ${pendingCount ?? 0} 条提醒，可能不会准点响`;
    }

    return `通知权限已开启，当前已排入 ${pendingCount ?? 0} 条提醒`;
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
