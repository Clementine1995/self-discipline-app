import type { RewardRule } from '@/types/rules';

export const defaultRewardRules: RewardRule[] = [
  { id: 'streak-3', streakDays: 3, message: '连续 3 天完成，可以给自己一个小奖励。' },
  { id: 'streak-7', streakDays: 7, message: '连续 7 天完成，安排一段认真放松时间。' },
  { id: 'streak-30', streakDays: 30, message: '连续 30 天完成，奖励一个真正想要的小东西。' },
];

export const findUnlockedReward = (currentStreak: number) =>
  [...defaultRewardRules].reverse().find((rule) => currentStreak >= rule.streakDays);
