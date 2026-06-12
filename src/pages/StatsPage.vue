<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle>统计</IonTitle>
        <IonButtons slot="end">
          <IonButton router-link="/rewards">
            <IonIcon slot="start" :icon="giftIcon" />
            奖励
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>
      <main class="page-stack with-top-space stats-page">
        <section class="section-block calendar-section">
          <div class="calendar-header">
            <div>
              <h2>{{ monthTitle }}</h2>
              <p>{{ calendarSummary }}</p>
            </div>
            <div class="calendar-nav">
              <IonButton fill="clear" size="small" aria-label="上个月" @click="moveMonth(-1)">
                <IonIcon slot="icon-only" :icon="backIcon" />
              </IonButton>
              <IonButton fill="clear" size="small" aria-label="回到本月" @click="goToCurrentMonth">
                <IonIcon slot="icon-only" :icon="calendarIcon" />
              </IonButton>
              <IonButton fill="clear" size="small" aria-label="下个月" @click="moveMonth(1)">
                <IonIcon slot="icon-only" :icon="forwardIcon" />
              </IonButton>
            </div>
          </div>

          <div class="calendar-weekdays" aria-hidden="true">
            <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
          </div>

          <div class="calendar-grid">
            <button
              v-for="day in calendarDays"
              :key="day.date"
              class="calendar-day"
              :class="[day.status, { outside: !day.inMonth, selected: day.date === selectedDate, today: day.date === todayKey }]"
              type="button"
              :aria-label="getCalendarDayLabel(day)"
              @click="selectDay(day.date)"
            >
              <span class="calendar-day-number">{{ Number(day.date.slice(8)) }}</span>
              <strong v-if="day.total > 0">{{ day.completed }}/{{ day.total }}</strong>
              <small v-else>休</small>
            </button>
          </div>

          <div class="calendar-legend">
            <span><i class="done"></i>全完成</span>
            <span><i class="partial"></i>部分完成</span>
            <span><i class="missed"></i>未完成</span>
            <span><i class="planned"></i>待执行</span>
          </div>
        </section>

        <section class="section-block day-detail-section">
          <div class="section-heading">
            <h2>{{ selectedDayTitle }}</h2>
            <p>{{ selectedDaySummary }}</p>
          </div>

          <div class="day-detail-metrics">
            <div>
              <span>应做</span>
              <strong>{{ selectedDayMetrics.total }}</strong>
            </div>
            <div>
              <span>完成</span>
              <strong>{{ selectedDayMetrics.completed }}</strong>
            </div>
            <div>
              <span>完成率</span>
              <strong>{{ selectedDayMetrics.completionRate }}%</strong>
            </div>
          </div>

          <div v-if="selectedDayTasks.length === 0" class="empty-state compact-empty">
            这一天没有安排任务。
          </div>
          <IonList v-else lines="none" class="plain-list day-task-list">
            <IonItem v-for="item in selectedDayTasks" :key="item.habit.id" class="day-task-item" :class="item.status">
              <IonLabel>
                <div class="task-title-row">
                  <h3>{{ item.habit.name }}</h3>
                  <span class="task-state-pill">{{ item.label }}</span>
                </div>
                <p>{{ item.meta }}</p>
              </IonLabel>
            </IonItem>
          </IonList>
        </section>

        <section class="stats-overview-grid compact-stats-grid">
          <div class="metric-tile primary">
            <span>今日完成</span>
            <strong>{{ completedCount }}/{{ todayHabits.length }}</strong>
          </div>
          <div class="metric-tile">
            <span>本周完成率</span>
            <strong>{{ weeklyCompletionRate }}%</strong>
          </div>
          <div class="metric-tile">
            <span>总积分</span>
            <strong>{{ pointSummary.totalPoints }}</strong>
          </div>
          <div class="metric-tile">
            <span>总失败</span>
            <strong>{{ totalFailures }}</strong>
          </div>
        </section>

      </main>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  IonContent,
  IonHeader,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { calendarOutline, chevronBackOutline, chevronForwardOutline, giftOutline } from 'ionicons/icons';
import type { Habit } from '@/types/habit';
import { useHabitStore } from '@/stores/habitStore';
import { useCheckinStore } from '@/stores/checkinStore';
import { buildHabitStats, buildSevenDayTrend, calculateCompletionRate } from '@/modules/stats/statsRules';
import { formatRepeatRule, shouldHabitBeActiveOnDate } from '@/modules/habits/repeatRules';
import { buildPointSummary } from '@/modules/points/pointRules';
import { addDays, parseDateKey, toDateKey } from '@/utils/date';

type CalendarDayStatus = 'done' | 'partial' | 'missed' | 'planned' | 'rest' | 'active';

type CalendarDay = {
  date: string;
  inMonth: boolean;
  completed: number;
  total: number;
  completionRate: number;
  status: CalendarDayStatus;
};

type DayTaskStatus = 'done' | 'missed' | 'planned' | 'pending';

type DayTask = {
  habit: Habit;
  status: DayTaskStatus;
  label: string;
  meta: string;
};

const habitStore = useHabitStore();
const checkinStore = useCheckinStore();
const giftIcon = giftOutline;
const backIcon = chevronBackOutline;
const forwardIcon = chevronForwardOutline;
const calendarIcon = calendarOutline;
const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
const selectedDate = ref(toDateKey(new Date()));
const monthCursor = ref(getMonthStart(new Date()));

onIonViewWillEnter(() => {
  habitStore.loadHabits();
  checkinStore.loadCheckIns();
});

const todayKey = computed(() => toDateKey(new Date()));
const todayHabits = computed(() =>
  habitStore.habits.filter((habit) => shouldHabitBeActiveOnDate(habit, checkinStore.checkIns, todayKey.value)),
);
const todayHabitIds = computed(() => new Set(todayHabits.value.map((habit) => habit.id)));
const completedCount = computed(
  () =>
    checkinStore.checkIns.filter(
      (checkIn) => checkIn.date === todayKey.value && todayHabitIds.value.has(checkIn.habitId),
    ).length,
);
const totalFailures = computed(() =>
  habitProgressList.value.reduce((total, progress) => total + progress.totalFailures, 0),
);
const sevenDayTrend = computed(() => buildSevenDayTrend(habitStore.habits, checkinStore.checkIns));
const weeklyCompletionRate = computed(() => {
  const completed = sevenDayTrend.value.reduce((total, day) => total + day.completed, 0);
  const total = sevenDayTrend.value.reduce((sum, day) => sum + day.total, 0);
  return calculateCompletionRate(completed, total);
});
const pointSummary = computed(() => buildPointSummary(habitStore.habits, checkinStore.checkIns, todayKey.value));
const habitProgressList = computed(() =>
  habitStore.habits.map((habit) => ({
    habit,
    ...buildHabitStats(habit, checkinStore.checkIns),
  })),
);
const monthTitle = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
  }).format(monthCursor.value),
);
const calendarDays = computed(() => {
  const monthStart = getMonthStart(monthCursor.value);
  const leadingDays = (monthStart.getDay() + 6) % 7;
  const gridStart = addDays(monthStart, -leadingDays);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    const dateKey = toDateKey(date);
    const metrics = getDayMetrics(dateKey);

    return {
      date: dateKey,
      inMonth: date.getMonth() === monthStart.getMonth(),
      ...metrics,
    };
  });
});
const monthDays = computed(() => calendarDays.value.filter((day) => day.inMonth));
const calendarSummary = computed(() => {
  const daysWithTasks = monthDays.value.filter((day) => day.total > 0);
  const doneDays = daysWithTasks.filter((day) => day.status === 'done').length;
  const missedDays = daysWithTasks.filter((day) => day.status === 'missed' || day.status === 'partial').length;

  if (daysWithTasks.length === 0) {
    return '这个月还没有安排过任务。';
  }

  return `${daysWithTasks.length} 天有任务，${doneDays} 天全完成，${missedDays} 天留下缺口。`;
});
const selectedDayMetrics = computed(() => getDayMetrics(selectedDate.value));
const selectedDayTitle = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(parseDateKey(selectedDate.value)),
);
const selectedDaySummary = computed(() => {
  if (selectedDayMetrics.value.total === 0) {
    return '没有任务安排，可以休息，也可以回任务页补一项。';
  }

  if (selectedDayMetrics.value.status === 'done') {
    return '这一天所有计划任务都完成了。';
  }

  if (selectedDate.value > todayKey.value) {
    return '这是未来计划，只展示当天预计会出现的任务。';
  }

  return `完成 ${selectedDayMetrics.value.completed} / ${selectedDayMetrics.value.total}，剩下的缺口在下面。`;
});
const selectedDayTasks = computed<DayTask[]>(() => {
  const checkedHabitIds = new Set(
    checkinStore.checkIns.filter((checkIn) => checkIn.date === selectedDate.value).map((checkIn) => checkIn.habitId),
  );
  const isFuture = selectedDate.value > todayKey.value;
  const isToday = selectedDate.value === todayKey.value;

  return habitStore.habits
    .filter((habit) => shouldHabitBeActiveOnDate(habit, checkinStore.checkIns, selectedDate.value))
    .map((habit) => {
      const checked = checkedHabitIds.has(habit.id);
      const status: DayTaskStatus = checked ? 'done' : isFuture ? 'planned' : isToday ? 'pending' : 'missed';

      return {
        habit,
        status,
        label: getTaskStatusLabel(status),
        meta: `${getHabitScheduleText(habit)} · ${formatRepeatRule(habit.repeatRule)}`,
      };
    });
});

const selectDay = (date: string) => {
  selectedDate.value = date;

  const nextMonth = getMonthStart(parseDateKey(date));
  if (nextMonth.getTime() !== monthCursor.value.getTime()) {
    monthCursor.value = nextMonth;
  }
};
const moveMonth = (offset: number) => {
  const nextDate = new Date(monthCursor.value);
  nextDate.setMonth(nextDate.getMonth() + offset);
  monthCursor.value = getMonthStart(nextDate);
};
const goToCurrentMonth = () => {
  const today = new Date();
  monthCursor.value = getMonthStart(today);
  selectedDate.value = toDateKey(today);
};
const getCalendarDayLabel = (day: CalendarDay) =>
  `${day.date}，${getCalendarStatusText(day)}，完成 ${day.completed} / ${day.total}`;
const getCalendarStatusText = (day: CalendarDay) => {
  if (day.total === 0) {
    return '休息日';
  }

  if (day.status === 'done') {
    return '全部完成';
  }

  if (day.status === 'partial') {
    return '部分完成';
  }

  if (day.status === 'planned') {
    return '待执行';
  }

  if (day.status === 'active') {
    return '今天待完成';
  }

  return '未完成';
};
const getDayMetrics = (date: string): Omit<CalendarDay, 'date' | 'inMonth'> => {
  const activeHabits = habitStore.habits.filter((habit) => shouldHabitBeActiveOnDate(habit, checkinStore.checkIns, date));
  const activeHabitIds = new Set(activeHabits.map((habit) => habit.id));
  const completed = checkinStore.checkIns.filter(
    (checkIn) => checkIn.date === date && activeHabitIds.has(checkIn.habitId),
  ).length;
  const total = activeHabits.length;
  const completionRate = calculateCompletionRate(completed, total);
  const isFuture = date > todayKey.value;
  const isToday = date === todayKey.value;

  return {
    completed,
    total,
    completionRate,
    status: getDayStatus({ completed, total, isFuture, isToday }),
  };
};
const getDayStatus = ({
  completed,
  total,
  isFuture,
  isToday,
}: {
  completed: number;
  total: number;
  isFuture: boolean;
  isToday: boolean;
}): CalendarDayStatus => {
  if (total === 0) {
    return 'rest';
  }

  if (completed === total) {
    return 'done';
  }

  if (isFuture) {
    return 'planned';
  }

  if (completed > 0) {
    return 'partial';
  }

  return isToday ? 'active' : 'missed';
};
const getTaskStatusLabel = (status: DayTaskStatus) => {
  if (status === 'done') {
    return '完成';
  }

  if (status === 'planned') {
    return '计划';
  }

  if (status === 'pending') {
    return '待完成';
  }

  return '未完成';
};
const getHabitScheduleText = (habit: { reminderEnabled: boolean; reminderTime: string }) =>
  habit.reminderEnabled ? `${habit.reminderTime} 提醒` : '全天完成';
function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
</script>
