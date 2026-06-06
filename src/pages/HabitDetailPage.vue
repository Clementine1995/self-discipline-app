<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/tasks" text="" />
        </IonButtons>
        <IonTitle>任务详情</IonTitle>
        <IonButtons v-if="habit" slot="end">
          <IonButton :router-link="`/tasks/${habit.id}/edit`">编辑</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>
      <main class="page-stack with-top-space">
        <section v-if="habit" class="hero-panel">
          <p class="eyebrow">
            {{ habit.reminderEnabled ? `${habit.reminderTime} 提醒` : '提醒已关闭' }} ·
            {{ formatRepeatRule(habit.repeatRule) }}
          </p>
          <h1>{{ habit.name }}</h1>
          <p>连续 {{ stats.currentStreak }} 天 · 最长 {{ stats.longestStreak }} 天 · 累计 {{ stats.totalCheckIns }} 次</p>
        </section>

        <section v-if="habit" class="stats-grid">
          <div class="metric-tile">
            <span>当前连续</span>
            <strong>{{ stats.currentStreak }}</strong>
          </div>
          <div class="metric-tile">
            <span>最长连续</span>
            <strong>{{ stats.longestStreak }}</strong>
          </div>
          <div class="metric-tile">
            <span>累计打卡</span>
            <strong>{{ stats.totalCheckIns }}</strong>
          </div>
          <div class="metric-tile">
            <span>失败次数</span>
            <strong>{{ stats.totalFailures }}</strong>
          </div>
          <div class="metric-tile">
            <span>任务积分</span>
            <strong>{{ pointProgress.totalPoints }}</strong>
          </div>
          <div class="metric-tile">
            <span>里程碑加成</span>
            <strong>{{ pointProgress.milestoneBonus }}</strong>
          </div>
        </section>

        <section v-if="habit" class="section-block">
          <div class="section-heading">
            <h2>最近 7 天</h2>
            <p>点击某一天可补打卡或取消记录。</p>
          </div>

          <div v-if="statusMessage" class="form-note">{{ statusMessage }}</div>

          <div class="history-strip">
            <button
              v-for="day in history"
              :key="day.date"
              class="history-day"
              :class="{ checked: day.checked, muted: day.isBeforeCreated || !day.isScheduled }"
              type="button"
              :disabled="day.isBeforeCreated || !day.isScheduled"
              @click="toggleHistoryDate(day.date, day.checked)"
            >
              <strong>{{ formatDay(day.date) }}</strong>
              <span>{{ getHistoryDayLabel(day) }}</span>
            </button>
          </div>
        </section>

        <section v-if="habit" class="section-block">
          <div class="section-heading">
            <h2>奖惩规则</h2>
            <p>奖励：{{ habit.rewardText || '暂未设置奖励说明' }}</p>
            <p>惩罚：{{ habit.punishmentText || '暂未设置惩罚说明' }}</p>
            <p>失败阈值：{{ habit.failureThreshold }} 次</p>
          </div>
        </section>

        <section v-if="habit && downgradeSuggestion" class="section-block">
          <div class="section-heading">
            <h2>{{ downgradeSuggestion.title }}</h2>
            <p>{{ downgradeSuggestion.reason }}</p>
            <p>{{ downgradeSuggestion.action }}</p>
          </div>
        </section>

        <section v-if="habit" class="section-block">
          <div class="section-heading">
            <h2>任务操作</h2>
            <p>不需要这个任务了，可以直接从这里删除。</p>
          </div>

          <div class="action-row">
            <IonButton expand="block" :router-link="`/tasks/${habit.id}/edit`">编辑任务</IonButton>
            <IonButton expand="block" fill="outline" color="danger" @click="showDeleteConfirm = true">
              删除任务
            </IonButton>
          </div>
        </section>

        <section v-if="!habit && !habitStore.isLoading" class="section-block">
          <div class="empty-state">没有找到这个任务，可能已经被删除。</div>
        </section>
      </main>
    </IonContent>

    <IonAlert
      :is-open="showDeleteConfirm"
      header="删除这个任务？"
      message="删除后，这个任务和对应的打卡记录都会从本地移除。"
      :buttons="deleteAlertButtons"
      @didDismiss="showDeleteConfirm = false"
    />
  </IonPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  IonAlert,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';
import { useHabitStore } from '@/stores/habitStore';
import { useCheckinStore } from '@/stores/checkinStore';
import { buildHabitSevenDayStatus, buildHabitStats } from '@/modules/stats/statsRules';
import { buildDowngradeSuggestion } from '@/modules/recovery/downgradeRules';
import { useAppStore } from '@/stores/appStore';
import { formatRepeatRule } from '@/modules/habits/repeatRules';
import { buildHabitPointProgress } from '@/modules/points/pointRules';
import type { HabitDayStatus } from '@/modules/stats/statsRules';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const habitStore = useHabitStore();
const checkinStore = useCheckinStore();
const habitId = computed(() => String(route.params.id || ''));
const statusMessage = ref('');
const showDeleteConfirm = ref(false);
const habit = computed(() => habitStore.getHabitById(habitId.value));
const deleteAlertButtons = [
  {
    text: '取消',
    role: 'cancel',
  },
  {
    text: '删除',
    role: 'destructive',
    handler: () => {
      void deleteHabit();
    },
  },
];
const stats = computed(() =>
  habit.value
    ? buildHabitStats(habit.value, checkinStore.checkIns)
    : {
        habitId: habitId.value,
        currentStreak: 0,
        longestStreak: 0,
        totalCheckIns: 0,
        totalFailures: 0,
      },
);
const history = computed(() => (habit.value ? buildHabitSevenDayStatus(habit.value, checkinStore.checkIns) : []));
const downgradeSuggestion = computed(() =>
  habit.value ? buildDowngradeSuggestion(habit.value, stats.value.totalFailures, appStore.toneId) : undefined,
);
const pointProgress = computed(() =>
  habit.value
    ? buildHabitPointProgress(habit.value, checkinStore.checkIns)
    : {
        habit: undefined,
        totalCheckIns: 0,
        longestStreak: 0,
        basePoints: 0,
        milestoneBonus: 0,
        totalPoints: 0,
      },
);

onIonViewWillEnter(() => {
  statusMessage.value = '';
  appStore.loadSettings();
  habitStore.loadHabits();
  checkinStore.loadCheckIns();
});

const formatDay = (date: string) => date.slice(5);
const getHistoryDayLabel = (day: HabitDayStatus) => {
  if (day.isBeforeCreated) {
    return '未创建';
  }

  if (!day.isScheduled) {
    return '休息';
  }

  return day.checked ? '完成' : '未完成';
};

const toggleHistoryDate = async (date: string, checked: boolean) => {
  if (!habit.value) {
    return;
  }

  if (checked) {
    await checkinStore.undoCheckIn(habit.value.id, date);
    statusMessage.value = `${formatDay(date)} 的打卡已取消`;
    return;
  }

  await checkinStore.checkInHabit(habit.value.id, date);
  statusMessage.value = `${formatDay(date)} 已补打卡`;
};

const deleteHabit = async () => {
  if (!habit.value) {
    return;
  }

  await habitStore.deleteHabit(habit.value.id);
  router.replace('/tasks');
};
</script>
