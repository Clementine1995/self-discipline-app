<template>
  <IonApp :style="themeStyle" :data-theme="appStore.themeId">
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

        <IonTabButton tab="review" href="/review">
          <IonIcon :icon="reviewIcon" />
          <IonLabel>复盘</IonLabel>
        </IonTabButton>

        <IonTabButton tab="settings" href="/settings">
          <IonIcon :icon="settingsIcon" />
          <IonLabel>设置</IonLabel>
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
import { barChartOutline, calendarClearOutline, chatbubblesOutline, listOutline, settingsOutline } from 'ionicons/icons';
import { computed, onMounted } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { useHabitStore } from '@/stores/habitStore';

const appStore = useAppStore();
const habitStore = useHabitStore();
const todayIcon = calendarClearOutline;
const tasksIcon = listOutline;
const statsIcon = barChartOutline;
const reviewIcon = chatbubblesOutline;
const settingsIcon = settingsOutline;

const themeStyle = computed(() => {
  const theme = appStore.currentTheme;

  return {
    '--ion-background-color': theme.backgroundColor,
    '--ion-text-color': theme.textColor,
    '--ion-color-primary': theme.accentColor,
    '--ion-color-success': theme.successColor,
    '--ion-color-warning': theme.warningColor,
    '--ion-color-danger': theme.dangerColor,
    '--app-surface': theme.surfaceColor,
    '--app-surface-muted': theme.surfaceMutedColor,
    '--app-text-muted': theme.mutedTextColor,
    '--app-border': theme.borderColor,
    '--app-toolbar': theme.toolbarColor,
    '--app-tab-bar': theme.tabBarColor,
    '--app-radius': theme.cardRadius,
    '--app-accent-secondary': theme.secondaryAccentColor,
    '--app-danger': theme.dangerColor,
    '--app-success': theme.successColor,
    '--app-warning': theme.warningColor,
    '--app-shadow': theme.shadowColor,
  };
});

onMounted(() => {
  appStore.loadSettings();
  void habitStore.refreshScheduledReminders();
});
</script>
