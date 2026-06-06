export type ReminderActionStatus = 'pending' | 'snoozed' | 'started' | 'abandoned' | 'completed';

export type AbandonReason = 'tired' | 'busy' | 'forgot' | 'resistance' | 'too_hard';

export type ReminderAction = {
  id: string;
  habitId: string;
  date: string;
  remindedAt: string;
  status: ReminderActionStatus;
  snoozeCount: number;
  snoozedUntil?: string;
  startedAt?: string;
  abandonedAt?: string;
  abandonReason?: AbandonReason;
  completedAt?: string;
  updatedAt: string;
};
