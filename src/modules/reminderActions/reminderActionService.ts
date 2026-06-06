import type { Habit } from '@/types/habit';
import type { AbandonReason, ReminderAction } from '@/types/reminderAction';
import { reminderActionRepository } from '@/modules/reminderActions/reminderActionRepository';
import { toDateKey } from '@/utils/date';

const maxSnoozeCount = 2;
const snoozeMinutes = 10;

export type ReminderActionSummary = {
  action: ReminderAction;
  overdueMinutes: number;
  canSnooze: boolean;
  isSnoozed: boolean;
};

export const abandonReasonLabels: Record<AbandonReason, string> = {
  tired: '太累',
  busy: '没时间',
  forgot: '忘了',
  resistance: '就是不想做',
  too_hard: '计划太难',
};

export const reminderActionService = {
  async listActions() {
    return reminderActionRepository.getAll();
  },

  async getAction(habitId: string, date = toDateKey(new Date())) {
    const actions = await reminderActionRepository.getAll();
    return actions.find((action) => action.id === buildReminderActionId(habitId, date));
  },

  async ensureAction(habit: Habit, date = toDateKey(new Date()), now = new Date()) {
    const remindedAt = buildReminderAt(habit, date);

    if (now < remindedAt) {
      return undefined;
    }

    return upsertAction({
      habitId: habit.id,
      date,
      remindedAt: remindedAt.toISOString(),
    });
  },

  async markStarted(habit: Habit, date = toDateKey(new Date())) {
    return upsertAction({
      habitId: habit.id,
      date,
      remindedAt: buildReminderAt(habit, date).toISOString(),
      status: 'started',
      startedAt: new Date().toISOString(),
      abandonedAt: undefined,
      abandonReason: undefined,
      completedAt: undefined,
    });
  },

  async snooze(habit: Habit, date = toDateKey(new Date())) {
    const action = await this.ensureAction(habit, date);

    if (!action || action.snoozeCount >= maxSnoozeCount || action.status === 'abandoned') {
      return action;
    }

    return upsertAction({
      habitId: habit.id,
      date,
      remindedAt: action.remindedAt,
      status: 'snoozed',
      snoozeCount: action.snoozeCount + 1,
      snoozedUntil: addMinutes(new Date(), snoozeMinutes).toISOString(),
    });
  },

  async abandon(habit: Habit, reason: AbandonReason, date = toDateKey(new Date())) {
    return upsertAction({
      habitId: habit.id,
      date,
      remindedAt: buildReminderAt(habit, date).toISOString(),
      status: 'abandoned',
      abandonedAt: new Date().toISOString(),
      abandonReason: reason,
      completedAt: undefined,
    });
  },

  async markCompleted(habitId: string, date = toDateKey(new Date())) {
    const existing = await this.getAction(habitId, date);

    if (!existing) {
      return undefined;
    }

    return upsertAction({
      ...existing,
      status: 'completed',
      completedAt: new Date().toISOString(),
      abandonedAt: undefined,
      abandonReason: undefined,
    });
  },

  async reopen(habit: Habit, date = toDateKey(new Date())) {
    const existing = await this.getAction(habit.id, date);

    if (!existing) {
      return this.ensureAction(habit, date);
    }

    return upsertAction({
      ...existing,
      status: 'pending',
      completedAt: undefined,
    });
  },

  async deleteActionsForHabit(habitId: string) {
    const actions = await reminderActionRepository.getAll();
    await reminderActionRepository.saveAll(actions.filter((action) => action.habitId !== habitId));
  },

  async clearActions() {
    await reminderActionRepository.clear();
  },
};

export const buildReminderActionSummary = (action: ReminderAction, now = new Date()): ReminderActionSummary => {
  const snoozedUntil = action.snoozedUntil ? new Date(action.snoozedUntil) : undefined;

  return {
    action,
    overdueMinutes: Math.max(0, Math.floor((now.getTime() - new Date(action.remindedAt).getTime()) / 60000)),
    canSnooze: action.snoozeCount < maxSnoozeCount && action.status !== 'abandoned' && action.status !== 'completed',
    isSnoozed: Boolean(snoozedUntil && snoozedUntil > now),
  };
};

export const buildReminderAt = (habit: Pick<Habit, 'reminderTime'>, date: string) => {
  const [hour, minute] = habit.reminderTime.split(':').map(Number);
  const remindedAt = new Date(`${date}T00:00:00`);
  remindedAt.setHours(hour, minute, 0, 0);
  return remindedAt;
};

export const buildReminderActionId = (habitId: string, date: string) => `${habitId}:${date}`;

export const getReminderActionLimits = () => ({
  maxSnoozeCount,
  snoozeMinutes,
});

const upsertAction = async (
  patch: Pick<ReminderAction, 'habitId' | 'date' | 'remindedAt'> & Partial<ReminderAction>,
) => {
  const actions = await reminderActionRepository.getAll();
  const id = buildReminderActionId(patch.habitId, patch.date);
  const existing = actions.find((action) => action.id === id);
  const now = new Date().toISOString();
  const nextAction: ReminderAction = {
    id,
    status: 'pending',
    snoozeCount: 0,
    ...existing,
    ...patch,
    updatedAt: now,
  };
  const nextActions = existing
    ? actions.map((action) => (action.id === id ? nextAction : action))
    : [...actions, nextAction];

  await reminderActionRepository.saveAll(nextActions);
  return nextAction;
};

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000);
