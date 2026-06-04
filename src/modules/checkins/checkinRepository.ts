import type { CheckIn } from '@/types/habit';
import { createLocalStorageRepository } from '@/modules/storage/localStorageRepository';

export const checkinRepository = createLocalStorageRepository<CheckIn>('self-discipline:checkins');
