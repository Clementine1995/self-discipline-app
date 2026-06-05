import { LocalNotifications } from '@capacitor/local-notifications';
import type { Habit } from '@/types/habit';
import { formatRepeatRule, shouldHabitRunOnDate } from '@/modules/habits/repeatRules';
import { addDays, toDateKey } from '@/utils/date';

const reminderChannelId = 'habit-reminders';
const scheduledReminderSlots = 1;
const maxJavaInt = 2_147_483_647;

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
    const upcomingReminderDates = getUpcomingReminderDates(habit);

    if (upcomingReminderDates.length === 0) {
      return {
        scheduled: false,
        permissionGranted: true,
        message: `${habit.reminderTime} 的${formatRepeatRule(habit.repeatRule)}没有算出未来提醒时间，请检查重复规则是否包含接下来的日期`,
      };
    }

    const scheduledIds = await scheduleDailyReminder(habit, upcomingReminderDates);
    const pendingCount = await getPendingReminderCount(habit.id);
    const exactAlarm = await checkExactAlarmStatus();
    const nextReminderText = formatReminderDate(upcomingReminderDates[0]);

    return {
      scheduled: true,
      permissionGranted: true,
      message: `${habit.reminderTime} 的${formatRepeatRule(habit.repeatRule)}提醒已设置；已计算 ${upcomingReminderDates.length} 条，系统确认 ${pendingCount ?? 0} 条，下一次 ${nextReminderText}${scheduledIds.length === 0 ? '；但 native schedule 没返回 id' : ''}${exactAlarm === 'denied' ? '；通知权限已开，但准点触发还需要允许“闹钟与提醒”' : ''}`,
    };
  } catch (error) {
    return {
      scheduled: false,
      permissionGranted: false,
      message: `任务已保存，但本地通知排入失败：${getErrorMessage(error)}`,
    };
  }
};

export const reconcileHabitReminders = async (habits: Habit[]) => {
  try {
    const permission = await LocalNotifications.checkPermissions();

    if (permission.display !== 'granted') {
      return;
    }

    await ensureReminderChannel();

    for (const habit of habits) {
      await cancelDailyReminder(habit.id);

      if (habit.reminderEnabled) {
        await scheduleDailyReminder(habit);
      }
    }
  } catch {
    // Keep app startup quiet if the native notification plugin is unavailable.
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

export const scheduleDailyReminder = async (habit: Habit, reminderDates = getUpcomingReminderDates(habit)) => {
  if (!habit.reminderEnabled) {
    return [];
  }

  if (reminderDates.length === 0) {
    return [];
  }

  const result = await LocalNotifications.schedule({
    notifications: reminderDates.map((at, slot) => ({
      id: getHabitNotificationId(habit.id, slot),
      title: '自律打卡提醒',
      body: `现在是 ${habit.name} 的时间，别装没看见。`,
      channelId: reminderChannelId,
      autoCancel: true,
      schedule: {
        at,
        allowWhileIdle: true,
      },
    })),
  });

  return result.notifications.map((notification) => notification.id);
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
  } catch (error) {
    return {
      scheduled: false,
      permissionGranted: false,
      message: `测试通知发送失败：${getErrorMessage(error)}`,
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
    const notificationIds = habitId ? new Set(getHabitNotificationIds(habitId).map(String)) : undefined;
    return pending.notifications.filter((notification) => !notificationIds || notificationIds.has(String(notification.id))).length;
  } catch {
    return undefined;
  }
};

const getPermissionMessage = (display: string, exactAlarm?: string, pendingCount?: number) => {
  if (display === 'granted') {
    if (exactAlarm === 'denied') {
      return `通知权限已开启；闹钟与提醒未允许，测试通知能响，但定时任务可能不会准点触发。当前已排入未来 ${pendingCount ?? 0} 条提醒`;
    }

    return `通知权限已开启；闹钟与提醒也可用。当前已排入未来 ${pendingCount ?? 0} 条提醒`;
  }

  if (display === 'denied') {
    return '通知权限已拒绝，请在系统设置中开启';
  }

  return '通知权限尚未确认';
};

const getUpcomingReminderDates = (habit: Habit) => {
  const [hour, minute] = habit.reminderTime.split(':').map(Number);
  const now = new Date();
  const upcomingReminderDates: Date[] = [];

  for (let dayOffset = 0; upcomingReminderDates.length < scheduledReminderSlots && dayOffset < 90; dayOffset += 1) {
    const candidate = addDays(now, dayOffset);
    candidate.setHours(hour, minute, 0, 0);

    if (candidate <= now) {
      continue;
    }

    if (shouldHabitRunOnDate(habit, toDateKey(candidate))) {
      upcomingReminderDates.push(candidate);
    }
  }

  return upcomingReminderDates;
};

const getHabitNotificationIds = (habitId: string) =>
  [
    toJavaIntId(hashString(habitId)),
    ...Array.from({ length: scheduledReminderSlots }, (_, slot) => getHabitNotificationId(habitId, slot)),
  ].filter((id, index, ids) => ids.indexOf(id) === index);

const getHabitNotificationId = (habitId: string, slot: number) => toJavaIntId(hashString(`${habitId}:${slot}`));

const formatReminderDate = (date: Date) =>
  date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return '未知错误';
  }
};

const toJavaIntId = (value: number) => {
  const id = Math.abs(value) % maxJavaInt;
  return id === 0 ? 1 : id;
};

const hashString = (value: string) =>
  value.split('').reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0);
