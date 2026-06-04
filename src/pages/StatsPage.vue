<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle>统计</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>
      <main class="page-stack with-top-space">
        <section class="stats-grid">
          <div class="metric-tile">
            <span>今日完成</span>
            <strong>{{ completedCount }}</strong>
          </div>
          <div class="metric-tile">
            <span>今日未完成</span>
            <strong>{{ unfinishedCount }}</strong>
          </div>
          <div class="metric-tile">
            <span>本周完成率</span>
            <strong>{{ completionRate }}%</strong>
          </div>
          <div class="metric-tile">
            <span>总失败次数</span>
            <strong>{{ totalFailures }}</strong>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>任务表现</h2>
            <p>连续天数和失败次数来自独立规则模块，页面只负责展示结果。</p>
          </div>

          <IonList lines="full" class="plain-list">
            <IonItem v-for="progress in habitProgressList" :key="progress.habit.id">
              <IonLabel>
                <h3>{{ progress.habit.name }}</h3>
                <p>
                  连续 {{ progress.currentStreak }} 天 · 最长 {{ progress.longestStreak }} 天 · 失败
                  {{ progress.totalFailures }} 次
                </p>
              </IonLabel>
            </IonItem>
          </IonList>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>最近 7 天</h2>
            <p>先用轻量文本趋势，后续再换成图表组件。</p>
          </div>

          <div class="trend-list">
            <div v-for="day in sevenDayTrend" :key="day.date" class="trend-row">
              <span>{{ day.date }}</span>
              <div class="trend-bar" aria-hidden="true">
                <div class="trend-fill" :style="{ width: `${day.completionRate}%` }"></div>
              </div>
              <strong>{{ day.completionRate }}%</strong>
            </div>
          </div>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
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
import { useHabitStore } from '@/stores/habitStore';
import { useCheckinStore } from '@/stores/checkinStore';
import { buildHabitStats, buildSevenDayTrend, calculateCompletionRate } from '@/modules/stats/statsRules';

const habitStore = useHabitStore();
const checkinStore = useCheckinStore();

onIonViewWillEnter(() => {
  habitStore.loadHabits();
  checkinStore.loadCheckIns();
});

const completedCount = computed(() => checkinStore.todayCompletedCount);
const unfinishedCount = computed(() => Math.max(0, habitStore.habits.length - completedCount.value));
const completionRate = computed(() => calculateCompletionRate(completedCount.value, habitStore.habits.length));
const habitProgressList = computed(() =>
  habitStore.habits.map((habit) => ({
    habit,
    ...buildHabitStats(habit, checkinStore.checkIns),
  })),
);
const totalFailures = computed(() =>
  habitProgressList.value.reduce((total, progress) => total + progress.totalFailures, 0),
);
const sevenDayTrend = computed(() => buildSevenDayTrend(habitStore.habits, checkinStore.checkIns));
</script>
