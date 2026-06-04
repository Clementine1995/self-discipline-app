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
            <h2>积分成长</h2>
            <p>每次打卡 +10 分，连续里程碑会额外加成。</p>
          </div>

          <div class="points-panel">
            <div>
              <span>当前等级</span>
              <strong>Lv.{{ pointSummary.level }}</strong>
              <p>距离下一级还差 {{ pointSummary.pointsToNextLevel }} 分</p>
            </div>
            <div class="points-score">
              <span>总积分</span>
              <strong>{{ pointSummary.totalPoints }}</strong>
            </div>
          </div>

          <div class="progress-track points-track" aria-hidden="true">
            <div class="progress-fill" :style="{ width: `${levelProgress}%` }"></div>
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
                <p>积分 {{ getHabitPoints(progress.habit.id) }} 分</p>
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
import { shouldHabitRunOnDate } from '@/modules/habits/repeatRules';
import { buildPointSummary } from '@/modules/points/pointRules';
import { toDateKey } from '@/utils/date';

const habitStore = useHabitStore();
const checkinStore = useCheckinStore();

onIonViewWillEnter(() => {
  habitStore.loadHabits();
  checkinStore.loadCheckIns();
});

const todayKey = computed(() => toDateKey(new Date()));
const todayHabits = computed(() => habitStore.habits.filter((habit) => shouldHabitRunOnDate(habit, todayKey.value)));
const todayHabitIds = computed(() => new Set(todayHabits.value.map((habit) => habit.id)));
const completedCount = computed(
  () =>
    checkinStore.checkIns.filter(
      (checkIn) => checkIn.date === todayKey.value && todayHabitIds.value.has(checkIn.habitId),
    ).length,
);
const unfinishedCount = computed(() => Math.max(0, todayHabits.value.length - completedCount.value));
const completionRate = computed(() => calculateCompletionRate(completedCount.value, todayHabits.value.length));
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
const pointSummary = computed(() => buildPointSummary(habitStore.habits, checkinStore.checkIns, todayKey.value));
const levelProgress = computed(() => {
  const previousLevelPoints = (pointSummary.value.level - 1) * 100;
  const pointsInLevel = pointSummary.value.totalPoints - previousLevelPoints;
  return calculateCompletionRate(pointsInLevel, 100);
});
const habitPointMap = computed(
  () => new Map(pointSummary.value.habitProgress.map((progress) => [progress.habit.id, progress.totalPoints])),
);
const getHabitPoints = (habitId: string) => habitPointMap.value.get(habitId) ?? 0;
</script>
