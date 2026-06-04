<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle>今日打卡</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>
      <IonHeader collapse="condense">
        <IonToolbar>
          <IonTitle size="large">今日打卡</IonTitle>
        </IonToolbar>
      </IonHeader>

      <main class="page-stack">
        <section class="hero-panel">
          <p class="eyebrow">{{ todayLabel }}</p>
          <h1>把今天这一格填上</h1>
          <p>今日完成 {{ completedCount }} / {{ totalCount }}。每个任务每天只记一次打卡。</p>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" :style="{ width: `${completionRate}%` }"></div>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>今日任务</h2>
            <IonButton size="small" router-link="/tasks/new">新增</IonButton>
          </div>

          <div v-if="habitStore.isLoading" class="empty-state">正在读取任务...</div>
          <div v-else-if="habitStore.habits.length === 0" class="empty-state">
            今天还没有任务，先去新增一个。
          </div>

          <IonList v-else lines="none" class="task-list">
            <IonItem v-for="habit in habitStore.habits" :key="habit.id" class="task-item">
              <IonLabel>
                <h3>{{ habit.name }}</h3>
                <p>{{ habit.reminderTime }} 提醒 · 每天重复</p>
                <p v-if="getHabitPrompt(habit.id)" class="habit-prompt">{{ getHabitPrompt(habit.id) }}</p>
              </IonLabel>
              <IonButton
                :fill="checkinStore.isHabitCheckedToday(habit.id) ? 'solid' : 'outline'"
                size="small"
                @click="toggleCheckIn(habit.id)"
              >
                {{ checkinStore.isHabitCheckedToday(habit.id) ? '已完成' : '打卡' }}
              </IonButton>
            </IonItem>
          </IonList>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { computed } from 'vue';
import { useHabitStore } from '@/stores/habitStore';
import { useCheckinStore } from '@/stores/checkinStore';
import { buildHabitStats, calculateCompletionRate } from '@/modules/stats/statsRules';
import { findTriggeredPunishment } from '@/modules/punishments/punishmentRules';
import { findUnlockedReward } from '@/modules/rewards/rewardRules';

const habitStore = useHabitStore();
const checkinStore = useCheckinStore();

onIonViewWillEnter(() => {
  habitStore.loadHabits();
  checkinStore.loadCheckIns();
});

const todayLabel = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date()),
);

const totalCount = computed(() => habitStore.habits.length);
const completedCount = computed(() => checkinStore.todayCompletedCount);
const completionRate = computed(() => calculateCompletionRate(completedCount.value, totalCount.value));
const habitStatsMap = computed(() =>
  new Map(habitStore.habits.map((habit) => [habit.id, buildHabitStats(habit, checkinStore.checkIns)])),
);

const toggleCheckIn = (habitId: string) => {
  if (checkinStore.isHabitCheckedToday(habitId)) {
    checkinStore.undoCheckIn(habitId);
    return;
  }

  checkinStore.checkInHabit(habitId);
};

const getHabitPrompt = (habitId: string) => {
  const stats = habitStatsMap.value.get(habitId);

  if (!stats) {
    return '';
  }

  if (checkinStore.isHabitCheckedToday(habitId)) {
    const reward = findUnlockedReward(stats.currentStreak);
    return reward?.message ?? '';
  }

  const punishment = findTriggeredPunishment(stats.totalFailures);
  return punishment?.message ?? '';
};
</script>
