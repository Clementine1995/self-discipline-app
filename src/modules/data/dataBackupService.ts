import type { CheckIn, Habit } from '@/types/habit';
import type { AppSettings } from '@/modules/settings/settingsRepository';
import { checkinRepository } from '@/modules/checkins/checkinRepository';
import { habitRepository } from '@/modules/habits/habitRepository';
import { appSettingsRepository } from '@/modules/settings/settingsRepository';

export type DataBackup = {
  version: 1;
  exportedAt: string;
  habits: Habit[];
  checkIns: CheckIn[];
  settings: AppSettings;
};

export const exportLocalData = async (): Promise<DataBackup> => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  habits: await habitRepository.getAll(),
  checkIns: await checkinRepository.getAll(),
  settings: await appSettingsRepository.get(),
});

export const exportLocalDataAsJson = async () => JSON.stringify(await exportLocalData(), null, 2);

export const clearLocalData = async () => {
  await habitRepository.clear();
  await checkinRepository.clear();
};
