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
          <p>今日完成 {{ completedCount }} / {{ totalCount }}。只展示今天需要执行的任务。</p>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" :style="{ width: `${completionRate}%` }"></div>
          </div>
        </section>

        <section class="theme-feedback" :class="appStore.currentTheme.feedbackStyle">
          <div>
            <span>{{ appStore.currentTheme.name }}</span>
            <strong>{{ themeFeedback.title }}</strong>
            <p>{{ themeFeedback.message }}</p>
          </div>
          <div class="theme-feedback-mark" aria-hidden="true">{{ themeFeedback.mark }}</div>
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
          <div v-else-if="todayHabits.length === 0" class="empty-state">
            今天没有需要执行的任务，可以休息一下。
          </div>

          <IonList v-else lines="none" class="task-list">
            <IonItem v-for="habit in todayHabits" :key="habit.id" class="task-item">
              <IonLabel>
                <h3>{{ habit.name }}</h3>
                <p>{{ habit.reminderTime }} 提醒 · {{ formatRepeatRule(habit.repeatRule) }}</p>
                <p v-if="getHabitPrompt(habit.id)" class="habit-prompt">{{ getHabitPrompt(habit.id) }}</p>
                <p v-if="getDowngradePrompt(habit.id)" class="habit-prompt muted">{{ getDowngradePrompt(habit.id) }}</p>
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

    <IonAlert
      :is-open="rewardAlert.isOpen"
      header="奖励已解锁"
      :message="rewardAlert.message"
      confirm-button-text="知道了"
      @didDismiss="rewardAlert.isOpen = false"
    />

    <IonToast
      :is-open="toast.isOpen"
      :message="toast.message"
      :duration="1800"
      position="top"
      @didDismiss="toast.isOpen = false"
    />
  </IonPage>
</template>

<script setup lang="ts">
import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToast,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { computed, reactive } from 'vue';
import { useHabitStore } from '@/stores/habitStore';
import { useCheckinStore } from '@/stores/checkinStore';
import { buildHabitStats, calculateCompletionRate } from '@/modules/stats/statsRules';
import { findTriggeredPunishment } from '@/modules/punishments/punishmentRules';
import { findUnlockedReward } from '@/modules/rewards/rewardRules';
import { renderTonePrompt } from '@/modules/tones/toneCopy';
import { useAppStore } from '@/stores/appStore';
import { buildDowngradeSuggestion } from '@/modules/recovery/downgradeRules';
import { formatRepeatRule, shouldHabitRunOnDate } from '@/modules/habits/repeatRules';
import { toDateKey } from '@/utils/date';

const habitStore = useHabitStore();
const checkinStore = useCheckinStore();
const appStore = useAppStore();
const toast = reactive({
  isOpen: false,
  message: '',
});
const rewardAlert = reactive({
  isOpen: false,
  message: '',
});

onIonViewWillEnter(() => {
  appStore.loadSettings();
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

const todayKey = computed(() => toDateKey(new Date()));
const todayHabits = computed(() => habitStore.habits.filter((habit) => shouldHabitRunOnDate(habit, todayKey.value)));
const todayHabitIds = computed(() => new Set(todayHabits.value.map((habit) => habit.id)));
const totalCount = computed(() => todayHabits.value.length);
const completedCount = computed(
  () =>
    checkinStore.checkIns.filter(
      (checkIn) => checkIn.date === todayKey.value && todayHabitIds.value.has(checkIn.habitId),
    ).length,
);
const unfinishedCount = computed(() => Math.max(0, totalCount.value - completedCount.value));
const completionRate = computed(() => calculateCompletionRate(completedCount.value, totalCount.value));
const themeFeedback = computed(() => {
  const style = appStore.currentTheme.feedbackStyle;

  if (style === 'achievement') {
    return {
      mark: `${completionRate.value}%`,
      title: completedCount.value > 0 ? '连击能量已充入' : '今日副本待开启',
      message: totalCount.value === 0 ? '今天没有任务，休整也是节奏的一部分。' : '完成一项就点亮一格，今天先把进度条推起来。',
    };
  }

  if (style === 'discipline') {
    return {
      mark: `${unfinishedCount.value}`,
      title: unfinishedCount.value === 0 ? '今日风险清零' : '仍有任务待处理',
      message: unfinishedCount.value === 0 ? '执行完成，保持当前纪律。' : '先选一个最低版本完成，别让失败次数继续滚动。',
    };
  }

  return {
    mark: `${completedCount.value}/${totalCount.value}`,
    title: completedCount.value === totalCount.value && totalCount.value > 0 ? '今天的节奏很稳' : '按自己的节奏来',
    message: totalCount.value === 0 ? '今天没有需要执行的任务。' : '不用把一天塞满，先把该做的这一格填上。',
  };
});
const habitStatsMap = computed(() =>
  new Map(todayHabits.value.map((habit) => [habit.id, buildHabitStats(habit, checkinStore.checkIns)])),
);

const toggleCheckIn = async (habitId: string) => {
  if (checkinStore.isHabitCheckedToday(habitId)) {
    await checkinStore.undoCheckIn(habitId);
    showToast('已取消今天的打卡');
    return;
  }

  await checkinStore.checkInHabit(habitId);

  const habit = habitStore.getHabitById(habitId);
  const stats = buildHabitStatsById(habitId);
  const reward = stats ? findUnlockedReward(stats.currentStreak) : undefined;
  const message = reward
    ? renderTonePrompt(appStore.toneId, 'reward', reward.message)
    : `${habit?.name ?? '任务'} 已完成，今天这一格补上了。`;

  if (reward) {
    rewardAlert.message = message;
    rewardAlert.isOpen = true;
    return;
  }

  showToast(message);
};

const getHabitPrompt = (habitId: string) => {
  const stats = buildHabitStatsById(habitId);

  if (!stats) {
    return '';
  }

  if (checkinStore.isHabitCheckedToday(habitId)) {
    const reward = findUnlockedReward(stats.currentStreak);
    return renderTonePrompt(appStore.toneId, 'reward', reward?.message ?? '');
  }

  const punishment = findTriggeredPunishment(stats.totalFailures);
  return renderTonePrompt(appStore.toneId, 'punishment', punishment?.message ?? '');
};

const getDowngradePrompt = (habitId: string) => {
  if (checkinStore.isHabitCheckedToday(habitId)) {
    return '';
  }

  const habit = habitStore.getHabitById(habitId);
  const stats = buildHabitStatsById(habitId);

  if (!habit || !stats) {
    return '';
  }

  return buildDowngradeSuggestion(habit, stats.totalFailures, appStore.toneId)?.action ?? '';
};

const buildHabitStatsById = (habitId: string) => habitStatsMap.value.get(habitId);

const showToast = (message: string) => {
  toast.message = message;
  toast.isOpen = true;
};
</script>
