<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle>今日打卡</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>
      <IonHeader collapse="condense">
        <IonToolbar>
          <IonTitle size="large">今日打卡</IonTitle>
        </IonToolbar>
      </IonHeader>

      <main class="page-stack">
        <section class="hero-panel today-command-panel" :class="todayRiskLevel">
          <div class="today-command-header">
            <div>
              <p class="eyebrow">{{ todayLabel }}</p>
              <h1>{{ commandTitle }}</h1>
            </div>
            <div class="command-score">
              <span>完成率</span>
              <strong>{{ completionRate }}%</strong>
            </div>
          </div>
          <p>{{ commandMessage }}</p>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" :style="{ width: `${completionRate}%` }"></div>
          </div>
          <div class="command-metrics">
            <div>
              <span>待处理</span>
              <strong>{{ unfinishedCount }}</strong>
            </div>
            <div>
              <span>已提醒</span>
              <strong>{{ activeReminderCount }}</strong>
            </div>
            <div>
              <span>已推迟</span>
              <strong>{{ snoozedReminderCount }}</strong>
            </div>
          </div>
        </section>

        <section v-if="priorityHabit" class="priority-strip" :class="todayRiskLevel">
          <div>
            <span>{{ priorityLabel }}</span>
            <strong>{{ priorityHabit.name }}</strong>
            <p>{{ priorityMessage }}</p>
          </div>
          <IonButton size="small" @click="openReminderAction(priorityHabit.id)">处理</IonButton>
        </section>

        <section class="theme-feedback compact-feedback" :class="appStore.currentTheme.feedbackStyle">
          <div>
            <span>{{ appStore.currentTheme.name }}</span>
            <strong>{{ themeFeedback.title }}</strong>
            <p>{{ themeFeedback.message }}</p>
          </div>
          <div class="theme-feedback-mark" aria-hidden="true">{{ themeFeedback.mark }}</div>
        </section>

        <section v-if="completionFeedback" class="completion-reward-panel" :class="{ milestone: completionFeedback.milestoneUnlocked }">
          <div class="completion-reward-header">
            <div>
              <p class="eyebrow">{{ completionFeedback.habitName }}</p>
              <h2>{{ completionFeedback.title }}</h2>
            </div>
            <IonButton fill="clear" size="small" @click="completionFeedback = undefined">收起</IonButton>
          </div>
          <p>{{ completionFeedback.message }}</p>
          <div class="completion-reward-grid">
            <div>
              <span>本次获得</span>
              <strong>+{{ completionFeedback.pointsGained }}</strong>
            </div>
            <div>
              <span>当前连续</span>
              <strong>{{ completionFeedback.currentStreak }} 天</strong>
            </div>
            <div>
              <span>总积分</span>
              <strong>{{ completionFeedback.totalPoints }}</strong>
            </div>
            <div>
              <span>下个目标</span>
              <strong>{{ completionFeedback.nextMilestoneLabel }}</strong>
            </div>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>今日任务</h2>
            <IonButton size="small" router-link="/tasks/new">新增</IonButton>
          </div>

          <div v-if="habitStore.isLoading" class="empty-state">正在读取任务...</div>
          <div v-else-if="habitStore.habits.length === 0" class="empty-state empty-guide">
            <strong>还没有打卡任务</strong>
            <p>先添加一件你真正想坚持的小事，比如阅读、睡前整理或轻运动。</p>
            <IonButton size="small" router-link="/tasks/new">添加第一个任务</IonButton>
          </div>
          <div v-else-if="todayHabits.length === 0" class="empty-state">
            今天没有需要执行的任务，可以休息一下。
          </div>

          <IonList v-else lines="none" class="task-list execution-list">
            <IonItem v-for="habit in todayHabits" :key="habit.id" class="task-item execution-item" :class="getTaskStateClass(habit.id)">
              <IonLabel>
                <div class="task-title-row">
                  <h3>{{ habit.name }}</h3>
                </div>
                <p>{{ habit.reminderTime }} 提醒 · {{ formatRepeatRule(habit.repeatRule) }}</p>
                <p v-if="getReminderStatusText(habit.id)" class="habit-prompt urgent">{{ getReminderStatusText(habit.id) }}</p>
                <p v-if="getHabitPrompt(habit.id)" class="habit-prompt">{{ getHabitPrompt(habit.id) }}</p>
                <p v-if="getDowngradePrompt(habit.id)" class="habit-prompt muted">{{ getDowngradePrompt(habit.id) }}</p>
              </IonLabel>
              <div class="task-actions">
                <span v-if="!checkinStore.isHabitCheckedToday(habit.id)" class="task-state-pill">
                  {{ getTaskStateLabel(habit.id) }}
                </span>
                <IonButton
                  class="task-check-button"
                  :fill="checkinStore.isHabitCheckedToday(habit.id) ? 'solid' : 'outline'"
                  size="small"
                  :disabled="checkinStore.isHabitCheckedToday(habit.id)"
                  @click="toggleCheckIn(habit.id)"
                >
                  {{ checkinStore.isHabitCheckedToday(habit.id) ? '已完成' : '打卡' }}
                </IonButton>
                <IonButton
                  v-if="getReminderStatusText(habit.id)"
                  fill="clear"
                  size="small"
                  @click="openReminderAction(habit.id)"
                >
                  处理
                </IonButton>
              </div>
            </IonItem>
          </IonList>
        </section>
      </main>
    </IonContent>

    <IonAlert
      :is-open="rewardAlert.isOpen"
      header="奖励已解锁"
      :message="rewardAlert.message"
      :buttons="rewardAlertButtons"
      @didDismiss="rewardAlert.isOpen = false"
    />

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
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToast,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { computed, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { ReminderAction } from '@/types/reminderAction';
import { useHabitStore } from '@/stores/habitStore';
import { useCheckinStore } from '@/stores/checkinStore';
import { buildHabitStats, calculateCompletionRate } from '@/modules/stats/statsRules';
import { findTriggeredPunishment } from '@/modules/punishments/punishmentRules';
import { findNewlyUnlockedReward, findNextRewardMilestone, findUnlockedReward } from '@/modules/rewards/rewardRules';
import { renderTonePrompt } from '@/modules/tones/toneCopy';
import { useAppStore } from '@/stores/appStore';
import { buildDowngradeSuggestion } from '@/modules/recovery/downgradeRules';
import { formatRepeatRule, shouldHabitBeActiveOnDate } from '@/modules/habits/repeatRules';
import { buildReminderActionSummary, reminderActionService } from '@/modules/reminderActions/reminderActionService';
import { cancelFollowupReminder } from '@/modules/reminders/reminderService';
import { buildPointSummary, getMilestoneBonusForStreak, pointsPerCheckIn } from '@/modules/points/pointRules';
import { toDateKey } from '@/utils/date';

type CompletionFeedback = {
  habitName: string;
  title: string;
  message: string;
  pointsGained: number;
  currentStreak: number;
  totalPoints: number;
  nextMilestoneLabel: string;
  milestoneUnlocked: boolean;
};

const habitStore = useHabitStore();
const checkinStore = useCheckinStore();
const appStore = useAppStore();
const router = useRouter();
const reminderActions = ref<ReminderAction[]>([]);
const now = ref(new Date());
let timer: ReturnType<typeof window.setInterval> | undefined;
const toast = reactive({
  isOpen: false,
  message: '',
});
const rewardAlert = reactive({
  isOpen: false,
  message: '',
});
const completionFeedback = ref<CompletionFeedback>();
const rewardAlertButtons = ['知道了'];

onIonViewWillEnter(async () => {
  appStore.loadSettings();
  await habitStore.loadHabits();
  await checkinStore.loadCheckIns();
  await refreshReminderActions();

  window.clearInterval(timer);
  timer = window.setInterval(() => {
    now.value = new Date();
    void refreshReminderActions();
  }, 30000);
});

onUnmounted(() => {
  window.clearInterval(timer);
});

const todayLabel = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date()),
);

const todayKey = computed(() => toDateKey(new Date()));
const scheduledTodayHabits = computed(() =>
  habitStore.habits.filter((habit) => shouldHabitBeActiveOnDate(habit, checkinStore.checkIns, todayKey.value)),
);
const todayHabits = computed(() =>
  scheduledTodayHabits.value
    .map((habit, index) => ({ habit, index }))
    .sort((a, b) => compareTodayHabits(a.habit.id, b.habit.id, a.index, b.index))
    .map((item) => item.habit),
);
const todayHabitIds = computed(() => new Set(scheduledTodayHabits.value.map((habit) => habit.id)));
const totalCount = computed(() => todayHabits.value.length);
const completedCount = computed(
  () =>
    checkinStore.checkIns.filter(
      (checkIn) => checkIn.date === todayKey.value && todayHabitIds.value.has(checkIn.habitId),
    ).length,
);
const unfinishedCount = computed(() => Math.max(0, totalCount.value - completedCount.value));
const completionRate = computed(() => calculateCompletionRate(completedCount.value, totalCount.value));
const activeReminderActions = computed(() =>
  reminderActions.value.filter(
    (action) =>
      action.date === todayKey.value &&
      action.status !== 'completed' &&
      !checkinStore.checkIns.some((checkIn) => checkIn.habitId === action.habitId && checkIn.date === todayKey.value),
  ),
);
const activeReminderCount = computed(() => activeReminderActions.value.length);
const snoozedReminderCount = computed(
  () => activeReminderActions.value.filter((action) => buildReminderActionSummary(action, now.value).isSnoozed).length,
);
const urgentReminderCount = computed(
  () =>
    activeReminderActions.value.filter((action) => {
      const summary = buildReminderActionSummary(action, now.value);
      return !summary.isSnoozed && action.status !== 'abandoned';
    }).length,
);
const todayRiskLevel = computed(() => {
  if (unfinishedCount.value === 0 && totalCount.value > 0) {
    return 'done';
  }

  if (urgentReminderCount.value > 0) {
    return 'hot';
  }

  if (snoozedReminderCount.value > 0 || unfinishedCount.value > 0) {
    return 'warm';
  }

  return 'calm';
});
const commandTitle = computed(() => {
  if (totalCount.value === 0) {
    return '今天没有任务';
  }

  if (unfinishedCount.value === 0) {
    return '今日闭环';
  }

  if (urgentReminderCount.value > 0) {
    return '先处理红灯';
  }

  return '把下一项拿下';
});
const commandMessage = computed(() => {
  if (totalCount.value === 0) {
    return '先给系统安排一个真正要坚持的动作。';
  }

  if (unfinishedCount.value === 0) {
    return '今日任务全部完成，别再给自己加戏。';
  }

  if (urgentReminderCount.value > 0) {
    return `有 ${urgentReminderCount.value} 个提醒已经到点，先处理最刺眼的那一个。`;
  }

  return `今日完成 ${completedCount.value} / ${totalCount.value}，剩下 ${unfinishedCount.value} 项。`;
});
const priorityAction = computed(() =>
  [...activeReminderActions.value].sort((a, b) => {
    const aSummary = buildReminderActionSummary(a, now.value);
    const bSummary = buildReminderActionSummary(b, now.value);

    if (a.status === 'abandoned' && b.status !== 'abandoned') {
      return 1;
    }

    if (b.status === 'abandoned' && a.status !== 'abandoned') {
      return -1;
    }

    if (aSummary.isSnoozed !== bSummary.isSnoozed) {
      return aSummary.isSnoozed ? 1 : -1;
    }

    return bSummary.overdueMinutes - aSummary.overdueMinutes;
  })[0],
);
const priorityHabit = computed(() => {
  if (priorityAction.value) {
    return habitStore.getHabitById(priorityAction.value.habitId);
  }

  return todayHabits.value.find((habit) => !checkinStore.isHabitCheckedToday(habit.id));
});
const priorityLabel = computed(() => {
  if (!priorityAction.value) {
    return '下一步';
  }

  if (priorityAction.value.status === 'abandoned') {
    return '已放弃';
  }

  if (buildReminderActionSummary(priorityAction.value, now.value).isSnoozed) {
    return '已推迟';
  }

  return '最高优先级';
});
const priorityMessage = computed(() => {
  if (!priorityAction.value) {
    return '还没到提醒时间，但可以提前把它处理掉。';
  }

  return getReminderStatusText(priorityAction.value.habitId) || '提醒已到，别只停在看见。';
});
const themeFeedback = computed(() => {
  const style = appStore.currentTheme.feedbackStyle;

  if (style === 'achievement') {
    return {
      mark: `${completionRate.value}%`,
      title: completedCount.value > 0 ? '连击能量已充入' : '今日副本待开启',
      message: totalCount.value === 0 ? '今天没有任务，先别让系统闲着太久。' : '完成一项就点亮一格，别让进度条一直趴着。',
    };
  }

  if (style === 'discipline') {
    return {
      mark: `${unfinishedCount.value}`,
      title: unfinishedCount.value === 0 ? '今日风险清零' : '仍有任务待处理',
      message: unfinishedCount.value === 0 ? '执行完成，保持当前纪律。' : '先选一个最低版本完成，别让失败次数继续滚动。',
    };
  }

  if (style === 'schemer') {
    return {
      mark: `${unfinishedCount.value}`,
      title: unfinishedCount.value === 0 ? '嗯，今天没让我失望' : '还剩一点，别装看不见',
      message: unfinishedCount.value === 0 ? '记录很漂亮，我会记住你这次听话。' : '先完成最小版本也行，但别想把缺口偷偷留到明天。',
    };
  }

  if (style === 'challenge') {
    return {
      mark: `${completionRate.value}%`,
      title: completedCount.value > 0 ? '勉强算你有点行动力' : '不会今天还没开始吧',
      message: totalCount.value === 0 ? '今天没任务，那就先放你一马。' : '先打掉一个任务，别让清单继续嘲笑你。',
    };
  }

  if (style === 'command') {
    return {
      mark: `${unfinishedCount.value}`,
      title: unfinishedCount.value === 0 ? '今日指令完成，表现合格' : '指令尚未完成',
      message: unfinishedCount.value === 0 ? '保持记录，明天继续听话执行。' : '选择一个任务，执行最低版本，完成前不许假装自由。',
    };
  }

  if (style === 'data') {
    return {
      mark: `${completionRate.value}%`,
      title: `完成率 ${completionRate.value}%`,
      message: totalCount.value === 0 ? '今日计划任务数为 0。' : `已完成 ${completedCount.value} 项，未完成 ${unfinishedCount.value} 项。`,
    };
  }

  return {
    mark: `${completedCount.value}/${totalCount.value}`,
    title: completedCount.value === totalCount.value && totalCount.value > 0 ? '今天的节奏很稳' : '按自己的节奏来',
    message: totalCount.value === 0 ? '今天没有需要执行的任务。' : '不用把一天塞满，但该做的这一格别空着。',
  };
});
const habitStatsMap = computed(() =>
  new Map(todayHabits.value.map((habit) => [habit.id, buildHabitStats(habit, checkinStore.checkIns)])),
);
const reminderActionMap = computed(() =>
  new Map(reminderActions.value.filter((action) => action.date === todayKey.value).map((action) => [action.habitId, action])),
);

const refreshReminderActions = async () => {
  await Promise.all(
    scheduledTodayHabits.value
      .filter((habit) => habit.reminderEnabled && !checkinStore.isHabitCheckedToday(habit.id))
      .map((habit) => reminderActionService.ensureAction(habit, todayKey.value, now.value)),
  );
  reminderActions.value = await reminderActionService.listActions();
};

const toggleCheckIn = async (habitId: string) => {
  if (checkinStore.isHabitCheckedToday(habitId)) {
    return;
  }

  const habit = habitStore.getHabitById(habitId);
  const previousStats = habit ? buildHabitStats(habit, checkinStore.checkIns) : undefined;

  await checkinStore.checkInHabit(habitId);
  await reminderActionService.markCompleted(habitId, todayKey.value);
  await cancelFollowupReminder(habitId, todayKey.value);
  await refreshReminderActions();

  const stats = buildHabitStatsById(habitId);
  const reward = stats && previousStats ? findNewlyUnlockedReward(stats.currentStreak, previousStats.longestStreak) : undefined;
  const pointSummary = buildPointSummary(habitStore.habits, checkinStore.checkIns, todayKey.value);

  if (habit && stats) {
    completionFeedback.value = buildCompletionFeedback({
      habitName: habit.name,
      currentStreak: stats.currentStreak,
      totalPoints: pointSummary.totalPoints,
      rewardMessage: reward?.message,
      rewardStreakDays: reward?.streakDays,
    });
  }

  if (reward && completionFeedback.value) {
    rewardAlert.message = `${completionFeedback.value.habitName} 连续 ${completionFeedback.value.currentStreak} 天。\n${completionFeedback.value.message}\n本次 +${completionFeedback.value.pointsGained} 分，总积分 ${completionFeedback.value.totalPoints}。`;
    rewardAlert.isOpen = true;
  }
};

const getHabitPrompt = (habitId: string) => {
  const stats = buildHabitStatsById(habitId);

  if (!stats) {
    return '';
  }

  if (checkinStore.isHabitCheckedToday(habitId)) {
    const reward = findUnlockedReward(stats.currentStreak);
    return renderTonePrompt(appStore.toneId, 'reward', reward?.message ?? '');
  }

  const punishment = findTriggeredPunishment(stats.totalFailures);
  return renderTonePrompt(appStore.toneId, 'punishment', punishment?.message ?? '');
};

const getDowngradePrompt = (habitId: string) => {
  if (checkinStore.isHabitCheckedToday(habitId)) {
    return '';
  }

  const habit = habitStore.getHabitById(habitId);
  const stats = buildHabitStatsById(habitId);

  if (!habit || !stats) {
    return '';
  }

  return buildDowngradeSuggestion(habit, stats.totalFailures, appStore.toneId)?.action ?? '';
};

const getReminderStatusText = (habitId: string) => {
  if (checkinStore.isHabitCheckedToday(habitId)) {
    return '';
  }

  const action = reminderActionMap.value.get(habitId);

  if (!action || action.status === 'completed') {
    return '';
  }

  const summary = buildReminderActionSummary(action, now.value);

  if (action.status === 'abandoned') {
    return '今天已放弃，原因已记录';
  }

  if (summary.isSnoozed && action.snoozedUntil) {
    return `已推迟到 ${formatClock(action.snoozedUntil)}`;
  }

  if (action.status === 'started') {
    return `已开始，提醒后已过 ${formatDuration(summary.overdueMinutes)}`;
  }

  return `提醒后已过 ${formatDuration(summary.overdueMinutes)}`;
};

const getTaskStateClass = (habitId: string) => {
  if (checkinStore.isHabitCheckedToday(habitId)) {
    return 'is-done';
  }

  const action = reminderActionMap.value.get(habitId);

  if (!action) {
    return 'is-waiting';
  }

  const summary = buildReminderActionSummary(action, now.value);

  if (action.status === 'abandoned') {
    return 'is-abandoned';
  }

  if (summary.isSnoozed) {
    return 'is-snoozed';
  }

  if (action.status === 'started') {
    return 'is-started';
  }

  return 'is-urgent';
};

const getTaskStateLabel = (habitId: string) => {
  if (checkinStore.isHabitCheckedToday(habitId)) {
    return '完成';
  }

  const action = reminderActionMap.value.get(habitId);

  if (!action) {
    return '待提醒';
  }

  if (action.status === 'abandoned') {
    return '放弃';
  }

  if (buildReminderActionSummary(action, now.value).isSnoozed) {
    return '推迟';
  }

  if (action.status === 'started') {
    return '已开始';
  }

  return '到点';
};

const compareTodayHabits = (firstHabitId: string, secondHabitId: string, firstIndex: number, secondIndex: number) => {
  const firstPriority = getTodaySortPriority(firstHabitId);
  const secondPriority = getTodaySortPriority(secondHabitId);

  if (firstPriority !== secondPriority) {
    return firstPriority - secondPriority;
  }

  const firstAction = reminderActionMap.value.get(firstHabitId);
  const secondAction = reminderActionMap.value.get(secondHabitId);

  if (firstAction && secondAction) {
    const firstSummary = buildReminderActionSummary(firstAction, now.value);
    const secondSummary = buildReminderActionSummary(secondAction, now.value);

    if (firstSummary.overdueMinutes !== secondSummary.overdueMinutes) {
      return secondSummary.overdueMinutes - firstSummary.overdueMinutes;
    }
  }

  const firstHabit = habitStore.getHabitById(firstHabitId);
  const secondHabit = habitStore.getHabitById(secondHabitId);
  const firstReminderTime = firstHabit ? getReminderTimeValue(firstHabit.reminderTime) : 0;
  const secondReminderTime = secondHabit ? getReminderTimeValue(secondHabit.reminderTime) : 0;

  if (firstReminderTime !== secondReminderTime) {
    return firstReminderTime - secondReminderTime;
  }

  return firstIndex - secondIndex;
};

const getTodaySortPriority = (habitId: string) => {
  if (checkinStore.isHabitCheckedToday(habitId)) {
    return 5;
  }

  const action = reminderActionMap.value.get(habitId);

  if (!action) {
    return 3;
  }

  const summary = buildReminderActionSummary(action, now.value);

  if (action.status === 'abandoned') {
    return 4;
  }

  if (summary.isSnoozed) {
    return 2;
  }

  return action.status === 'started' ? 0 : 1;
};

const getReminderTimeValue = (reminderTime: string) => {
  const [hour = 0, minute = 0] = reminderTime.split(':').map(Number);
  return hour * 60 + minute;
};

const buildCompletionFeedback = ({
  habitName,
  currentStreak,
  totalPoints,
  rewardMessage,
  rewardStreakDays,
}: {
  habitName: string;
  currentStreak: number;
  totalPoints: number;
  rewardMessage?: string;
  rewardStreakDays?: number;
}): CompletionFeedback => {
  const nextReward = findNextRewardMilestone(currentStreak);
  const milestoneBonus = rewardStreakDays ? getMilestoneBonusForStreak(rewardStreakDays) : 0;
  const milestoneUnlocked = Boolean(rewardMessage);
  const message = milestoneUnlocked
    ? renderTonePrompt(appStore.toneId, 'reward', rewardMessage ?? '')
    : `${habitName} 已完成，今日记录已锁定。本次 +${pointsPerCheckIn} 分，继续把连续天数往上推。`;

  return {
    habitName,
    title: milestoneUnlocked ? '里程碑奖励解锁' : '打卡完成',
    message,
    pointsGained: pointsPerCheckIn + milestoneBonus,
    currentStreak,
    totalPoints,
    nextMilestoneLabel: nextReward ? `还差 ${nextReward.streakDays - currentStreak} 天` : '最高里程碑',
    milestoneUnlocked,
  };
};

const openReminderAction = (habitId: string) => {
  void router.push({
    path: `/reminders/${habitId}`,
    query: { date: todayKey.value },
  });
};

const buildHabitStatsById = (habitId: string) => habitStatsMap.value.get(habitId);

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
