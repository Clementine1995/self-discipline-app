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
        <section class="section-block">
          <div class="section-heading">
            <h2>自律任务</h2>
            <p>本地保存，后续可替换为 Preferences、SQLite 或后端同步。</p>
          </div>

          <div v-if="habitStore.reminderMessage" class="reminder-diagnostic">
            <strong>提醒排查结果</strong>
            <p>{{ habitStore.reminderMessage }}</p>
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

          <IonList v-else lines="full" class="plain-list">
            <IonItem v-for="habit in habitStore.habits" :key="habit.id" :router-link="`/tasks/${habit.id}`">
              <IonLabel>
                <h3>{{ habit.name }}</h3>
                <p>{{ habit.reminderEnabled ? `${habit.reminderTime} 提醒` : '提醒已关闭' }} · {{ formatRepeatRule(habit.repeatRule) }}</p>
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
import { reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { formatRepeatRule } from '@/modules/habits/repeatRules';
import { useHabitStore } from '@/stores/habitStore';

const route = useRoute();
const router = useRouter();
const habitStore = useHabitStore();
const addIcon = addOutline;
const sparklesIcon = sparklesOutline;
const toast = reactive({
  isOpen: false,
  message: '',
});

onIonViewWillEnter(async () => {
  await habitStore.loadHabits();

  if (route.query.reminder === '1' && habitStore.reminderMessage) {
    toast.message = habitStore.reminderMessage;
    toast.isOpen = true;
    await router.replace({ path: '/tasks' });
  }
});
</script>
