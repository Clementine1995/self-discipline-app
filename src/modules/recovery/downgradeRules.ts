import type { Habit } from '@/types/habit';
import type { ToneId } from '@/types/tone';
import { renderTonePrompt } from '@/modules/tones/toneCopy';

export type DowngradeSuggestion = {
  title: string;
  action: string;
  reason: string;
};

export const buildDowngradeSuggestion = (
  habit: Habit,
  totalFailures: number,
  toneId: ToneId,
): DowngradeSuggestion | undefined => {
  if (totalFailures <= 0) {
    return undefined;
  }

  const action = pickDowngradeAction(habit.name);
  const title = totalFailures >= habit.failureThreshold ? '降级执行建议' : '轻量补救建议';
  const reason =
    totalFailures >= habit.failureThreshold
      ? `失败次数已达到 ${habit.failureThreshold} 次，先保住习惯链条。`
      : '已经出现失败记录，先降低阻力。';

  return {
    title,
    action: renderToneAction(toneId, action),
    reason,
  };
};

const pickDowngradeAction = (habitName: string) => {
  const name = habitName.toLowerCase();

  if (name.includes('运动') || name.includes('健身') || name.includes('跑步') || name.includes('锻炼')) {
    return '今天只做 3 分钟拉伸或 10 个深蹲。';
  }

  if (name.includes('书') || name.includes('阅读')) {
    return '今天只读 2 页，或者读 5 分钟。';
  }

  if (name.includes('睡') || name.includes('早起')) {
    return '今晚只提前 10 分钟上床，先把节奏拉回来。';
  }

  if (name.includes('冥想') || name.includes('呼吸')) {
    return '今天只做 1 分钟呼吸练习。';
  }

  return '今天只做这个任务的 2 分钟版本。';
};

const renderToneAction = (toneId: ToneId, action: string) => {
  return renderTonePrompt(toneId, 'recovery', action);
};
