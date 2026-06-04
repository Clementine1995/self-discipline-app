import { defineStore } from 'pinia';
import type { ThemeId } from '@/types/theme';
import type { ToneId } from '@/types/tone';

export const useAppStore = defineStore('app', {
  state: () => ({
    themeId: 'fresh-schedule' as ThemeId,
    toneId: 'gentle' as ToneId,
  }),
});
