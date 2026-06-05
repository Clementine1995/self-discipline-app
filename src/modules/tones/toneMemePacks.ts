import type { ToneMemePack, ToneMemePackId, TonePromptKind } from '@/types/tone';

export const defaultMemePackId: ToneMemePackId = 'safe-lite';

export const toneMemePacks: ToneMemePack[] = [
  {
    id: 'safe-lite',
    name: '轻刺通用梗包',
    description: '带一点吐槽和压迫感，适合作为默认玩梗文案底座。',
    enabledByDefault: true,
    safetyLevel: 'safe',
    scenePrefixes: {
      reward: ['这波可以，今天不是纯摆。', '今天的你有点东西，别浪费。', '稳住了，继续把规则焊住。'],
      punishment: ['别装死，任务不会自己消失。', '先别急着摆，补一个最小版本。'],
      recovery: ['别一上来就开摆，先降级：', '主线任务降级，但不准跳过：'],
      review: ['今日战报来了，别怕看数据：', '复盘时间到，别美化自己：'],
      plan: ['别画大饼，先切一口能咽的：', '别一口吃成胖子，先拆一步照做：'],
    },
  },
];

export const getDefaultMemePrefix = (kind: TonePromptKind) =>
  toneMemePacks.find((pack) => pack.id === defaultMemePackId)?.scenePrefixes[kind]?.[0] ?? '';
