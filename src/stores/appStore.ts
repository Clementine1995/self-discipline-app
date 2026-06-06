import { defineStore } from 'pinia';
import type { ThemeId } from '@/types/theme';
import type { ToneId } from '@/types/tone';
import { appSettingsRepository, type ReminderIntensity, type ReminderScheduleCount } from '@/modules/settings/settingsRepository';
import { getThemeConfig } from '@/modules/themes/themeConfig';

export const useAppStore = defineStore('app', {
  state: () => ({
    themeId: 'fresh-schedule' as ThemeId,
    toneId: 'gentle' as ToneId,
    reminderIntensity: 'strong' as ReminderIntensity,
    reminderScheduleCount: 14 as ReminderScheduleCount,
    isLoaded: false,
  }),
  getters: {
    currentTheme: (state) => getThemeConfig(state.themeId),
  },
  actions: {
    async loadSettings() {
      if (this.isLoaded) {
        return;
      }

      const settings = await appSettingsRepository.get();
      this.themeId = getThemeConfig(settings.themeId).id;
      this.toneId = settings.toneId;
      this.reminderIntensity = settings.reminderIntensity;
      this.reminderScheduleCount = settings.reminderScheduleCount;
      this.isLoaded = true;
    },

    async setTheme(themeId: ThemeId, syncRecommendedTone = false) {
      const theme = getThemeConfig(themeId);
      this.themeId = theme.id;

      if (syncRecommendedTone) {
        this.toneId = theme.recommendedToneId;
      }

      await this.persistSettings();
    },

    async setTone(toneId: ToneId) {
      this.toneId = toneId;
      await this.persistSettings();
    },

    async setReminderIntensity(reminderIntensity: ReminderIntensity) {
      this.reminderIntensity = reminderIntensity;
      await this.persistSettings();
    },

    async setReminderScheduleCount(reminderScheduleCount: ReminderScheduleCount) {
      this.reminderScheduleCount = reminderScheduleCount;
      await this.persistSettings();
    },

    async persistSettings() {
      await appSettingsRepository.save({
        themeId: this.themeId,
        toneId: this.toneId,
        reminderIntensity: this.reminderIntensity,
        reminderScheduleCount: this.reminderScheduleCount,
      });
    },
  },
});
