import type { CheckIn, Habit, HabitStats } from '@/types/habit';
import { addDays, eachDateKeyBetween, getRecentDateKeys, parseDateKey, toDateKey } from '@/utils/date';

export const countTodayCompleted = (checkIns: CheckIn[], date: string) =>
  checkIns.filter((checkIn) => checkIn.date === date).length;

export const calculateCompletionRate = (completed: number, total: number) => {
  if (total === 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
};

export type HabitProgress = HabitStats & {
  habit: Habit;
  checkedToday: boolean;
  unlockedReward?: string;
  triggeredPunishment?: string;
};

export type DayTrend = {
  date: string;
  completed: number;
  total: number;
  completionRate: number;
};

export type HabitDayStatus = {
  date: string;
  checked: boolean;
  isBeforeCreated: boolean;
};

export const buildHabitStats = (habit: Habit, checkIns: CheckIn[], today = toDateKey(new Date())): HabitStats => {
  const habitCheckIns = checkIns.filter((checkIn) => checkIn.habitId === habit.id);
  const checkedDates = new Set(habitCheckIns.map((checkIn) => checkIn.date));

  return {
    habitId: habit.id,
    currentStreak: calculateCurrentStreak(checkedDates, today),
    longestStreak: calculateLongestStreak([...checkedDates]),
    totalCheckIns: habitCheckIns.length,
    totalFailures: calculateTotalFailures(habit, checkedDates, today),
  };
};

export const calculateCurrentStreak = (checkedDates: Set<string>, today = toDateKey(new Date())) => {
  let cursor = checkedDates.has(today) ? parseDateKey(today) : addDays(parseDateKey(today), -1);
  let streak = 0;

  while (checkedDates.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};

export const calculateLongestStreak = (dateKeys: string[]) => {
  const sortedDateKeys = [...new Set(dateKeys)].sort();
  let longest = 0;
  let current = 0;
  let previousTime = 0;

  for (const dateKey of sortedDateKeys) {
    const time = parseDateKey(dateKey).getTime();
    const isNextDay = previousTime > 0 && time - previousTime === 24 * 60 * 60 * 1000;
    current = isNextDay ? current + 1 : 1;
    longest = Math.max(longest, current);
    previousTime = time;
  }

  return longest;
};

export const calculateTotalFailures = (habit: Habit, checkedDates: Set<string>, today = toDateKey(new Date())) => {
  const startDate = toDateKey(parseDateKey(habit.createdAt.slice(0, 10)));
  const yesterday = toDateKey(addDays(parseDateKey(today), -1));

  if (parseDateKey(startDate) > parseDateKey(yesterday)) {
    return 0;
  }

  return eachDateKeyBetween(startDate, yesterday).filter((dateKey) => !checkedDates.has(dateKey)).length;
};

export const buildSevenDayTrend = (habits: Habit[], checkIns: CheckIn[], today = new Date()): DayTrend[] =>
  getRecentDateKeys(7, today).map((date) => {
    const activeHabits = habits.filter((habit) => habit.createdAt.slice(0, 10) <= date);
    const completed = checkIns.filter((checkIn) => checkIn.date === date).length;
    const total = activeHabits.length;

    return {
      date,
      completed,
      total,
      completionRate: calculateCompletionRate(completed, total),
    };
  });

export const buildHabitSevenDayStatus = (
  habit: Habit,
  checkIns: CheckIn[],
  today = new Date(),
): HabitDayStatus[] => {
  const checkedDates = new Set(checkIns.filter((checkIn) => checkIn.habitId === habit.id).map((checkIn) => checkIn.date));

  return getRecentDateKeys(7, today).map((date) => ({
    date,
    checked: checkedDates.has(date),
    isBeforeCreated: date < habit.createdAt.slice(0, 10),
  }));
};
