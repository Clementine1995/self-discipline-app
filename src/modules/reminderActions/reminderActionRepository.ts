import type { ReminderAction } from '@/types/reminderAction';
import { createLocalStorageRepository } from '@/modules/storage/localStorageRepository';

export const reminderActionRepository = createLocalStorageRepository<ReminderAction>(
  'self-discipline:reminder-actions',
);
