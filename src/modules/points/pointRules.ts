import type { CheckIn, Habit } from '@/types/habit';
import { buildHabitStats } from '@/modules/stats/statsRules';
import { toDateKey } from '@/utils/date';

export type PointBreakdown = {
  basePoints: number;
  milestoneBonus: number;
  totalPoints: number;
};

export type HabitPointProgress = PointBreakdown & {
  habit: Habit;
  totalCheckIns: number;
  longestStreak: number;
};

export type PointSummary = {
  totalPoints: number;
  todayPoints: number;
  level: number;
  nextLevelPoints: number;
  pointsToNextLevel: number;
  habitProgress: HabitPointProgress[];
};

export const pointsPerCheckIn = 10;
const pointsPerLevel = 100;
const milestoneBonuses = [
  { streakDays: 30, bonus: 300 },
  { streakDays: 7, bonus: 80 },
  { streakDays: 3, bonus: 20 },
];

export const buildHabitPointProgress = (habit: Habit, checkIns: CheckIn[]): HabitPointProgress => {
  const stats = buildHabitStats(habit, checkIns);
  const breakdown = buildPointBreakdown(stats.totalCheckIns, stats.longestStreak);

  return {
    habit,
    totalCheckIns: stats.totalCheckIns,
    longestStreak: stats.longestStreak,
    ...breakdown,
  };
};

export const buildPointSummary = (habits: Habit[], checkIns: CheckIn[], today = toDateKey(new Date())): PointSummary => {
  const habitProgress = habits.map((habit) => buildHabitPointProgress(habit, checkIns));
  const totalPoints = habitProgress.reduce((total, progress) => total + progress.totalPoints, 0);
  const todayPoints = checkIns.filter((checkIn) => checkIn.date === today).length * pointsPerCheckIn;
  const level = Math.floor(totalPoints / pointsPerLevel) + 1;
  const nextLevelPoints = level * pointsPerLevel;

  return {
    totalPoints,
    todayPoints,
    level,
    nextLevelPoints,
    pointsToNextLevel: Math.max(0, nextLevelPoints - totalPoints),
    habitProgress,
  };
};

const buildPointBreakdown = (totalCheckIns: number, longestStreak: number): PointBreakdown => {
  const basePoints = totalCheckIns * pointsPerCheckIn;
  const milestoneBonus = milestoneBonuses
    .filter((milestone) => longestStreak >= milestone.streakDays)
    .reduce((total, milestone) => total + milestone.bonus, 0);

  return {
    basePoints,
    milestoneBonus,
    totalPoints: basePoints + milestoneBonus,
  };
};

export const getMilestoneBonusForStreak = (streakDays: number) =>
  milestoneBonuses.find((milestone) => milestone.streakDays === streakDays)?.bonus ?? 0;
