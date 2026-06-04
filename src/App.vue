<template>
  <IonApp :style="themeStyle">
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
import { barChartOutline, calendarClearOutline, listOutline, settingsOutline } from 'ionicons/icons';
import { computed, onMounted } from 'vue';
import { useAppStore } from '@/stores/appStore';

const appStore = useAppStore();
const todayIcon = calendarClearOutline;
const tasksIcon = listOutline;
const statsIcon = barChartOutline;
const settingsIcon = settingsOutline;

const themeStyle = computed(() => {
  const theme = appStore.currentTheme;

  return {
    '--ion-background-color': theme.backgroundColor,
    '--ion-text-color': theme.textColor,
    '--ion-color-primary': theme.accentColor,
    '--app-surface': theme.surfaceColor,
    '--app-surface-muted': theme.surfaceMutedColor,
    '--app-text-muted': theme.mutedTextColor,
    '--app-border': theme.borderColor,
    '--app-toolbar': theme.toolbarColor,
    '--app-tab-bar': theme.tabBarColor,
    '--app-radius': theme.cardRadius,
  };
});

onMounted(() => {
  appStore.loadSettings();
});
</script>
