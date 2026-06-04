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
          <p class="eyebrow">{{ habit.reminderEnabled ? `${habit.reminderTime} 提醒` : '提醒已关闭' }}</p>
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
        </section>

        <section v-if="habit" class="section-block">
          <div class="section-heading">
            <h2>最近 7 天</h2>
            <p>只展示这个任务的完成状态。</p>
          </div>

          <div class="history-strip">
            <div
              v-for="day in history"
              :key="day.date"
              class="history-day"
              :class="{ checked: day.checked, muted: day.isBeforeCreated }"
            >
              <strong>{{ formatDay(day.date) }}</strong>
              <span>{{ day.isBeforeCreated ? '未创建' : day.checked ? '完成' : '未完成' }}</span>
            </div>
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

        <section v-if="!habit && !habitStore.isLoading" class="section-block">
          <div class="empty-state">没有找到这个任务，可能已经被删除。</div>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
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
import { useRoute } from 'vue-router';
import { useHabitStore } from '@/stores/habitStore';
import { useCheckinStore } from '@/stores/checkinStore';
import { buildHabitSevenDayStatus, buildHabitStats } from '@/modules/stats/statsRules';

const route = useRoute();
const habitStore = useHabitStore();
const checkinStore = useCheckinStore();
const habitId = computed(() => String(route.params.id || ''));
const habit = computed(() => habitStore.getHabitById(habitId.value));
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

onIonViewWillEnter(() => {
  habitStore.loadHabits();
  checkinStore.loadCheckIns();
});

const formatDay = (date: string) => date.slice(5);
</script>
