import type { HabitDraft } from '@/modules/habits/habitService';
import type { ToneId } from '@/types/tone';

export type AiHabitPlanSuggestion = {
  id: string;
  title: string;
  reason: string;
  draft: HabitDraft;
};

export type AiHabitPlan = {
  goal: string;
  summary: string;
  suggestions: AiHabitPlanSuggestion[];
};

export type BuildAiHabitPlanInput = {
  goal: string;
  toneId: ToneId;
};

type GoalCategory = 'fitness' | 'reading' | 'sleep' | 'study' | 'mindfulness' | 'generic';

export const buildLocalAiHabitPlan = ({ goal, toneId }: BuildAiHabitPlanInput): AiHabitPlan => {
  const normalizedGoal = goal.trim();
  const category = inferGoalCategory(normalizedGoal);
  const suggestions = buildSuggestions(category, normalizedGoal);

  return {
    goal: normalizedGoal,
    summary: buildSummary(normalizedGoal, suggestions.length, toneId),
    suggestions,
  };
};

const inferGoalCategory = (goal: string): GoalCategory => {
  const text = goal.toLowerCase();

  if (includesAny(text, ['运动', '健身', '跑步', '减脂', '减肥', '锻炼', '体能'])) {
    return 'fitness';
  }

  if (includesAny(text, ['看书', '读书', '阅读', '学习书'])) {
    return 'reading';
  }

  if (includesAny(text, ['睡觉', '早睡', '早起', '作息', '熬夜'])) {
    return 'sleep';
  }

  if (includesAny(text, ['学习', '考试', '英语', '编程', '课程', '证书'])) {
    return 'study';
  }

  if (includesAny(text, ['冥想', '正念', '情绪', '焦虑', '呼吸'])) {
    return 'mindfulness';
  }

  return 'generic';
};

const includesAny = (text: string, keywords: string[]) => keywords.some((keyword) => text.includes(keyword));

const buildSuggestions = (category: GoalCategory, goal: string): AiHabitPlanSuggestion[] => {
  const planBuilders: Record<GoalCategory, () => AiHabitPlanSuggestion[]> = {
    fitness: () => [
      createSuggestion('warmup', '先启动', '用很低门槛建立开始动作，避免一上来就靠意志力硬顶。', {
        name: '运动前热身 3 分钟',
        reminderTime: '19:30',
        rewardText: '连续完成 7 天，可以给自己安排一次轻松散步或喜欢的健康餐。',
        punishmentText: '失败达到阈值后，第二天只做 3 分钟拉伸补回节奏。',
      }),
      createSuggestion('core', '主任务', '把目标压成每天能重复的核心动作。', {
        name: '完成一次轻量运动',
        reminderTime: '20:00',
        rewardText: '连续完成 7 天，奖励一件运动小装备或一次无负担休息。',
        punishmentText: '失败达到阈值后，暂停加量，先恢复最低版本。',
      }),
      createSuggestion('review', '收尾复盘', '记录状态能帮助后续调整运动量和提醒时间。', {
        name: '记录今天运动感受',
        reminderTime: '21:30',
        rewardText: '连续记录 7 天，回看一次自己的变化。',
        punishmentText: '失败达到阈值后，只写一句话也算完成。',
      }),
    ],
    reading: () => [
      createSuggestion('starter', '先翻开', '阅读习惯最怕启动成本，先把动作缩到不会抗拒。', {
        name: '读书 5 分钟',
        reminderTime: '21:00',
        rewardText: '连续完成 7 天，奖励自己买一本想读的书。',
        punishmentText: '失败达到阈值后，第二天只读 2 页。',
      }),
      createSuggestion('note', '留下痕迹', '一句笔记比读很多但没记住更容易形成反馈。', {
        name: '写一句阅读笔记',
        reminderTime: '21:20',
        rewardText: '连续记录 7 天，整理一页自己的摘录。',
        punishmentText: '失败达到阈值后，只写关键词也算完成。',
      }),
      createSuggestion('prepare', '提前准备', '把书放在看得见的位置，减少明天的启动阻力。', {
        name: '睡前准备明天要读的书',
        reminderTime: '22:30',
        rewardText: '连续准备 7 天，给阅读区添一个小物件。',
        punishmentText: '失败达到阈值后，第二天直接把书放到桌面。',
      }),
    ],
    sleep: () => [
      createSuggestion('screen', '先降刺激', '睡眠目标先从减少睡前干扰开始。', {
        name: '睡前 20 分钟放下手机',
        reminderTime: '22:40',
        rewardText: '连续完成 7 天，安排一次舒服的早晨早餐。',
        punishmentText: '失败达到阈值后，第二天提前 10 分钟进入睡前流程。',
      }),
      createSuggestion('routine', '固定流程', '固定流程比单纯要求自己早睡更稳定。', {
        name: '完成睡前洗漱流程',
        reminderTime: '22:20',
        rewardText: '连续完成 7 天，奖励一件提升睡眠体验的小东西。',
        punishmentText: '失败达到阈值后，只保留洗漱和上床两个动作。',
      }),
      createSuggestion('wake', '第二天锚点', '早起和早睡互相影响，先建立一个晨间锚点。', {
        name: '起床后喝一杯水',
        reminderTime: '08:00',
        rewardText: '连续完成 7 天，给自己一个从容的上午。',
        punishmentText: '失败达到阈值后，第二天把杯子提前放在床边。',
      }),
    ],
    study: () => [
      createSuggestion('focus', '最小学习块', '学习目标先拆成短时间专注块，降低拖延概率。', {
        name: '专注学习 15 分钟',
        reminderTime: '20:30',
        rewardText: '连续完成 7 天，奖励一次无负担娱乐时间。',
        punishmentText: '失败达到阈值后，第二天只做 5 分钟启动版。',
      }),
      createSuggestion('output', '输出一点', '输出能确认今天不是只停留在想学。', {
        name: '写 3 行学习小结',
        reminderTime: '21:00',
        rewardText: '连续总结 7 天，整理一份自己的知识清单。',
        punishmentText: '失败达到阈值后，只写一个关键词也算完成。',
      }),
      createSuggestion('prepare', '明天起步', '提前定好下一步，明天更容易开始。', {
        name: '列出明天学习第一步',
        reminderTime: '22:00',
        rewardText: '连续准备 7 天，减少一次临时焦虑。',
        punishmentText: '失败达到阈值后，只写一个最小动作。',
      }),
    ],
    mindfulness: () => [
      createSuggestion('breath', '快速稳定', '先用一分钟呼吸建立可重复的情绪恢复动作。', {
        name: '呼吸练习 1 分钟',
        reminderTime: '12:30',
        rewardText: '连续完成 7 天，给自己一次安静的休息时间。',
        punishmentText: '失败达到阈值后，第二天只做 3 次深呼吸。',
      }),
      createSuggestion('evening', '晚间复盘', '简单记录能帮助看见情绪触发点。', {
        name: '记录今天一个情绪触发点',
        reminderTime: '22:00',
        rewardText: '连续记录 7 天，回看一次自己的稳定时刻。',
        punishmentText: '失败达到阈值后，只写一个词也算完成。',
      }),
      createSuggestion('pause', '打断惯性', '在白天设置一次停顿，避免压力一直滚到晚上。', {
        name: '下午停顿 2 分钟',
        reminderTime: '16:00',
        rewardText: '连续完成 7 天，安排一次短暂放空。',
        punishmentText: '失败达到阈值后，第二天只闭眼 30 秒。',
      }),
    ],
    generic: () => [
      createSuggestion('starter', '最低版本', '先设计一个不会被轻易放弃的每日动作。', {
        name: goal ? `${goal.slice(0, 12)} 2 分钟版` : '目标 2 分钟启动版',
        reminderTime: '20:30',
        rewardText: '连续完成 7 天，给自己一个小奖励。',
        punishmentText: '失败达到阈值后，第二天只做最小版本。',
      }),
      createSuggestion('record', '记录反馈', '每天留下一句反馈，后续才能判断目标是否合适。', {
        name: '写一句目标复盘',
        reminderTime: '21:30',
        rewardText: '连续记录 7 天，回看自己的坚持证据。',
        punishmentText: '失败达到阈值后，只写一个关键词也算完成。',
      }),
      createSuggestion('prepare', '准备明天', '提前准备能减少明天开始时的阻力。', {
        name: '准备明天的第一步',
        reminderTime: '22:00',
        rewardText: '连续准备 7 天，奖励一次轻松收尾。',
        punishmentText: '失败达到阈值后，第二天只完成一个准备动作。',
      }),
    ],
  };

  return planBuilders[category]();
};

const createSuggestion = (
  id: string,
  title: string,
  reason: string,
  draft: Omit<HabitDraft, 'reminderEnabled' | 'failureThreshold' | 'repeatRule'> &
    Partial<Pick<HabitDraft, 'failureThreshold' | 'repeatRule'>>,
): AiHabitPlanSuggestion => ({
  id,
  title,
  reason,
  draft: {
    reminderEnabled: true,
    repeatRule: { type: 'daily' },
    failureThreshold: draft.failureThreshold ?? 3,
    ...draft,
  },
});

const buildSummary = (goal: string, count: number, toneId: ToneId) => {
  if (!goal) {
    return '先输入一个长期目标，我会用本地规则拆成几个每天能做的小任务。';
  }

  if (toneId === 'rational') {
    return `已把目标拆成 ${count} 个每日任务建议，优先降低启动成本。`;
  }

  if (toneId === 'coach') {
    return `目标别停在口号里。先从这 ${count} 个动作开始执行。`;
  }

  return `我先把它拆成 ${count} 个小任务，轻一点，但每天都能往前挪。`;
};
