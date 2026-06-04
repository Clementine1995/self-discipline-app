export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type RepeatRule =
  | {
      type: 'daily' | 'weekdays' | 'weekends';
    }
  | {
      type: 'weekly';
      daysOfWeek: Weekday[];
    };

export type Habit = {
  id: string;
  name: string;
  reminderTime: string;
  reminderEnabled: boolean;
  repeatRule: RepeatRule;
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
