import type { Habit } from '@/types/habit';
import { habitRepository } from '@/modules/habits/habitRepository';
import { checkinService } from '@/modules/checkins/checkinService';
import { defaultRepeatRule, normalizeRepeatRule } from '@/modules/habits/repeatRules';
import { cancelDailyReminder, cancelStaleReminderNotifications, type ReminderSyncResult, syncDailyReminder } from '@/modules/reminders/reminderService';
import { reminderActionService } from '@/modules/reminderActions/reminderActionService';

export type HabitDraft = {
  name: string;
  reminderTime: string;
  reminderEnabled: boolean;
  repeatRule: Habit['repeatRule'];
  rewardText: string;
  punishmentText: string;
  failureThreshold: number;
};

export type HabitWriteResult = {
  habit: Habit;
  reminder: ReminderSyncResult;
};

export const createEmptyHabitDraft = (): HabitDraft => ({
  name: '',
  reminderTime: getCurrentReminderTime(),
  reminderEnabled: true,
  repeatRule: defaultRepeatRule,
  rewardText: '',
  punishmentText: '',
  failureThreshold: 3,
});

export const habitService = {
  async listHabits() {
    const hasStoredHabits = await habitRepository.hasValue();
    const habits = (await habitRepository.getAll()).map(normalizeHabit);

    if (hasStoredHabits) {
      await habitRepository.saveAll(habits);
      return habits;
    }

    await habitRepository.saveAll([]);
    return [];
  },

  async createHabit(draft: HabitDraft) {
    const now = new Date().toISOString();
    const habit: Habit = {
      ...normalizeHabitDraft(draft),
      id: createId(),
      createdAt: now,
      updatedAt: now,
    };

    const habits = await habitRepository.getAll();
    const nextHabits = [...habits, habit];
    await habitRepository.saveAll(nextHabits);
    const reminder = await syncDailyReminder(habit);
    return { habit, reminder };
  },

  async updateHabit(id: string, draft: HabitDraft) {
    const habits = await habitRepository.getAll();
    const nextHabits = habits.map((habit) =>
      habit.id === id
        ? {
            ...habit,
            ...normalizeHabitDraft(draft),
            updatedAt: new Date().toISOString(),
          }
        : habit,
    );

    await habitRepository.saveAll(nextHabits);
    const habit = nextHabits.find((item) => item.id === id);

    if (habit) {
      const reminder = await syncDailyReminder(habit);
      return { habit, reminder };
    }

    return undefined;
  },

  async deleteHabit(id: string) {
    const habits = await habitRepository.getAll();
    const nextHabits = habits.filter((habit) => habit.id !== id);
    await habitRepository.saveAll(nextHabits);
    await checkinService.deleteCheckInsForHabit(id);
    await reminderActionService.deleteActionsForHabit(id);
    await cancelDailyReminder(id);
    await cancelStaleReminderNotifications(nextHabits);
  },
};

export const toHabitDraft = (habit: Habit): HabitDraft => ({
  name: habit.name,
  reminderTime: habit.reminderTime,
  reminderEnabled: habit.reminderEnabled,
  repeatRule: normalizeRepeatRule(habit.repeatRule),
  rewardText: habit.rewardText,
  punishmentText: habit.punishmentText,
  failureThreshold: habit.failureThreshold,
});

export const validateHabitDraft = (draft: HabitDraft) => {
  const errors: string[] = [];

  if (!draft.name.trim()) {
    errors.push('请输入任务名称');
  }

  if (draft.reminderEnabled && !/^\d{2}:\d{2}$/.test(draft.reminderTime)) {
    errors.push('请选择有效的提醒时间');
  }

  if (draft.failureThreshold < 1) {
    errors.push('失败阈值至少为 1');
  }

  if (draft.repeatRule.type === 'weekly' && draft.repeatRule.daysOfWeek.length === 0) {
    errors.push('每周重复至少选择一天');
  }

  if (draft.repeatRule.type === 'weeklyTarget' && (draft.repeatRule.timesPerWeek < 1 || draft.repeatRule.timesPerWeek > 7)) {
    errors.push('每周次数需要在 1 到 7 次之间');
  }

  return errors;
};

const normalizeHabitDraft = (draft: HabitDraft): HabitDraft => ({
  name: draft.name.trim(),
  reminderTime: draft.reminderTime || getCurrentReminderTime(),
  reminderEnabled: draft.reminderEnabled,
  repeatRule: normalizeRepeatRule(draft.repeatRule),
  rewardText: draft.rewardText.trim(),
  punishmentText: draft.punishmentText.trim(),
  failureThreshold: Math.max(1, Number(draft.failureThreshold) || 1),
});

const getCurrentReminderTime = () => {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
};

const normalizeHabit = (habit: Habit): Habit => ({
  ...habit,
  repeatRule: normalizeRepeatRule(habit.repeatRule),
});

const createId = () => {
  if ('crypto' in window && 'randomUUID' in window.crypto) {
    return window.crypto.randomUUID();
  }

  return `habit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
