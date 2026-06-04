import { defineStore } from 'pinia';
import type { Habit } from '@/types/habit';
import type { HabitDraft } from '@/modules/habits/habitService';
import { habitService } from '@/modules/habits/habitService';

export const useHabitStore = defineStore('habits', {
  state: () => ({
    habits: [] as Habit[],
    isLoaded: false,
    isLoading: false,
  }),
  getters: {
    activeHabits: (state) => state.habits,
    getHabitById: (state) => (id: string) => state.habits.find((habit) => habit.id === id),
  },
  actions: {
    async loadHabits() {
      if (this.isLoading) {
        return;
      }

      this.isLoading = true;
      try {
        this.habits = await habitService.listHabits();
        this.isLoaded = true;
      } finally {
        this.isLoading = false;
      }
    },

    async createHabit(draft: HabitDraft) {
      const habit = await habitService.createHabit(draft);
      this.habits = [...this.habits, habit];
      return habit;
    },

    async updateHabit(id: string, draft: HabitDraft) {
      const habit = await habitService.updateHabit(id, draft);

      if (habit) {
        this.habits = this.habits.map((item) => (item.id === id ? habit : item));
      }

      return habit;
    },

    async deleteHabit(id: string) {
      await habitService.deleteHabit(id);
      this.habits = this.habits.filter((habit) => habit.id !== id);
    },
  },
});
