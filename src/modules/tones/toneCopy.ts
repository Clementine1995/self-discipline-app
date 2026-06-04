import type { ToneId } from '@/types/tone';

type TonePromptKind = 'reward' | 'punishment';

export const renderTonePrompt = (toneId: ToneId, kind: TonePromptKind, baseMessage: string) => {
  if (!baseMessage) {
    return '';
  }

  const toneRenderer = toneRenderers[toneId] ?? toneRenderers.gentle;
  return toneRenderer(kind, baseMessage);
};

const toneRenderers: Record<ToneId, (kind: TonePromptKind, baseMessage: string) => string> = {
  gentle: (kind, baseMessage) => {
    if (kind === 'reward') {
      return `做得很好。${baseMessage}`;
    }

    return `先稳住节奏。${baseMessage}`;
  },
  coach: (kind, baseMessage) => {
    if (kind === 'reward') {
      return `执行到位。${baseMessage}`;
    }

    return `别绕开问题。${baseMessage}`;
  },
  rational: (kind, baseMessage) => {
    if (kind === 'reward') {
      return `结果：已达到奖励条件。${baseMessage}`;
    }

    return `结果：失败次数已触发规则。${baseMessage}`;
  },
};
