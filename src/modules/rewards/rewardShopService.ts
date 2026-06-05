import type { CheckIn, Habit } from '@/types/habit';
import type { RewardRedemption, RewardShopItem } from '@/types/rewardShop';
import { buildPointSummary } from '@/modules/points/pointRules';
import { rewardRedemptionRepository } from '@/modules/rewards/rewardShopRepository';

export type RewardShopState = {
  totalPoints: number;
  spentPoints: number;
  availablePoints: number;
  items: RewardShopItem[];
  redemptions: RewardRedemption[];
};

export type RedeemRewardResult = {
  success: boolean;
  message: string;
  redemption?: RewardRedemption;
};

export const defaultRewardShopItems: RewardShopItem[] = [
  {
    id: 'rest-30',
    title: '认真放松 30 分钟',
    description: '不补偿、不刷任务，允许自己完整休息一小段。',
    cost: 60,
    category: 'rest',
  },
  {
    id: 'coffee',
    title: '买一杯喜欢的饮品',
    description: '给坚持一点真实反馈，别用过度消费替代奖励。',
    cost: 100,
    category: 'treat',
  },
  {
    id: 'episode',
    title: '看一集剧或视频',
    description: '兑换后放心看，不要边看边内疚。',
    cost: 120,
    category: 'fun',
  },
  {
    id: 'small-gear',
    title: '添一个小装备',
    description: '买一个能降低执行阻力的小物件，比如书签、杯子、运动小工具。',
    cost: 220,
    category: 'growth',
  },
];

export const buildRewardShopState = async (habits: Habit[], checkIns: CheckIn[]): Promise<RewardShopState> => {
  const pointSummary = buildPointSummary(habits, checkIns);
  const redemptions = await rewardRedemptionRepository.getAll();
  const spentPoints = redemptions.reduce((total, redemption) => total + redemption.cost, 0);

  return {
    totalPoints: pointSummary.totalPoints,
    spentPoints,
    availablePoints: Math.max(0, pointSummary.totalPoints - spentPoints),
    items: defaultRewardShopItems,
    redemptions: [...redemptions].sort((left, right) => right.redeemedAt.localeCompare(left.redeemedAt)),
  };
};

export const redeemReward = async (
  item: RewardShopItem,
  habits: Habit[],
  checkIns: CheckIn[],
): Promise<RedeemRewardResult> => {
  const state = await buildRewardShopState(habits, checkIns);

  if (state.availablePoints < item.cost) {
    return {
      success: false,
      message: `可用积分不足，还差 ${item.cost - state.availablePoints} 分。`,
    };
  }

  const redemption: RewardRedemption = {
    id: createId(),
    rewardId: item.id,
    rewardTitle: item.title,
    cost: item.cost,
    redeemedAt: new Date().toISOString(),
  };

  await rewardRedemptionRepository.saveAll([redemption, ...state.redemptions]);

  return {
    success: true,
    message: `${item.title} 已兑换，记得好好享受这份奖励。`,
    redemption,
  };
};

const createId = () => {
  if ('crypto' in window && 'randomUUID' in window.crypto) {
    return window.crypto.randomUUID();
  }

  return `reward-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
