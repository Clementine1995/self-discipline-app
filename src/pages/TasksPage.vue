<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle>任务管理</IonTitle>
        <IonButtons slot="end">
          <IonButton router-link="/tasks/new">新增</IonButton>
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

          <div v-if="habitStore.isLoading" class="empty-state">正在读取任务...</div>
          <div v-else-if="habitStore.habits.length === 0" class="empty-state">
            还没有任务，先创建一个每天要坚持的小动作。
          </div>

          <IonList v-else lines="full" class="plain-list">
            <IonItem v-for="habit in habitStore.habits" :key="habit.id" :router-link="`/tasks/${habit.id}/edit`">
              <IonLabel>
                <h3>{{ habit.name }}</h3>
                <p>{{ habit.reminderEnabled ? `${habit.reminderTime} 提醒` : '提醒已关闭' }}</p>
              </IonLabel>
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
  IonButtons,
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

const habitStore = useHabitStore();

onIonViewWillEnter(() => {
  habitStore.loadHabits();
});
</script>
