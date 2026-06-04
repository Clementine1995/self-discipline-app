import type { ToneId, TonePromptKind } from '@/types/tone';
import { getDefaultMemePrefix } from '@/modules/tones/toneMemePacks';

export const renderTonePrompt = (toneId: ToneId, kind: TonePromptKind, baseMessage: string) => {
  if (!baseMessage) {
    return '';
  }

  const toneRenderer = toneRenderers[toneId] ?? toneRenderers.gentle;
  return toneRenderer(kind, baseMessage);
};

const toneRenderers: Record<ToneId, (kind: TonePromptKind, baseMessage: string) => string> = {
  gentle: (kind, baseMessage) => `${gentlePrefixes[kind]}${baseMessage}`,
  coach: (kind, baseMessage) => `${coachPrefixes[kind]}${baseMessage}`,
  rational: (kind, baseMessage) => `${rationalPrefixes[kind]}${baseMessage}`,
  meme: (kind, baseMessage) => `${getDefaultMemePrefix(kind) || memeFallbackPrefixes[kind]}${baseMessage}`,
};

const gentlePrefixes: Record<TonePromptKind, string> = {
  reward: '做得很好。',
  punishment: '先稳住节奏。',
  recovery: '先轻一点也可以，',
  review: '慢慢来，',
  plan: '先拆小一点，',
};

const coachPrefixes: Record<TonePromptKind, string> = {
  reward: '执行到位。',
  punishment: '别绕开问题。',
  recovery: '别追求完美，先执行最低版本：',
  review: '复盘不是安慰自己，',
  plan: '目标别停在口号里，',
};

const rationalPrefixes: Record<TonePromptKind, string> = {
  reward: '结果：已达到奖励条件。',
  punishment: '结果：失败次数已触发规则。',
  recovery: '下一步：',
  review: '复盘结论：',
  plan: '拆解结果：',
};

const memeFallbackPrefixes: Record<TonePromptKind, string> = {
  reward: '这波可以。',
  punishment: '问题不大，但别装作无事发生。',
  recovery: '先别把自己打成困难模式，',
  review: '今日战报来了：',
  plan: '先把大饼切小块，',
};
