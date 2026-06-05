import type { RewardRedemption } from '@/types/rewardShop';
import { createLocalStorageRepository } from '@/modules/storage/localStorageRepository';

export const rewardRedemptionRepository = createLocalStorageRepository<RewardRedemption>(
  'self-discipline:reward-redemptions',
);
