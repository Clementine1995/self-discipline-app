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
            <strong>0</strong>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>模块占位</h2>
            <p>今日统计已接入本地打卡记录。连续天数、失败次数和 7 日趋势会进入下一阶段。</p>
          </div>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, onIonViewWillEnter } from '@ionic/vue';
import { useHabitStore } from '@/stores/habitStore';
import { useCheckinStore } from '@/stores/checkinStore';
import { calculateCompletionRate } from '@/modules/stats/statsRules';

const habitStore = useHabitStore();
const checkinStore = useCheckinStore();

onIonViewWillEnter(() => {
  habitStore.loadHabits();
  checkinStore.loadCheckIns();
});

const completedCount = computed(() => checkinStore.todayCompletedCount);
const unfinishedCount = computed(() => Math.max(0, habitStore.habits.length - completedCount.value));
const completionRate = computed(() => calculateCompletionRate(completedCount.value, habitStore.habits.length));
</script>
