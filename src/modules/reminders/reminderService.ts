import { LocalNotifications } from '@capacitor/local-notifications';
import type { Habit } from '@/types/habit';

export const requestReminderPermission = () => LocalNotifications.requestPermissions();

export const scheduleDailyReminder = async (habit: Habit) => {
  if (!habit.reminderEnabled) {
    return;
  }

  const [hour, minute] = habit.reminderTime.split(':').map(Number);

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Math.abs(hashString(habit.id)),
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

const hashString = (value: string) =>
  value.split('').reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0);
