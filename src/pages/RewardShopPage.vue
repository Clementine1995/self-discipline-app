<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/stats" text="" />
        </IonButtons>
        <IonTitle>奖励商店</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>
      <main class="page-stack with-top-space">
        <section class="hero-panel">
          <p class="eyebrow">积分兑换</p>
          <h1>把坚持换成一点真实奖励</h1>
          <p>可用 {{ shopState.availablePoints }} 分 · 已兑换 {{ shopState.spentPoints }} 分 · 累计 {{ shopState.totalPoints }} 分</p>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" :style="{ width: `${availableRate}%` }"></div>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>可兑换奖励</h2>
            <p>第一版先用本地奖励项，后续再扩展自定义奖励和奖励商店。</p>
          </div>

          <div class="reward-shop-list">
            <div v-for="item in shopState.items" :key="item.id" class="reward-shop-card">
              <div class="reward-shop-title">
                <strong>{{ item.title }}</strong>
                <span>{{ item.cost }} 分</span>
              </div>
              <p>{{ item.description }}</p>
              <small v-if="shopState.availablePoints < item.cost" class="reward-shop-note">
                还差 {{ item.cost - shopState.availablePoints }} 分
              </small>
              <IonButton
                expand="block"
                size="small"
                :disabled="isSaving || shopState.availablePoints < item.cost"
                @click="redeem(item)"
              >
                {{ shopState.availablePoints < item.cost ? '积分不足' : '兑换奖励' }}
              </IonButton>
            </div>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>兑换记录</h2>
            <p>记录只保存在本地，清空数据时会一起删除。</p>
          </div>

          <div v-if="shopState.redemptions.length === 0" class="empty-state">还没有兑换记录。</div>
          <div v-else class="review-list">
            <div v-for="redemption in shopState.redemptions" :key="redemption.id" class="reward-history-row">
              <div>
                <strong>{{ redemption.rewardTitle }}</strong>
                <span>{{ formatRedeemedAt(redemption.redeemedAt) }}</span>
              </div>
              <strong>-{{ redemption.cost }}</strong>
            </div>
          </div>
        </section>
      </main>
    </IonContent>

    <IonToast
      :is-open="toast.isOpen"
      :message="toast.message"
      :duration="1800"
      position="top"
      @didDismiss="toast.isOpen = false"
    />

    <IonAlert
      :is-open="confirmState.isOpen"
      header="确认兑换"
      :message="confirmMessage"
      :buttons="confirmButtons"
      @didDismiss="confirmState.isOpen = false"
    />
  </IonPage>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  IonAlert,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToast,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import type { RewardShopItem } from '@/types/rewardShop';
import { buildRewardShopState, redeemReward, type RewardShopState } from '@/modules/rewards/rewardShopService';
import { calculateCompletionRate } from '@/modules/stats/statsRules';
import { useCheckinStore } from '@/stores/checkinStore';
import { useHabitStore } from '@/stores/habitStore';

const habitStore = useHabitStore();
const checkinStore = useCheckinStore();
const isSaving = ref(false);
const toast = reactive({
  isOpen: false,
  message: '',
});
const confirmState = reactive<{
  isOpen: boolean;
  item?: RewardShopItem;
}>({
  isOpen: false,
  item: undefined,
});
const shopState = ref<RewardShopState>({
  totalPoints: 0,
  spentPoints: 0,
  availablePoints: 0,
  items: [],
  redemptions: [],
});

onIonViewWillEnter(async () => {
  await habitStore.loadHabits();
  await checkinStore.loadCheckIns();
  await refreshShopState();
});

const availableRate = computed(() => calculateCompletionRate(shopState.value.availablePoints, shopState.value.totalPoints));
const confirmMessage = computed(() =>
  confirmState.item ? `将消耗 ${confirmState.item.cost} 分兑换「${confirmState.item.title}」。` : '',
);
const confirmButtons = computed(() => [
  {
    text: '再想想',
    role: 'cancel',
  },
  {
    text: '兑换',
    role: 'confirm',
    handler: confirmRedeem,
  },
]);

const redeem = (item: RewardShopItem) => {
  confirmState.item = item;
  confirmState.isOpen = true;
};

const confirmRedeem = async () => {
  if (!confirmState.item) {
    return;
  }

  isSaving.value = true;
  try {
    const result = await redeemReward(confirmState.item, habitStore.habits, checkinStore.checkIns);
    showToast(result.message);
    await refreshShopState();
  } finally {
    confirmState.isOpen = false;
    confirmState.item = undefined;
    isSaving.value = false;
  }
};

const refreshShopState = async () => {
  shopState.value = await buildRewardShopState(habitStore.habits, checkinStore.checkIns);
};

const showToast = (message: string) => {
  toast.message = message;
  toast.isOpen = true;
};

const formatRedeemedAt = (redeemedAt: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(redeemedAt));
</script>
