import type { CheckIn } from '@/types/habit';
import { checkinRepository } from '@/modules/checkins/checkinRepository';
import { toDateKey } from '@/utils/date';

export const checkinService = {
  async listCheckIns() {
    return checkinRepository.getAll();
  },

  async checkInHabit(habitId: string, date = toDateKey(new Date())) {
    const checkIns = await checkinRepository.getAll();
    const existing = checkIns.find((checkIn) => checkIn.habitId === habitId && checkIn.date === date);

    if (existing) {
      return existing;
    }

    const checkIn: CheckIn = {
      id: createId(),
      habitId,
      date,
      checkedAt: new Date().toISOString(),
    };

    await checkinRepository.saveAll([...checkIns, checkIn]);
    return checkIn;
  },

  async undoCheckIn(habitId: string, date = toDateKey(new Date())) {
    const checkIns = await checkinRepository.getAll();
    await checkinRepository.saveAll(
      checkIns.filter((checkIn) => !(checkIn.habitId === habitId && checkIn.date === date)),
    );
  },
};

const createId = () => {
  if ('crypto' in window && 'randomUUID' in window.crypto) {
    return window.crypto.randomUUID();
  }

  return `checkin-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
