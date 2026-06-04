import { defineStore } from 'pinia';
import type { ThemeId } from '@/types/theme';
import type { ToneId } from '@/types/tone';
import { appSettingsRepository } from '@/modules/settings/settingsRepository';
import { getThemeConfig } from '@/modules/themes/themeConfig';

export const useAppStore = defineStore('app', {
  state: () => ({
    themeId: 'fresh-schedule' as ThemeId,
    toneId: 'gentle' as ToneId,
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
      this.themeId = settings.themeId;
      this.toneId = settings.toneId;
      this.isLoaded = true;
    },

    async setTheme(themeId: ThemeId) {
      this.themeId = themeId;
      await this.persistSettings();
    },

    async setTone(toneId: ToneId) {
      this.toneId = toneId;
      await this.persistSettings();
    },

    async persistSettings() {
      await appSettingsRepository.save({
        themeId: this.themeId,
        toneId: this.toneId,
      });
    },
  },
});
