import type { ToneProfile } from '@/types/tone';

export const toneProfiles: ToneProfile[] = [
  {
    id: 'gentle',
    name: '温柔鼓励型',
    description: '默认语气，稳定、轻柔、长期陪伴。',
    category: 'supportive',
    intensity: 'low',
    supportsMemeExtension: false,
    sample: {
      reward: '做得很好。今天这一格稳稳填上了。',
      punishment: '先稳住节奏。失败不是结论，下一步才是。',
    },
  },
  {
    id: 'coach',
    name: '严厉教练型',
    description: '更直接的督促感，默认不开启。',
    category: 'pressure',
    intensity: 'medium',
    supportsMemeExtension: false,
    sample: {
      reward: '执行到位。继续保持，不要靠情绪发挥。',
      punishment: '别绕开问题。先补一个最低版本。',
    },
  },
  {
    id: 'rational',
    name: '冷静理性型',
    description: '只给事实、原因和下一步建议。',
    category: 'data',
    intensity: 'low',
    supportsMemeExtension: false,
    sample: {
      reward: '结果：已达到奖励条件。继续按当前节奏执行。',
      punishment: '结果：失败次数已触发规则。下一步执行降级版本。',
    },
  },
  {
    id: 'meme',
    name: '网络梗轻松型',
    description: '轻度玩梗，不做人身攻击；后续可接入可更新梗包。',
    category: 'playful',
    intensity: 'low',
    supportsMemeExtension: true,
    sample: {
      reward: '这波可以。今天的你有点东西。',
      punishment: '问题不大，但别装作无事发生。先补个最低版本。',
    },
  },
];
