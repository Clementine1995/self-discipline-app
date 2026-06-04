import type { CheckIn } from '@/types/habit';

export const countTodayCompleted = (checkIns: CheckIn[], date: string) =>
  checkIns.filter((checkIn) => checkIn.date === date).length;

export const calculateCompletionRate = (completed: number, total: number) => {
  if (total === 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
};
