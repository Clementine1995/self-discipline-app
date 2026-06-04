import type { CheckIn, Habit } from '@/types/habit';
import type { ToneId } from '@/types/tone';
import { buildDowngradeSuggestion, type DowngradeSuggestion } from '@/modules/recovery/downgradeRules';
import { buildHabitStats, calculateCompletionRate } from '@/modules/stats/statsRules';
import { shouldHabitRunOnDate } from '@/modules/habits/repeatRules';
import { toDateKey } from '@/utils/date';

export type AiReviewHabitSnapshot = {
  habitId: string;
  habitName: string;
  currentStreak: number;
  totalFailures: number;
};

export type AiReviewRiskItem = AiReviewHabitSnapshot & {
  level: 'low' | 'medium' | 'high';
  reason: string;
};

export type AiReviewDowngradeItem = AiReviewHabitSnapshot & {
  suggestion: DowngradeSuggestion;
};

export type AiDailyReview = {
  date: string;
  generatedAt: string;
  summary: string;
  totalHabits: number;
  completedCount: number;
  unfinishedCount: number;
  completionRate: number;
  completedHabits: AiReviewHabitSnapshot[];
  unfinishedHabits: AiReviewHabitSnapshot[];
  riskItems: AiReviewRiskItem[];
  tomorrowSuggestions: string[];
  downgradeSuggestions: AiReviewDowngradeItem[];
};

export type BuildAiDailyReviewInput = {
  habits: Habit[];
  checkIns: CheckIn[];
  toneId: ToneId;
  now?: Date;
};

export const buildLocalAiDailyReview = ({
  habits,
  checkIns,
  toneId,
  now = new Date(),
}: BuildAiDailyReviewInput): AiDailyReview => {
  const date = toDateKey(now);
  const todayHabits = habits.filter((habit) => shouldHabitRunOnDate(habit, date));
  const todayCheckIns = new Set(checkIns.filter((checkIn) => checkIn.date === date).map((checkIn) => checkIn.habitId));
  const snapshots = todayHabits.map((habit) => {
    const stats = buildHabitStats(habit, checkIns, date);

    return {
      habit,
      checkedToday: todayCheckIns.has(habit.id),
      snapshot: {
        habitId: habit.id,
        habitName: habit.name,
        currentStreak: stats.currentStreak,
        totalFailures: stats.totalFailures,
      },
    };
  });

  const completedHabits = snapshots.filter((item) => item.checkedToday).map((item) => item.snapshot);
  const unfinishedHabits = snapshots.filter((item) => !item.checkedToday).map((item) => item.snapshot);
  const completedCount = completedHabits.length;
  const totalHabits = habits.length;
  const completionRate = calculateCompletionRate(completedCount, totalHabits);
  const riskItems = snapshots
    .filter((item) => !item.checkedToday)
    .map(({ habit, snapshot }) => buildRiskItem(habit, snapshot));
  const downgradeSuggestions = snapshots
    .map(({ habit, snapshot }) => {
      const suggestion = buildDowngradeSuggestion(habit, snapshot.totalFailures, toneId);
      return suggestion ? { ...snapshot, suggestion } : undefined;
    })
    .filter((item): item is AiReviewDowngradeItem => Boolean(item));

  return {
    date,
    generatedAt: now.toISOString(),
    summary: buildSummary(completedCount, totalHabits, completionRate, unfinishedHabits.length, toneId),
    totalHabits,
    completedCount,
    unfinishedCount: unfinishedHabits.length,
    completionRate,
    completedHabits,
    unfinishedHabits,
    riskItems,
    tomorrowSuggestions: buildTomorrowSuggestions(unfinishedHabits, riskItems, completionRate),
    downgradeSuggestions,
  };
};

const buildSummary = (
  completedCount: number,
  totalHabits: number,
  completionRate: number,
  unfinishedCount: number,
  toneId: ToneId,
) => {
  if (totalHabits === 0) {
    return '还没有任务。先放一个很小的习惯进来，复盘才有抓手。';
  }

  if (completionRate === 100) {
    return toneId === 'rational'
      ? `今日完成 ${completedCount}/${totalHabits}，执行结果完整。`
      : `今天 ${completedCount} 个任务全部完成，节奏很稳。`;
  }

  if (completionRate >= 60) {
    return `今日完成 ${completedCount}/${totalHabits}，还有 ${unfinishedCount} 个任务需要收尾。`;
  }

  return `今日完成 ${completedCount}/${totalHabits}，先把剩下任务降到最小可执行版本。`;
};

const buildRiskItem = (habit: Habit, snapshot: AiReviewHabitSnapshot): AiReviewRiskItem => {
  const nextFailureCount = snapshot.totalFailures + 1;

  if (nextFailureCount >= habit.failureThreshold) {
    return {
      ...snapshot,
      level: 'high',
      reason: `今天未完成后，失败次数可能达到 ${habit.failureThreshold} 次阈值。`,
    };
  }

  if (snapshot.totalFailures > 0) {
    return {
      ...snapshot,
      level: 'medium',
      reason: '已经有失败记录，今天适合用降级版本保住连续感。',
    };
  }

  return {
    ...snapshot,
    level: 'low',
    reason: '今天还未打卡，尽量在睡前补一个最小动作。',
  };
};

const buildTomorrowSuggestions = (
  unfinishedHabits: AiReviewHabitSnapshot[],
  riskItems: AiReviewRiskItem[],
  completionRate: number,
) => {
  if (unfinishedHabits.length === 0) {
    return ['明天保持同一提醒时间，不额外加码。', '如果状态很好，只给一个任务提高一点点标准。'];
  }

  const highRiskNames = riskItems.filter((item) => item.level === 'high').map((item) => item.habitName);
  const focusNames = (highRiskNames.length > 0 ? highRiskNames : unfinishedHabits.map((item) => item.habitName)).slice(0, 2);
  const suggestions = [`明天优先处理：${focusNames.join('、')}。`];

  suggestions.push('给每个未完成任务准备一个 2 分钟版本，先启动再说。');

  if (completionRate < 60) {
    suggestions.push('明天不要新增任务，先把现有清单压到能完成。');
  } else {
    suggestions.push('完成率已经过半，明天把最容易断掉的一项提前到白天。');
  }

  return suggestions;
};
