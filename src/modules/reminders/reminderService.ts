import { LocalNotifications } from '@capacitor/local-notifications';
import type { CheckIn, Habit } from '@/types/habit';
import { formatRepeatRule, shouldHabitBeActiveOnDate } from '@/modules/habits/repeatRules';
import { checkinRepository } from '@/modules/checkins/checkinRepository';
import { appSettingsRepository, type ReminderIntensity } from '@/modules/settings/settingsRepository';
import { addDays, toDateKey } from '@/utils/date';

const normalReminderChannelId = 'habit-reminders-normal';
const strongReminderChannelId = 'habit-reminders-alarm-v2';
const strongReminderSound = 'discipline_alert.wav';
const maxScheduledReminderSlots = 30;
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
        message: '已设为全天任务，不会发送本地提醒',
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

    const settings = await appSettingsRepository.get();
    await ensureReminderChannel(settings.reminderIntensity);
    const checkIns = await checkinRepository.getAll();
    const upcomingReminderDates = getUpcomingReminderDates(habit, settings.reminderScheduleCount, checkIns);

    if (upcomingReminderDates.length === 0) {
      return {
        scheduled: false,
        permissionGranted: true,
        message: `${habit.reminderTime} 的${formatRepeatRule(habit.repeatRule)}没有算出未来提醒时间，请检查重复规则是否包含接下来的日期`,
      };
    }

    const scheduledIds = await scheduleDailyReminder(habit, upcomingReminderDates);
    const exactAlarm = await checkExactAlarmStatus();
    const nextReminderText = formatReminderDate(upcomingReminderDates[0]);

    return {
      scheduled: true,
      permissionGranted: true,
      message: `${habit.reminderTime} 的${formatRepeatRule(habit.repeatRule)}提醒已设置，下一次 ${nextReminderText}${scheduledIds.length === 0 ? '；如未响请到设置页查看排查信息' : ''}${exactAlarm === 'denied' ? '；准点触发还需要允许“闹钟与提醒”' : ''}`,
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

    const settings = await appSettingsRepository.get();
    await ensureReminderChannel(settings.reminderIntensity);
    const checkIns = await checkinRepository.getAll();
    await cancelStaleReminderNotifications(habits);

    for (const habit of habits) {
      await cancelDailyReminder(habit.id);

      if (habit.reminderEnabled) {
        await scheduleDailyReminder(habit, undefined, settings.reminderScheduleCount, settings.reminderIntensity, checkIns);
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

export const scheduleDailyReminder = async (
  habit: Habit,
  reminderDates?: Date[],
  reminderScheduleCount?: number,
  reminderIntensity?: ReminderIntensity,
  checkIns?: CheckIn[],
) => {
  if (!habit.reminderEnabled) {
    return [];
  }

  const settings = await appSettingsRepository.get();
  const intensity = reminderIntensity ?? settings.reminderIntensity;
  const activeCheckIns = checkIns ?? (await checkinRepository.getAll());
  const dates = reminderDates ?? getUpcomingReminderDates(habit, reminderScheduleCount ?? settings.reminderScheduleCount, activeCheckIns);

  if (dates.length === 0) {
    return [];
  }

  await ensureReminderChannel(intensity);

  const result = await LocalNotifications.schedule({
    notifications: dates.map((at, slot) => buildHabitReminderNotification(habit, at, slot, intensity)),
  });

  return result.notifications.map((notification) => notification.id);
};

export const scheduleFollowupReminder = async (habit: Habit, at: Date) => {
  const permission = await requestReminderPermission();

  if (permission.display !== 'granted') {
    return undefined;
  }

  const settings = await appSettingsRepository.get();
  const intensity = settings.reminderIntensity;
  await ensureReminderChannel(intensity);

  const notification = {
    ...buildHabitReminderNotification(habit, at, maxScheduledReminderSlots + 1, intensity),
    id: getFollowupNotificationId(habit.id, toDateKey(at)),
    title: `别继续拖：${habit.name}`,
    body: '推迟时间到了，现在处理这件事。',
    largeBody: `你刚才已经推迟过「${habit.name}」。现在打开 App 处理，别让 10 分钟变成一整晚。`,
  };

  await LocalNotifications.cancel({
    notifications: [{ id: notification.id }],
  });
  const result = await LocalNotifications.schedule({
    notifications: [notification],
  });

  return result.notifications[0]?.id;
};

export const cancelFollowupReminder = async (habitId: string, date = toDateKey(new Date())) => {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: getFollowupNotificationId(habitId, date) }],
    });
  } catch {
    // Browser preview may not support Capacitor local notifications.
  }
};

export const cancelStaleReminderNotifications = async (habits: Habit[]) => {
  try {
    const today = toDateKey(new Date());
    const activeHabitIds = new Set(habits.map((habit) => habit.id));
    const pending = await LocalNotifications.getPending();
    const staleNotifications = pending.notifications.filter((notification) => {
      const extra = notification.extra as { type?: string; habitId?: string; date?: string } | undefined;

      return isStaleReminderExtra(extra, activeHabitIds, today);
    });

    if (staleNotifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: staleNotifications.map((notification) => ({ id: notification.id })),
      });
    }

    const delivered = await LocalNotifications.getDeliveredNotifications();
    const staleDeliveredNotifications = delivered.notifications.filter((notification) => {
      const extra = (notification.extra ?? notification.data) as { type?: string; habitId?: string; date?: string } | undefined;
      return isStaleReminderExtra(extra, activeHabitIds, today);
    });

    if (staleDeliveredNotifications.length > 0) {
      await LocalNotifications.removeDeliveredNotifications({
        notifications: staleDeliveredNotifications,
      });
    }
  } catch {
    // Browser preview may not support Capacitor local notifications.
  }
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

    const settings = await appSettingsRepository.get();
    await ensureReminderChannel(settings.reminderIntensity);
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 900001,
          title: settings.reminderIntensity === 'strong' ? '自律打卡强提醒测试' : '自律打卡提醒测试',
          body: settings.reminderIntensity === 'strong' ? '这条测试会使用强提醒渠道。' : '这条测试会使用普通提醒渠道。',
          largeBody:
            settings.reminderIntensity === 'strong'
              ? '这条测试会使用强提醒渠道：高重要性、震动、锁屏可见、展开后显示完整提醒内容。'
              : '这条测试会使用普通提醒渠道：会正常响铃/展示，但文案和打扰程度更克制。',
          summaryText: settings.reminderIntensity === 'strong' ? '强提醒测试' : '普通提醒测试',
          channelId: getReminderChannelId(settings.reminderIntensity),
          ...(settings.reminderIntensity === 'strong' ? { sound: strongReminderSound } : {}),
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

const ensureReminderChannel = async (intensity: ReminderIntensity) => {
  try {
    if (intensity === 'normal') {
      await LocalNotifications.createChannel({
        id: normalReminderChannelId,
        name: '打卡提醒',
        description: '用于到点提醒你执行自律任务',
        importance: 4,
        visibility: 1,
        lights: true,
        lightColor: '#0f766e',
        vibration: true,
      });
      return;
    }

    await LocalNotifications.createChannel({
      id: strongReminderChannelId,
      name: '打卡强提醒',
      description: '用于到点后更明显地提醒你执行自律任务',
      importance: 5,
      visibility: 1,
      lights: true,
      lightColor: '#ef4444',
      sound: strongReminderSound,
      vibration: true,
    });
  } catch {
    // Notification channels are Android-only; web preview can ignore this.
  }
};

const buildHabitReminderNotification = (habit: Habit, at: Date, slot: number, intensity: ReminderIntensity) => {
  const repeatLabel = formatRepeatRule(habit.repeatRule);

  if (intensity === 'normal') {
    return {
      id: getHabitNotificationId(habit.id, slot),
      title: `打卡提醒：${habit.name}`,
      body: `${habit.reminderTime} 到了，记得完成今天这一项。`,
      largeBody: `${habit.reminderTime} 到了，任务是「${habit.name}」。\n\n完成后回到 App 打卡，保持今天的节奏。\n重复规则：${repeatLabel}`,
      summaryText: '今日自律任务',
      channelId: getReminderChannelId(intensity),
      extra: buildReminderNotificationExtra(habit, at),
      autoCancel: true,
      group: 'habit-reminders',
      schedule: {
        at,
        allowWhileIdle: true,
      },
    };
  }

  return {
    id: getHabitNotificationId(habit.id, slot),
    title: `该打卡了：${habit.name}`,
    body: `${habit.reminderTime} 到了，今天这项别滑过去。`,
    largeBody: `${habit.reminderTime} 到了，任务是「${habit.name}」。\n\n现在打开 App 打卡，别让这次提醒变成背景噪音。\n重复规则：${repeatLabel}`,
    summaryText: '今日必须处理的自律任务',
    channelId: getReminderChannelId(intensity),
    sound: strongReminderSound,
    extra: buildReminderNotificationExtra(habit, at),
    autoCancel: true,
    group: 'habit-reminders',
    schedule: {
      at,
      allowWhileIdle: true,
    },
  };
};

const getReminderChannelId = (intensity: ReminderIntensity) =>
  intensity === 'strong' ? strongReminderChannelId : normalReminderChannelId;

const buildReminderNotificationExtra = (habit: Habit, at: Date) => ({
  type: 'habit-reminder',
  habitId: habit.id,
  date: toDateKey(at),
  remindedAt: at.toISOString(),
});

const isStaleReminderExtra = (
  extra: { type?: string; habitId?: string; date?: string } | undefined,
  activeHabitIds: Set<string>,
  today: string,
) =>
  extra?.type === 'habit-reminder' &&
  (!extra.habitId || !activeHabitIds.has(extra.habitId) || Boolean(extra.date && extra.date < today));

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
      return '通知权限已开启；闹钟与提醒未允许，测试通知能响，但定时任务可能不会准点触发。';
    }

    return `通知权限已开启；闹钟与提醒也可用。${pendingCount === 0 ? '当前还没有排入提醒。' : '任务提醒可以正常工作。'}`;
  }

  if (display === 'denied') {
    return '通知权限已拒绝，请在系统设置中开启';
  }

  return '通知权限尚未确认';
};

const getUpcomingReminderDates = (habit: Habit, reminderScheduleCount: number, checkIns: CheckIn[]) => {
  const [hour, minute] = habit.reminderTime.split(':').map(Number);
  const now = new Date();
  const upcomingReminderDates: Date[] = [];

  for (let dayOffset = 0; upcomingReminderDates.length < reminderScheduleCount && dayOffset < 90; dayOffset += 1) {
    const candidate = addDays(now, dayOffset);
    candidate.setHours(hour, minute, 0, 0);

    if (candidate <= now) {
      continue;
    }

    if (shouldHabitBeActiveOnDate(habit, checkIns, toDateKey(candidate))) {
      upcomingReminderDates.push(candidate);
    }
  }

  return upcomingReminderDates;
};

const getHabitNotificationIds = (habitId: string) =>
  [
    toJavaIntId(hashString(habitId)),
    ...Array.from({ length: maxScheduledReminderSlots }, (_, slot) => getHabitNotificationId(habitId, slot)),
    ...Array.from({ length: maxScheduledReminderSlots }, (_, dayOffset) =>
      getFollowupNotificationId(habitId, toDateKey(addDays(new Date(), dayOffset))),
    ),
  ].filter((id, index, ids) => ids.indexOf(id) === index);

const getHabitNotificationId = (habitId: string, slot: number) => toJavaIntId(hashString(`${habitId}:${slot}`));

const getFollowupNotificationId = (habitId: string, date: string) => toJavaIntId(hashString(`${habitId}:${date}:followup`));

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
