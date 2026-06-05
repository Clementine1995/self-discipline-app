export type RewardShopItem = {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: 'rest' | 'treat' | 'fun' | 'growth';
};

export type RewardRedemption = {
  id: string;
  rewardId: string;
  rewardTitle: string;
  cost: number;
  redeemedAt: string;
};
