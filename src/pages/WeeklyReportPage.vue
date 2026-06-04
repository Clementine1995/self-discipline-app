<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/review" />
        </IonButtons>
        <IonTitle>AI 周报</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>
      <main class="page-stack with-top-space">
        <section class="hero-panel">
          <p class="eyebrow">{{ weekRangeLabel }}</p>
          <h1>AI 周报占位版</h1>
          <p>{{ report.summary }}</p>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" :style="{ width: `${report.completionRate}%` }"></div>
          </div>
        </section>

        <section class="stats-grid">
          <div class="metric-tile">
            <span>本周完成</span>
            <strong>{{ report.completedCount }}</strong>
          </div>
          <div class="metric-tile">
            <span>本周未完成</span>
            <strong>{{ report.missedCount }}</strong>
          </div>
          <div class="metric-tile">
            <span>完成率</span>
            <strong>{{ report.completionRate }}%</strong>
          </div>
          <div class="metric-tile">
            <span>统计任务</span>
            <strong>{{ report.habitSummaries.length }}</strong>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>关键发现</h2>
            <p>根据最近 7 天本地打卡记录生成，后续可替换为真实 AI 周报。</p>
          </div>

          <div v-if="report.scheduledCount === 0" class="empty-state">本周还没有可统计的任务。</div>
          <div v-else class="review-list">
            <div v-if="report.mostStableHabit" class="review-row positive">
              <IonIcon :icon="stableIcon" aria-hidden="true" />
              <div>
                <strong>最稳定：{{ report.mostStableHabit.habitName }}</strong>
                <span>
                  完成 {{ report.mostStableHabit.completedCount }}/{{ report.mostStableHabit.scheduledCount }} · 连续
                  {{ report.mostStableHabit.currentStreak }} 天
                </span>
              </div>
            </div>

            <div v-if="report.easiestFailedHabit" class="review-row">
              <IonIcon :icon="riskIcon" aria-hidden="true" />
              <div>
                <strong>最容易失败：{{ report.easiestFailedHabit.habitName }}</strong>
                <span>
                  未完成 {{ report.easiestFailedHabit.missedCount }} 次 · 完成率
                  {{ report.easiestFailedHabit.completionRate }}%
                </span>
              </div>
            </div>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>任务表现</h2>
            <p>只展示本周有计划执行日的任务。</p>
          </div>

          <div v-if="report.habitSummaries.length === 0" class="empty-state">暂无任务表现。</div>
          <div v-else class="review-list">
            <div v-for="habit in report.habitSummaries" :key="habit.habitId" class="downgrade-card">
              <strong>{{ habit.habitName }}</strong>
              <p>完成 {{ habit.completedCount }}/{{ habit.scheduledCount }} · 未完成 {{ habit.missedCount }} 次</p>
              <div class="progress-track" aria-hidden="true">
                <div class="progress-fill" :style="{ width: `${habit.completionRate}%` }"></div>
              </div>
            </div>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>下周建议</h2>
            <p>先给出可执行的本地规则建议。</p>
          </div>

          <ol class="suggestion-list">
            <li v-for="suggestion in report.nextWeekSuggestions" :key="suggestion">{{ suggestion }}</li>
          </ol>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { alertCircleOutline, trophyOutline } from 'ionicons/icons';
import { buildLocalAiWeeklyReport } from '@/modules/ai/aiWeeklyReportService';
import { useCheckinStore } from '@/stores/checkinStore';
import { useHabitStore } from '@/stores/habitStore';

const habitStore = useHabitStore();
const checkinStore = useCheckinStore();
const stableIcon = trophyOutline;
const riskIcon = alertCircleOutline;

onIonViewWillEnter(() => {
  habitStore.loadHabits();
  checkinStore.loadCheckIns();
});

const report = computed(() =>
  buildLocalAiWeeklyReport({
    habits: habitStore.habits,
    checkIns: checkinStore.checkIns,
  }),
);

const weekRangeLabel = computed(() => `${formatDate(report.value.startDate)} - ${formatDate(report.value.endDate)}`);

const formatDate = (dateKey: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00`));
</script>
