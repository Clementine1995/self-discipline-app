import type { PunishmentRule } from '@/types/rules';

export const defaultPunishmentRules: PunishmentRule[] = [
  { id: 'failure-1', failureThreshold: 1, message: '今天已经漏了一次，明天把任务降到最低版本，但必须完成。' },
  { id: 'failure-3', failureThreshold: 3, message: '连续失败 3 次，暂停一段娱乐时间，补一条复盘，把原因写清楚。' },
];

export const findTriggeredPunishment = (failureCount: number) =>
  [...defaultPunishmentRules].reverse().find((rule) => failureCount >= rule.failureThreshold);
