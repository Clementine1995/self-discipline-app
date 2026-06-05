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
  'warm-companion': (kind, baseMessage) => `${warmCompanionPrefixes[kind]}${baseMessage}`,
  coach: (kind, baseMessage) => `${coachPrefixes[kind]}${baseMessage}`,
  'strict-coach': (kind, baseMessage) => `${strictCoachPrefixes[kind]}${baseMessage}`,
  rational: (kind, baseMessage) => `${rationalPrefixes[kind]}${baseMessage}`,
  'minimal-analyst': (kind, baseMessage) => `${minimalAnalystPrefixes[kind]}${baseMessage}`,
  meme: (kind, baseMessage) => `${getDefaultMemePrefix(kind) || memeFallbackPrefixes[kind]}${baseMessage}`,
  tsundere: (kind, baseMessage) => `${tsunderePrefixes[kind]}${baseMessage}`,
  schemer: (kind, baseMessage) => `${schemerPrefixes[kind]}${baseMessage}`,
  'adult-command': (kind, baseMessage) => `${adultCommandPrefixes[kind]}${baseMessage}`,
};

const gentlePrefixes: Record<TonePromptKind, string> = {
  reward: '做得很好，别小看这一步。',
  punishment: '别逃，先回来收尾。',
  recovery: '先做最小版本，把主动权拿回来：',
  review: '把今天摊开看清楚，',
  plan: '别把目标供起来，先拆成动作：',
};

const warmCompanionPrefixes: Record<TonePromptKind, string> = {
  reward: '今天没有敷衍自己，',
  punishment: '我知道你可能累了，但别把这件事丢掉，',
  recovery: '先把标准压低，不许直接放弃：',
  review: '不用演得很完美，先把事实说清楚，',
  plan: '别急着发狠，先把第一步咬住：',
};

const coachPrefixes: Record<TonePromptKind, string> = {
  reward: '执行到位，继续服从计划。',
  punishment: '别绕开问题，拖延没有奖励。',
  recovery: '别追求完美，现在执行最低版本：',
  review: '复盘不是给自己洗白，',
  plan: '目标别停在嘴上，',
};

const strictCoachPrefixes: Record<TonePromptKind, string> = {
  reward: '完成得干脆，合格。',
  punishment: '已经偏离计划，立刻纠正。',
  recovery: '现在补救，别让缺口过夜：',
  review: '把借口剥掉，复盘要落到行动，',
  plan: '目标必须变成命令，',
};

const rationalPrefixes: Record<TonePromptKind, string> = {
  reward: '结论：达成。',
  punishment: '结论：未达成。',
  recovery: '下一步：',
  review: '事实记录：',
  plan: '执行方案：',
};

const minimalAnalystPrefixes: Record<TonePromptKind, string> = {
  reward: '达成。',
  punishment: '失败。',
  recovery: '补救：',
  review: '记录：',
  plan: '命令：',
};

const memeFallbackPrefixes: Record<TonePromptKind, string> = {
  reward: '这波可以，今天不是纯摆。',
  punishment: '别装死，任务不会自己消失。',
  recovery: '别一上来就开摆，先降级：',
  review: '今日战报来了，别怕看数据：',
  plan: '别画大饼，先切一口能咽的：',
};

const tsunderePrefixes: Record<TonePromptKind, string> = {
  reward: '哼，勉强算你争气了一次。',
  punishment: '别装没看见，我可看见了。',
  recovery: '先做最低版本，别让我催第二遍：',
  review: '才不是关心你，是你需要复盘：',
  plan: '别光会嘴硬，先拆小一点：',
};

const schemerPrefixes: Record<TonePromptKind, string> = {
  reward: '表现不错，我记下你这次听话。',
  punishment: '理由先放一边，别想蒙混过去。',
  recovery: '我不听解释，只看下一步：',
  review: '今天的记录已经把你暴露得很清楚，',
  plan: '把目标交给规则，不要交给心情：',
};

const adultCommandPrefixes: Record<TonePromptKind, string> = {
  reward: '今日指令完成，允许奖励。',
  punishment: '指令未完成，接受补救。',
  recovery: '现在执行补救任务，完成前不许退出：',
  review: '汇报结果，不许粉饰：',
  plan: '按规则拆解，照做：',
};
