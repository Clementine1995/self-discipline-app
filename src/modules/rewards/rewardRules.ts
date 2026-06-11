import type { RewardRule } from '@/types/rules';

export const defaultRewardRules: RewardRule[] = [
  { id: 'streak-3', streakDays: 3, message: '连续 3 天没有掉链子，允许给自己一点即时奖励。' },
  { id: 'streak-7', streakDays: 7, message: '连续 7 天守住规则，安排一段真正属于自己的放松时间。' },
  { id: 'streak-30', streakDays: 30, message: '连续 30 天完成，这不是运气，是你被规则驯服后的成果，奖励一个真正想要的东西。' },
];

export const findUnlockedReward = (currentStreak: number) =>
  [...defaultRewardRules].reverse().find((rule) => currentStreak >= rule.streakDays);

export const findNewlyUnlockedReward = (currentStreak: number, previousLongestStreak: number) =>
  defaultRewardRules.find((rule) => currentStreak === rule.streakDays && previousLongestStreak < rule.streakDays);

export const findNextRewardMilestone = (currentStreak: number) =>
  defaultRewardRules.find((rule) => currentStreak < rule.streakDays);
