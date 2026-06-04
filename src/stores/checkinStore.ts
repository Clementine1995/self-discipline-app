import { defineStore } from 'pinia';
import type { CheckIn } from '@/types/habit';
import { checkinService } from '@/modules/checkins/checkinService';
import { toDateKey } from '@/utils/date';

export const useCheckinStore = defineStore('checkins', {
  state: () => ({
    checkIns: [] as CheckIn[],
    isLoaded: false,
    isLoading: false,
  }),
  getters: {
    todayKey: () => toDateKey(new Date()),
    isHabitCheckedToday: (state) => (habitId: string) => {
      const today = toDateKey(new Date());
      return state.checkIns.some((checkIn) => checkIn.habitId === habitId && checkIn.date === today);
    },
    todayCompletedCount: (state) => {
      const today = toDateKey(new Date());
      return state.checkIns.filter((checkIn) => checkIn.date === today).length;
    },
  },
  actions: {
    async loadCheckIns() {
      if (this.isLoading) {
        return;
      }

      this.isLoading = true;
      try {
        this.checkIns = await checkinService.listCheckIns();
        this.isLoaded = true;
      } finally {
        this.isLoading = false;
      }
    },

    async checkInHabit(habitId: string, date?: string) {
      const checkIn = await checkinService.checkInHabit(habitId, date);

      if (!this.checkIns.some((item) => item.id === checkIn.id)) {
        this.checkIns = [...this.checkIns, checkIn];
      }

      return checkIn;
    },

    async undoCheckIn(habitId: string, date = toDateKey(new Date())) {
      await checkinService.undoCheckIn(habitId, date);
      this.checkIns = this.checkIns.filter(
        (checkIn) => !(checkIn.habitId === habitId && checkIn.date === date),
      );
    },
  },
});
