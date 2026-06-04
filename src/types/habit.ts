export type Habit = {
  id: string;
  name: string;
  reminderTime: string;
  reminderEnabled: boolean;
  rewardText: string;
  punishmentText: string;
  failureThreshold: number;
  createdAt: string;
  updatedAt: string;
};

export type CheckIn = {
  id: string;
  habitId: string;
  date: string;
  checkedAt: string;
};

export type HabitStats = {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  totalFailures: number;
};
