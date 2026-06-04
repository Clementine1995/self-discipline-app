import type { PunishmentRule } from '@/types/rules';

export const defaultPunishmentRules: PunishmentRule[] = [
  { id: 'failure-1', failureThreshold: 1, message: '今天轻提醒，明天把任务降到最低可执行版本。' },
  { id: 'failure-3', failureThreshold: 3, message: '连续失败 3 次，减少一段娱乐时间并补一条复盘。' },
];

export const findTriggeredPunishment = (failureCount: number) =>
  [...defaultPunishmentRules].reverse().find((rule) => failureCount >= rule.failureThreshold);
