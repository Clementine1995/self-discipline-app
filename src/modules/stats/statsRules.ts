import type { CheckIn, Habit, HabitStats } from '@/types/habit';
import { shouldHabitRunOnDate } from '@/modules/habits/repeatRules';
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
  isScheduled: boolean;
};

export const buildHabitStats = (habit: Habit, checkIns: CheckIn[], today = toDateKey(new Date())): HabitStats => {
  const habitCheckIns = checkIns.filter((checkIn) => checkIn.habitId === habit.id);
  const checkedDates = new Set(habitCheckIns.map((checkIn) => checkIn.date));
  const scheduledDates = buildHabitScheduledDates(habit, today);

  return {
    habitId: habit.id,
    currentStreak: calculateCurrentStreak(checkedDates, scheduledDates, today),
    longestStreak: calculateLongestStreak(scheduledDates, checkedDates),
    totalCheckIns: habitCheckIns.length,
    totalFailures: calculateTotalFailures(habit, checkedDates, today),
  };
};

export const calculateCurrentStreak = (
  checkedDates: Set<string>,
  scheduledDates: string[],
  today = toDateKey(new Date()),
) => {
  const sortedScheduledDates = scheduledDates.filter((dateKey) => dateKey <= today).sort();
  let cursorIndex = sortedScheduledDates.length - 1;

  if (cursorIndex >= 0 && sortedScheduledDates[cursorIndex] === today && !checkedDates.has(today)) {
    cursorIndex -= 1;
  }

  let streak = 0;

  while (cursorIndex >= 0 && checkedDates.has(sortedScheduledDates[cursorIndex])) {
    streak += 1;
    cursorIndex -= 1;
  }

  return streak;
};

export const calculateLongestStreak = (scheduledDates: string[], checkedDates: Set<string>) => {
  const sortedDateKeys = [...new Set(scheduledDates)].sort();
  let longest = 0;
  let current = 0;

  for (const dateKey of sortedDateKeys) {
    current = checkedDates.has(dateKey) ? current + 1 : 0;
    longest = Math.max(longest, current);
  }

  return longest;
};

export const calculateTotalFailures = (habit: Habit, checkedDates: Set<string>, today = toDateKey(new Date())) => {
  const startDate = toDateKey(parseDateKey(habit.createdAt.slice(0, 10)));
  const yesterday = toDateKey(addDays(parseDateKey(today), -1));

  if (parseDateKey(startDate) > parseDateKey(yesterday)) {
    return 0;
  }

  return eachDateKeyBetween(startDate, yesterday).filter(
    (dateKey) => shouldHabitRunOnDate(habit, dateKey) && !checkedDates.has(dateKey),
  ).length;
};

export const buildSevenDayTrend = (habits: Habit[], checkIns: CheckIn[], today = new Date()): DayTrend[] =>
  getRecentDateKeys(7, today).map((date) => {
    const activeHabits = habits.filter((habit) => shouldHabitRunOnDate(habit, date));
    const activeHabitIds = new Set(activeHabits.map((habit) => habit.id));
    const completed = checkIns.filter((checkIn) => checkIn.date === date && activeHabitIds.has(checkIn.habitId)).length;
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
    isScheduled: shouldHabitRunOnDate(habit, date),
  }));
};

export const buildHabitScheduledDates = (habit: Habit, today = toDateKey(new Date())) => {
  const startDate = toDateKey(parseDateKey(habit.createdAt.slice(0, 10)));

  if (parseDateKey(startDate) > parseDateKey(today)) {
    return [];
  }

  return eachDateKeyBetween(startDate, today).filter((dateKey) => shouldHabitRunOnDate(habit, dateKey));
};
