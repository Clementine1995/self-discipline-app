import type { ToneProfile } from '@/types/tone';

export const toneProfiles: ToneProfile[] = [
  {
    id: 'gentle',
    name: '温柔鼓励型',
    description: '默认语气，温柔但不放水，会把你从拖延里拉回来。',
    category: 'supportive',
    intensity: 'low',
    supportsMemeExtension: false,
    sample: {
      reward: '做得很好。今天这一格漂亮地拿下了。',
      punishment: '没完成就先别逃，回来补一个最小版本。',
    },
  },
  {
    id: 'warm-companion',
    name: '温暖陪伴型',
    description: '更像贴身陪跑，会哄你，也会把你按回计划里。',
    category: 'supportive',
    intensity: 'low',
    supportsMemeExtension: false,
    sample: {
      reward: '今天没有糊弄自己，这一下很值得记住。',
      punishment: '可以累，可以慢，但不能当作没发生。先补一点回来。',
    },
  },
  {
    id: 'coach',
    name: '严厉教练型',
    description: '更直接的督促感，少讲情绪，多讲执行。',
    category: 'pressure',
    intensity: 'medium',
    supportsMemeExtension: false,
    sample: {
      reward: '执行到位。别飘，下一次继续照做。',
      punishment: '别给自己找台阶。先补一个最低版本。',
    },
  },
  {
    id: 'strict-coach',
    name: '强督促教练型',
    description: '比严厉教练更有压迫感，专治拖延和嘴硬。',
    category: 'pressure',
    intensity: 'high',
    supportsMemeExtension: false,
    sample: {
      reward: '完成得干脆。很好，继续保持这种服从计划的状态。',
      punishment: '已经偏离计划。现在立刻补救，把缺口收住。',
    },
  },
  {
    id: 'rational',
    name: '冷静理性型',
    description: '只给事实、判断和下一步，不给拖延留表演空间。',
    category: 'data',
    intensity: 'low',
    supportsMemeExtension: false,
    sample: {
      reward: '结果：达成。当前策略有效，继续复制。',
      punishment: '结果：未达成。停止解释，执行降级版本。',
    },
  },
  {
    id: 'minimal-analyst',
    name: '极简分析型',
    description: '更短、更冷，只保留结论、亏欠和补救动作。',
    category: 'data',
    intensity: 'low',
    supportsMemeExtension: false,
    sample: {
      reward: '完成。奖励已解锁。',
      punishment: '未达成。现在补救。',
    },
  },
  {
    id: 'meme',
    name: '网络梗轻松型',
    description: '玩梗更重一点，会吐槽你，但不把你骂废。',
    category: 'playful',
    intensity: 'low',
    supportsMemeExtension: true,
    sample: {
      reward: '这波可以，今天不是纯摆设。',
      punishment: '别装死，任务不会自己消失。先补个最低版本。',
    },
  },
  {
    id: 'tsundere',
    name: '傲娇挑衅型',
    description: '挑衅更明显，嘴硬式监督，适合想被激一下的时候。',
    category: 'teasing',
    intensity: 'medium',
    supportsMemeExtension: true,
    sample: {
      reward: '哼，今天居然做到了，算你还有点救。',
      punishment: '不会真想赖过去吧？先补最低版本，别让我看不起你。',
    },
  },
  {
    id: 'schemer',
    name: '腹黑掌控型',
    description: '克制、压迫、带一点掌控感，像有人一直盯着你的执行。',
    category: 'teasing',
    intensity: 'medium',
    supportsMemeExtension: false,
    sample: {
      reward: '表现不错，我会记下你这次听话执行。',
      punishment: '理由不用讲给我听，我只看你现在补不补。',
    },
  },
  {
    id: 'adult-command',
    name: '成人调教型',
    description: '命令感、规则感和惩戒感更强，适合想被强势接管执行节奏的时候。',
    category: 'command',
    intensity: 'high',
    supportsMemeExtension: false,
    sample: {
      reward: '今日指令完成，允许领取奖励，但别得意忘形。',
      punishment: '指令未完成。现在补救，完成前不许假装自由。',
    },
  },
];
