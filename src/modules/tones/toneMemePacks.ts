import type { ToneMemePack, ToneMemePackId, TonePromptKind } from '@/types/tone';

export const defaultMemePackId: ToneMemePackId = 'safe-lite';

export const toneMemePacks: ToneMemePack[] = [
  {
    id: 'safe-lite',
    name: '低刺激通用梗包',
    description: '只放轻松、无攻击性的通用表达，适合作为后续网络梗包能力的默认占位。',
    enabledByDefault: true,
    safetyLevel: 'safe',
    scenePrefixes: {
      reward: ['这波可以。', '今天的你有点东西。', '稳了，继续保持。'],
      punishment: ['问题不大，但别装作无事发生。', '先别急着摆，补一个最小版本。'],
      recovery: ['先别把自己打成困难模式，', '主线任务先降级，'],
      review: ['今日战报来了：', '复盘时间到：'],
      plan: ['先把大饼切小块，', '别一口吃成胖子，先拆一步：'],
    },
  },
];

export const getDefaultMemePrefix = (kind: TonePromptKind) =>
  toneMemePacks.find((pack) => pack.id === defaultMemePackId)?.scenePrefixes[kind]?.[0] ?? '';
