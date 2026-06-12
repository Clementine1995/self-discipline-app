import type { ThemeId } from '@/types/theme';
import type { ToneId } from '@/types/tone';
import { createLocalStorageRepository } from '@/modules/storage/localStorageRepository';

export type ReminderIntensity = 'normal' | 'strong';
export type ReminderScheduleCount = 7 | 14 | 30;

export type AppSettings = {
  themeId: ThemeId;
  toneId: ToneId;
  reminderIntensity: ReminderIntensity;
  reminderScheduleCount: ReminderScheduleCount;
  showReviewTab: boolean;
};

export const defaultAppSettings: AppSettings = {
  themeId: 'fresh-schedule',
  toneId: 'gentle',
  reminderIntensity: 'strong',
  reminderScheduleCount: 14,
  showReviewTab: false,
};

const settingsRepository = createLocalStorageRepository<AppSettings>('self-discipline:settings');

export const appSettingsRepository = {
  async get() {
    const values = await settingsRepository.getAll();
    return {
      ...defaultAppSettings,
      ...(values[0] ?? {}),
    };
  },

  async save(settings: AppSettings) {
    await settingsRepository.saveAll([settings]);
  },
};
