import type { ThemeId } from '@/types/theme';
import type { ToneId } from '@/types/tone';
import { createLocalStorageRepository } from '@/modules/storage/localStorageRepository';

export type AppSettings = {
  themeId: ThemeId;
  toneId: ToneId;
};

export const defaultAppSettings: AppSettings = {
  themeId: 'fresh-schedule',
  toneId: 'gentle',
};

const settingsRepository = createLocalStorageRepository<AppSettings>('self-discipline:settings');

export const appSettingsRepository = {
  async get() {
    const values = await settingsRepository.getAll();
    return values[0] ?? defaultAppSettings;
  },

  async save(settings: AppSettings) {
    await settingsRepository.saveAll([settings]);
  },
};
