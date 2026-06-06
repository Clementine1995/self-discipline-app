import type { CheckIn, Habit } from '@/types/habit';
import type { ReminderAction } from '@/types/reminderAction';
import type { RewardRedemption } from '@/types/rewardShop';
import type { AppSettings } from '@/modules/settings/settingsRepository';
import { checkinRepository } from '@/modules/checkins/checkinRepository';
import { habitRepository } from '@/modules/habits/habitRepository';
import { reminderActionRepository } from '@/modules/reminderActions/reminderActionRepository';
import { rewardRedemptionRepository } from '@/modules/rewards/rewardShopRepository';
import { appSettingsRepository, defaultAppSettings } from '@/modules/settings/settingsRepository';

export type DataBackup = {
  version: 2;
  exportedAt: string;
  habits: Habit[];
  checkIns: CheckIn[];
  reminderActions: ReminderAction[];
  rewardRedemptions: RewardRedemption[];
  settings: AppSettings;
};

export const exportLocalData = async (): Promise<DataBackup> => ({
  version: 2,
  exportedAt: new Date().toISOString(),
  habits: await habitRepository.getAll(),
  checkIns: await checkinRepository.getAll(),
  reminderActions: await reminderActionRepository.getAll(),
  rewardRedemptions: await rewardRedemptionRepository.getAll(),
  settings: await appSettingsRepository.get(),
});

export const exportLocalDataAsJson = async () => JSON.stringify(await exportLocalData(), null, 2);

export const clearLocalData = async () => {
  await habitRepository.clear();
  await checkinRepository.clear();
  await reminderActionRepository.clear();
  await rewardRedemptionRepository.clear();
};

export const importLocalDataFromJson = async (json: string) => {
  const backup = parseBackup(json);

  await habitRepository.saveAll(backup.habits);
  await checkinRepository.saveAll(backup.checkIns);
  await reminderActionRepository.saveAll(backup.reminderActions);
  await rewardRedemptionRepository.saveAll(backup.rewardRedemptions);
  await appSettingsRepository.save({
    ...defaultAppSettings,
    ...backup.settings,
  });

  return backup;
};

const parseBackup = (json: string): DataBackup => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('JSON 格式不正确');
  }

  if (!isBackupLike(parsed)) {
    throw new Error('备份内容不完整，请确认是本 App 导出的 JSON');
  }

  return {
    version: parsed.version === 2 ? 2 : 2,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    habits: parsed.habits as Habit[],
    checkIns: parsed.checkIns as CheckIn[],
    reminderActions: (parsed.reminderActions ?? []) as ReminderAction[],
    rewardRedemptions: (parsed.rewardRedemptions ?? []) as RewardRedemption[],
    settings: {
      ...defaultAppSettings,
      ...(parsed.settings ?? {}),
    },
  };
};

const isBackupLike = (value: unknown): value is Partial<DataBackup> =>
  Boolean(
    value &&
      typeof value === 'object' &&
      Array.isArray((value as Partial<DataBackup>).habits) &&
      Array.isArray((value as Partial<DataBackup>).checkIns),
  );
