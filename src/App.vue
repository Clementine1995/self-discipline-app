<template>
  <IonApp>
    <IonTabs>
      <IonRouterOutlet />

      <IonTabBar slot="bottom">
        <IonTabButton tab="today" href="/today">
          <IonIcon :icon="todayIcon" />
          <IonLabel>今日</IonLabel>
        </IonTabButton>

        <IonTabButton tab="tasks" href="/tasks">
          <IonIcon :icon="tasksIcon" />
          <IonLabel>任务</IonLabel>
        </IonTabButton>

        <IonTabButton tab="stats" href="/stats">
          <IonIcon :icon="statsIcon" />
          <IonLabel>统计</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  </IonApp>
</template>

<script setup lang="ts">
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/vue';
import { barChartOutline, calendarClearOutline, listOutline } from 'ionicons/icons';

const todayIcon = calendarClearOutline;
const tasksIcon = listOutline;
const statsIcon = barChartOutline;
</script>
