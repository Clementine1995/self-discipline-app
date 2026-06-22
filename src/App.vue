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

        <IonTabButton v-if="appStore.showReviewTab" tab="review" href="/review">
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
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
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
import { computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '@/stores/appStore';
import { useHabitStore } from '@/stores/habitStore';
import { cancelDailyReminder } from '@/modules/reminders/reminderService';

const appStore = useAppStore();
const habitStore = useHabitStore();
const route = useRoute();
const router = useRouter();
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
  void registerNativeBackHandler();
  void registerNotificationActionHandler();
});

onUnmounted(() => {
  void backButtonHandle?.remove();
  void notificationActionHandle?.remove();
});

let backButtonHandle: { remove: () => Promise<void> } | undefined;
let notificationActionHandle: { remove: () => Promise<void> } | undefined;

const registerNativeBackHandler = async () => {
  backButtonHandle = await CapacitorApp.addListener('backButton', (event) => {
    const fallbackPath = getBackFallbackPath();

    if (fallbackPath) {
      void router.replace(fallbackPath);
      return;
    }

    if (route.name === 'today' || !event.canGoBack) {
      void CapacitorApp.exitApp();
      return;
    }

    router.back();
  });
};

const getBackFallbackPath = () => {
  if (route.name === 'reminder-action') {
    return '/today';
  }

  if (route.name === 'task-edit') {
    return route.params.id ? `/tasks/${String(route.params.id)}` : '/tasks';
  }

  if (route.name === 'task-detail' || route.name === 'task-new' || route.name === 'task-ai-plan') {
    return '/tasks';
  }

  if (route.name === 'weekly-report') {
    return '/review';
  }

  if (route.name === 'reward-shop') {
    return '/stats';
  }

  return '';
};

const registerNotificationActionHandler = async () => {
  try {
    notificationActionHandle = await LocalNotifications.addListener('localNotificationActionPerformed', async (event) => {
      const extra = event.notification.extra as
        | {
            type?: string;
            habitId?: string;
            date?: string;
          }
        | undefined;

      if (extra?.type === 'habit-reminder' && extra.habitId) {
        if (!habitStore.isLoaded) {
          await habitStore.loadHabits();
        }

        if (!habitStore.getHabitById(extra.habitId)) {
          await cancelDailyReminder(extra.habitId);
          void router.replace('/today');
          return;
        }

        void router.replace({
          path: `/reminders/${extra.habitId}`,
          query: extra.date ? { date: extra.date } : undefined,
        });
      }
    });
  } catch {
    // Browser preview can run without the native notification bridge.
  }
};
</script>
