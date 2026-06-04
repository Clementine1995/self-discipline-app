import type { ToneProfile } from '@/types/tone';

export const toneProfiles: ToneProfile[] = [
  {
    id: 'gentle',
    name: '温柔鼓励型',
    description: '默认语气，稳定、轻柔、长期陪伴。',
  },
  {
    id: 'coach',
    name: '严厉教练型',
    description: '更直接的督促感，默认不开启。',
  },
  {
    id: 'rational',
    name: '冷静理性型',
    description: '只给事实、原因和下一步建议。',
  },
];
