export type RewardRule = {
  id: string;
  streakDays: number;
  message: string;
};

export type PunishmentRule = {
  id: string;
  failureThreshold: number;
  message: string;
};
