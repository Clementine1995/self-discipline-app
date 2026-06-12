<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle>任务管理</IonTitle>
        <IonButtons slot="end">
          <IonButton router-link="/tasks/ai-plan">
            <IonIcon slot="start" :icon="sparklesIcon" />
            AI
          </IonButton>
          <IonButton router-link="/tasks/new">
            <IonIcon slot="icon-only" :icon="addIcon" />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>
      <main class="page-stack with-top-space">
        <section class="hero-panel task-library-hero">
          <div class="task-library-header">
            <div>
              <p class="eyebrow">任务库</p>
              <h1>{{ libraryTitle }}</h1>
            </div>
            <IonButton size="small" fill="outline" router-link="/tasks/ai-plan">
              <IonIcon slot="start" :icon="sparklesIcon" />
              AI
            </IonButton>
          </div>
          <p>{{ libraryMessage }}</p>
          <div class="task-library-metrics">
            <div>
              <span>总任务</span>
              <strong>{{ totalHabitCount }}</strong>
            </div>
            <div>
              <span>提醒开启</span>
              <strong>{{ reminderEnabledCount }}</strong>
            </div>
          </div>
        </section>

        <section class="section-block task-library-section">
          <div class="section-heading">
            <h2>自律任务</h2>
            <p>管理提醒、重复规则和奖惩文案。任务越清楚，执行时越少扯皮。</p>
          </div>

          <div v-if="habitStore.isLoading" class="empty-state">正在读取任务...</div>
          <div v-else-if="habitStore.habits.length === 0" class="empty-state empty-guide">
            <strong>从自己的任务开始</strong>
            <p>这里不会预置任务。把你想坚持的事添加进来，后续可以随时编辑或删除。</p>
            <IonButton size="small" router-link="/tasks/new">
              <IonIcon slot="start" :icon="addIcon" />
              新建任务
            </IonButton>
          </div>

          <IonList v-else lines="none" class="plain-list task-library-list">
            <IonItem
              v-for="habit in habitStore.habits"
              :key="habit.id"
              class="task-library-item"
              :class="{ quiet: !habit.reminderEnabled }"
              :router-link="`/tasks/${habit.id}`"
            >
              <IonLabel>
                <div class="task-title-row">
                  <h3>{{ habit.name }}</h3>
                  <span v-if="!habit.reminderEnabled" class="task-state-pill">全天</span>
                </div>
                <p>{{ getHabitScheduleText(habit) }} · {{ formatRepeatRule(habit.repeatRule) }}</p>
                <div class="task-library-meta">
                  <span>连续 {{ getHabitStats(habit.id)?.currentStreak ?? 0 }} 天</span>
                  <span>失败 {{ getHabitStats(habit.id)?.totalFailures ?? 0 }} 次</span>
                </div>
              </IonLabel>
            </IonItem>
          </IonList>
        </section>
      </main>
    </IonContent>

    <IonToast
      :is-open="toast.isOpen"
      :message="toast.message"
      :duration="6500"
      position="top"
      @didDismiss="toast.isOpen = false"
    />
  </IonPage>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToast,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { addOutline, sparklesOutline } from 'ionicons/icons';
import { computed, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { formatRepeatRule } from '@/modules/habits/repeatRules';
import { buildHabitStats } from '@/modules/stats/statsRules';
import { useHabitStore } from '@/stores/habitStore';
import { useCheckinStore } from '@/stores/checkinStore';

const route = useRoute();
const router = useRouter();
const habitStore = useHabitStore();
const checkinStore = useCheckinStore();
const addIcon = addOutline;
const sparklesIcon = sparklesOutline;
const toast = reactive({
  isOpen: false,
  message: '',
});

onIonViewWillEnter(async () => {
  await habitStore.loadHabits();
  await checkinStore.loadCheckIns();

  if (route.query.reminder === '1' && habitStore.reminderMessage) {
    toast.message = `任务已保存，${habitStore.reminderMessage}`;
    toast.isOpen = true;
    await router.replace({ path: '/tasks' });
  }
});

const totalHabitCount = computed(() => habitStore.habits.length);
const reminderEnabledCount = computed(() => habitStore.habits.filter((habit) => habit.reminderEnabled).length);
const libraryTitle = computed(() => {
  if (totalHabitCount.value === 0) {
    return '先放进一个规则';
  }

  return `${totalHabitCount.value} 个任务规则`;
});
const libraryMessage = computed(() => {
  if (totalHabitCount.value === 0) {
    return '别先追求完美计划，先把一个会真的执行的动作写下来。';
  }

  if (reminderEnabledCount.value === 0) {
    return '所有任务都没有开启提醒，执行全靠自觉，风险偏高。';
  }

  const untimedCount = totalHabitCount.value - reminderEnabledCount.value;
  return `已管理 ${totalHabitCount.value} 个任务，其中 ${reminderEnabledCount.value} 个会主动提醒你，${untimedCount} 个只要求当天完成。`;
});
const habitStatsMap = computed(() =>
  new Map(habitStore.habits.map((habit) => [habit.id, buildHabitStats(habit, checkinStore.checkIns)])),
);

const getHabitStats = (habitId: string) => habitStatsMap.value.get(habitId);
const getHabitScheduleText = (habit: { reminderEnabled: boolean; reminderTime: string }) =>
  habit.reminderEnabled ? `${habit.reminderTime} 提醒` : '全天完成';
</script>
