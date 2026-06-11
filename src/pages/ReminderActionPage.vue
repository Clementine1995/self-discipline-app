<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/today" />
        </IonButtons>
        <IonTitle>提醒处理</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>
      <main class="page-stack with-top-space">
        <section v-if="!habit" class="empty-state">
          没找到这个任务，可能已经被删除。
        </section>

        <template v-else>
          <section class="hero-panel reminder-action-hero" :class="actionTone">
            <div class="decision-topline">
              <p class="eyebrow">{{ formattedDate }}</p>
              <span>{{ statusLabel }}</span>
            </div>
            <h1>{{ habit.name }}</h1>
            <p>{{ habit.reminderTime }} 提醒。{{ elapsedText }}</p>
            <div class="reminder-pressure" :class="{ calm: isCompleted }">
              <span>当前判断</span>
              <strong>{{ pressureText }}</strong>
            </div>
            <div class="decision-metrics">
              <div>
                <span>已过</span>
                <strong>{{ elapsedMetric }}</strong>
              </div>
              <div>
                <span>推迟</span>
                <strong>{{ action?.snoozeCount ?? 0 }}/2</strong>
              </div>
            </div>
          </section>

          <section class="section-block">
            <div class="section-heading">
              <h2>{{ decisionTitle }}</h2>
              <p>{{ decisionDescription }}</p>
            </div>

            <div class="decision-actions">
              <IonButton class="decision-primary" expand="block" :disabled="isCompleted" @click="startTask">
                {{ hasStarted ? '继续做' : '现在做' }}
              </IonButton>
              <div class="decision-secondary-grid">
                <IonButton expand="block" color="success" :disabled="isCompleted" @click="completeTask">
                  完成打卡
                </IonButton>
                <IonButton
                  v-if="canSnooze && !isCompleted"
                  class="decision-secondary"
                  expand="block"
                  fill="outline"
                  @click="snoozeTask"
                >
                  推迟 10 分钟
                </IonButton>
              </div>
              <div v-if="!canSnooze && !isCompleted" class="decision-lock">
                推迟机会已用完，现在只能开始、完成，或者记录放弃原因。
              </div>
            </div>
          </section>

          <section v-if="!isCompleted" class="section-block abandon-section" :class="{ expanded: showAbandonOptions || action?.status === 'abandoned' }">
            <div class="section-heading">
              <h2>今天放弃</h2>
              <p>这是最后入口。确实不做，就把原因留下，别让它变成一笔糊涂账。</p>
            </div>

            <div class="decision-actions compact-action-row">
              <IonButton color="danger" fill="clear" expand="block" @click="showAbandonOptions = !showAbandonOptions">
                {{ showAbandonOptions || action?.status === 'abandoned' ? '收起放弃原因' : '展开放弃原因' }}
              </IonButton>
            </div>

            <div v-if="showAbandonOptions || action?.status === 'abandoned'" class="option-stack compact-options">
              <button
                v-for="reason in abandonReasons"
                :key="reason.value"
                class="option-row option-row-single"
                :class="{ selected: action?.abandonReason === reason.value }"
                @click="abandonTask(reason.value)"
              >
                <strong>{{ reason.label }}</strong>
                <small>{{ reason.description }}</small>
              </button>
            </div>
          </section>
        </template>
      </main>
    </IonContent>

    <IonToast
      :is-open="toast.isOpen"
      :message="toast.message"
      :duration="1800"
      position="top"
      @didDismiss="toast.isOpen = false"
    />
  </IonPage>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToast,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { computed, onUnmounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { AbandonReason, ReminderAction } from '@/types/reminderAction';
import { useCheckinStore } from '@/stores/checkinStore';
import { useHabitStore } from '@/stores/habitStore';
import {
  abandonReasonLabels,
  buildReminderActionSummary,
  getReminderActionLimits,
  reminderActionService,
} from '@/modules/reminderActions/reminderActionService';
import { cancelFollowupReminder, scheduleFollowupReminder } from '@/modules/reminders/reminderService';
import { toDateKey } from '@/utils/date';

const route = useRoute();
const router = useRouter();
const habitStore = useHabitStore();
const checkinStore = useCheckinStore();
const action = ref<ReminderAction>();
const now = ref(new Date());
const showAbandonOptions = ref(false);
const toast = reactive({
  isOpen: false,
  message: '',
});
let timer: ReturnType<typeof window.setInterval> | undefined;

const limits = getReminderActionLimits();
const abandonReasons: { value: AbandonReason; label: string; description: string }[] = [
  { value: 'tired', label: abandonReasonLabels.tired, description: '状态确实不行，明天要把任务降一点。' },
  { value: 'busy', label: abandonReasonLabels.busy, description: '时间被挤掉了，之后要提前安排。' },
  { value: 'forgot', label: abandonReasonLabels.forgot, description: '提醒到了也没接住，需要更明确的入口。' },
  { value: 'resistance', label: abandonReasonLabels.resistance, description: '不是没时间，是不想开始。' },
  { value: 'too_hard', label: abandonReasonLabels.too_hard, description: '任务设计太重，后面要拆小。' },
];

onIonViewWillEnter(async () => {
  await habitStore.loadHabits();
  await checkinStore.loadCheckIns();
  await loadAction();

  window.clearInterval(timer);
  timer = window.setInterval(() => {
    now.value = new Date();
  }, 30000);
});

onUnmounted(() => {
  window.clearInterval(timer);
});

const habitId = computed(() => String(route.params.habitId || ''));
const actionDate = computed(() => (typeof route.query.date === 'string' ? route.query.date : toDateKey(new Date())));
const habit = computed(() => habitStore.getHabitById(habitId.value));
const isCompleted = computed(() => checkinStore.checkIns.some((item) => item.habitId === habitId.value && item.date === actionDate.value));
const hasStarted = computed(() => action.value?.status === 'started' || Boolean(action.value?.startedAt));
const summary = computed(() => (action.value ? buildReminderActionSummary(action.value, now.value) : undefined));
const canSnooze = computed(() => Boolean(summary.value?.canSnooze));
const elapsedMetric = computed(() => (summary.value ? formatDuration(summary.value.overdueMinutes) : '0 分钟'));
const actionTone = computed(() => {
  if (isCompleted.value) {
    return 'done';
  }

  if (action.value?.status === 'abandoned') {
    return 'abandoned';
  }

  if (summary.value?.isSnoozed) {
    return 'snoozed';
  }

  if (hasStarted.value) {
    return 'started';
  }

  return 'urgent';
});
const formattedDate = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(`${actionDate.value}T00:00:00`)),
);
const elapsedText = computed(() => {
  if (!summary.value) {
    return '提醒还没有进入处理状态。';
  }

  if (summary.value.isSnoozed && action.value?.snoozedUntil) {
    return `已推迟到 ${formatClock(action.value.snoozedUntil)}。`;
  }

  return `距离本次提醒已经过去 ${formatDuration(summary.value.overdueMinutes)}。`;
});
const statusLabel = computed(() => {
  if (isCompleted.value) {
    return '已完成';
  }

  if (action.value?.status === 'abandoned') {
    return '已放弃';
  }

  if (summary.value?.isSnoozed) {
    return '已推迟';
  }

  if (hasStarted.value) {
    return '已开始';
  }

  return '待处理';
});
const pressureText = computed(() => {
  if (isCompleted.value) {
    return '这次提醒已经闭环。';
  }

  if (action.value?.status === 'abandoned') {
    return `原因：${action.value.abandonReason ? abandonReasonLabels[action.value.abandonReason] : '未记录'}`;
  }

  if (!summary.value) {
    return '还没到提醒时间。';
  }

  if (summary.value.isSnoozed) {
    return `还剩 ${limits.maxSnoozeCount - action.value!.snoozeCount} 次推迟机会。`;
  }

  if (!summary.value.canSnooze) {
    return '推迟次数用完了，现在只能开始或放弃。';
  }

  return '现在给它一个结果。';
});
const decisionTitle = computed(() => {
  if (isCompleted.value) {
    return '这次已经闭环';
  }

  if (action.value?.status === 'abandoned') {
    return '已记录放弃原因';
  }

  if (!canSnooze.value) {
    return '别再往后挪了';
  }

  if (hasStarted.value) {
    return '把开始变成完成';
  }

  return '先立刻开始';
});
const decisionDescription = computed(() => {
  if (isCompleted.value) {
    return '打卡记录已经锁定，回到今日页继续处理剩余任务。';
  }

  if (action.value?.status === 'abandoned') {
    return '今天已经留下原因。下次调整任务强度，不要只靠硬扛。';
  }

  if (!canSnooze.value) {
    return '推迟次数用完后，系统不再给缓冲。现在只剩执行或留下放弃原因。';
  }

  if (hasStarted.value) {
    return '已经开始就别停在开始。完成后直接打卡闭环。';
  }

  return '先点“现在做”，让任务进入执行状态；真的完成后再打卡。';
});

const loadAction = async () => {
  const currentHabit = habit.value;

  if (!currentHabit) {
    action.value = undefined;
    return;
  }

  action.value = await reminderActionService.ensureAction(currentHabit, actionDate.value);
};

const startTask = async () => {
  if (!habit.value || isCompleted.value) {
    return;
  }

  action.value = await reminderActionService.markStarted(habit.value, actionDate.value);
  showToast('已开始，先把动作做起来');
};

const snoozeTask = async () => {
  if (!habit.value || !canSnooze.value || isCompleted.value) {
    return;
  }

  action.value = await reminderActionService.snooze(habit.value, actionDate.value);

  if (action.value?.snoozedUntil) {
    await scheduleFollowupReminder(habit.value, new Date(action.value.snoozedUntil));
  }

  showToast(`已推迟 ${limits.snoozeMinutes} 分钟`);
};

const abandonTask = async (reason: AbandonReason) => {
  if (!habit.value || isCompleted.value) {
    return;
  }

  action.value = await reminderActionService.abandon(habit.value, reason, actionDate.value);
  showAbandonOptions.value = true;
  await cancelFollowupReminder(habit.value.id, actionDate.value);
  showToast('已记录放弃原因');
};

const completeTask = async () => {
  if (!habit.value || isCompleted.value) {
    return;
  }

  await checkinStore.checkInHabit(habit.value.id, actionDate.value);
  action.value = await reminderActionService.markCompleted(habit.value.id, actionDate.value);
  await cancelFollowupReminder(habit.value.id, actionDate.value);
  showToast('已完成打卡');
  window.setTimeout(() => {
    void router.replace('/today');
  }, 450);
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} 小时` : `${hours} 小时 ${rest} 分钟`;
};

const formatClock = (isoValue: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoValue));

const showToast = (message: string) => {
  toast.message = message;
  toast.isOpen = true;
};
</script>
