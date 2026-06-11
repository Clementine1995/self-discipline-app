import type { CheckIn, Habit } from '@/types/habit';
import { shouldHabitRunOnDate } from '@/modules/habits/repeatRules';
import { buildHabitStats, calculateCompletionRate } from '@/modules/stats/statsRules';
import { addDays, eachDateKeyBetween, toDateKey } from '@/utils/date';

export type AiWeeklyHabitSummary = {
  habitId: string;
  habitName: string;
  scheduledCount: number;
  completedCount: number;
  missedCount: number;
  completionRate: number;
  currentStreak: number;
};

export type AiWeeklyReport = {
  startDate: string;
  endDate: string;
  generatedAt: string;
  summary: string;
  scheduledCount: number;
  completedCount: number;
  missedCount: number;
  completionRate: number;
  mostStableHabit?: AiWeeklyHabitSummary;
  easiestFailedHabit?: AiWeeklyHabitSummary;
  habitSummaries: AiWeeklyHabitSummary[];
  nextWeekSuggestions: string[];
};

export type BuildAiWeeklyReportInput = {
  habits: Habit[];
  checkIns: CheckIn[];
  now?: Date;
};

export const buildLocalAiWeeklyReport = ({
  habits,
  checkIns,
  now = new Date(),
}: BuildAiWeeklyReportInput): AiWeeklyReport => {
  const endDate = toDateKey(now);
  const startDate = toDateKey(addDays(now, -6));
  const weekDates = eachDateKeyBetween(startDate, endDate);
  const habitSummaries = habits
    .map((habit) => buildHabitWeeklySummary(habit, checkIns, weekDates, endDate))
    .filter((summary) => summary.scheduledCount > 0);
  const scheduledCount = habitSummaries.reduce((total, habit) => total + habit.scheduledCount, 0);
  const completedCount = habitSummaries.reduce((total, habit) => total + habit.completedCount, 0);
  const missedCount = Math.max(0, scheduledCount - completedCount);
  const completionRate = calculateCompletionRate(completedCount, scheduledCount);
  const mostStableHabit = findMostStableHabit(habitSummaries);
  const easiestFailedHabit = findEasiestFailedHabit(habitSummaries);

  return {
    startDate,
    endDate,
    generatedAt: now.toISOString(),
    summary: buildWeeklySummary(completedCount, scheduledCount, completionRate),
    scheduledCount,
    completedCount,
    missedCount,
    completionRate,
    mostStableHabit,
    easiestFailedHabit,
    habitSummaries,
    nextWeekSuggestions: buildNextWeekSuggestions(completionRate, mostStableHabit, easiestFailedHabit),
  };
};

const buildHabitWeeklySummary = (
  habit: Habit,
  checkIns: CheckIn[],
  weekDates: string[],
  endDate: string,
): AiWeeklyHabitSummary => {
  const habitCheckIns = checkIns.filter((checkIn) => checkIn.habitId === habit.id);
  const checkedDates = new Set(habitCheckIns.map((checkIn) => checkIn.date));
  const scheduledDates = weekDates.filter((date) => shouldHabitRunOnDate(habit, date));
  const scheduledCount =
    habit.repeatRule.type === 'weeklyTarget'
      ? Math.min(habit.repeatRule.timesPerWeek, scheduledDates.length)
      : scheduledDates.length;
  const rawCompletedCount = scheduledDates.filter((date) => checkedDates.has(date)).length;
  const completedCount = Math.min(rawCompletedCount, scheduledCount);
  const stats = buildHabitStats(habit, checkIns, endDate);

  return {
    habitId: habit.id,
    habitName: habit.name,
    scheduledCount,
    completedCount,
    missedCount: Math.max(0, scheduledCount - completedCount),
    completionRate: calculateCompletionRate(completedCount, scheduledCount),
    currentStreak: stats.currentStreak,
  };
};

const findMostStableHabit = (habitSummaries: AiWeeklyHabitSummary[]) =>
  [...habitSummaries].sort(
    (a, b) => b.completionRate - a.completionRate || b.completedCount - a.completedCount || b.currentStreak - a.currentStreak,
  )[0];

const findEasiestFailedHabit = (habitSummaries: AiWeeklyHabitSummary[]) =>
  habitSummaries
    .filter((habit) => habit.missedCount > 0)
    .sort((a, b) => b.missedCount - a.missedCount || a.completionRate - b.completionRate)[0];

const buildWeeklySummary = (completedCount: number, scheduledCount: number, completionRate: number) => {
  if (scheduledCount === 0) {
    return '本周还没有可统计的任务，先放一个每天都逃不掉的小习惯进来。';
  }

  if (completionRate >= 90) {
    return `本周完成 ${completedCount}/${scheduledCount}，执行很稳，下周继续守规则，别急着加码。`;
  }

  if (completionRate >= 60) {
    return `本周完成 ${completedCount}/${scheduledCount}，基础还在，但有漏洞，下周先收拾最容易掉线的一项。`;
  }

  return `本周完成 ${completedCount}/${scheduledCount}，执行已经松了，下周先降标准，把连续性抢回来。`;
};

const buildNextWeekSuggestions = (
  completionRate: number,
  mostStableHabit?: AiWeeklyHabitSummary,
  easiestFailedHabit?: AiWeeklyHabitSummary,
) => {
  if (!mostStableHabit && !easiestFailedHabit) {
    return ['先创建 1 个低门槛任务，并给它设置固定提醒时间，别让系统空着。'];
  }

  const suggestions: string[] = [];

  if (mostStableHabit) {
    suggestions.push(`保留「${mostStableHabit.habitName}」的当前节奏，它是本周最听话的锚点。`);
  }

  if (easiestFailedHabit) {
    suggestions.push(`优先调整「${easiestFailedHabit.habitName}」，它最容易失控，下周先改成更小、更早、更容易开始的版本。`);
  }

  if (completionRate < 60) {
    suggestions.push('下周不准新增任务，先把现有任务压到可以完成的规模。');
  } else {
    suggestions.push('下周只微调一个任务，别同时改太多规则给自己找借口。');
  }

  return suggestions;
};
