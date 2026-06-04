import type { Habit } from '@/types/habit';
import { createLocalStorageRepository } from '@/modules/storage/localStorageRepository';

export const habitRepository = createLocalStorageRepository<Habit>('self-discipline:habits');
