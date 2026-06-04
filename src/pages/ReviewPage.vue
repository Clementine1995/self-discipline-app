<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle>每日复盘</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>
      <main class="page-stack with-top-space">
        <section class="hero-panel">
          <p class="eyebrow">{{ reviewDateLabel }}</p>
          <h1>AI 复盘占位版</h1>
          <p>{{ review.summary }}</p>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" :style="{ width: `${review.completionRate}%` }"></div>
          </div>
        </section>

        <section class="stats-grid">
          <div class="metric-tile">
            <span>今日完成</span>
            <strong>{{ review.completedCount }}</strong>
          </div>
          <div class="metric-tile">
            <span>未完成</span>
            <strong>{{ review.unfinishedCount }}</strong>
          </div>
          <div class="metric-tile">
            <span>完成率</span>
            <strong>{{ review.completionRate }}%</strong>
          </div>
          <div class="metric-tile">
            <span>风险项</span>
            <strong>{{ review.riskItems.length }}</strong>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>今日完成情况</h2>
            <p>按当前本地打卡记录生成，后续可替换为真实 AI 总结。</p>
          </div>

          <div v-if="review.totalHabits === 0" class="empty-state">还没有任务，先新增一个习惯。</div>
          <div v-else class="review-list">
            <div v-for="habit in review.completedHabits" :key="habit.habitId" class="review-row positive">
              <IonIcon :icon="checkIcon" aria-hidden="true" />
              <div>
                <strong>{{ habit.habitName }}</strong>
                <span>连续 {{ habit.currentStreak }} 天</span>
              </div>
            </div>

            <div v-for="habit in review.unfinishedHabits" :key="habit.habitId" class="review-row">
              <IonIcon :icon="pendingIcon" aria-hidden="true" />
              <div>
                <strong>{{ habit.habitName }}</strong>
                <span>失败 {{ habit.totalFailures }} 次</span>
              </div>
            </div>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>失败风险</h2>
            <p>根据未完成任务、失败次数和任务阈值预估。</p>
          </div>

          <div v-if="review.riskItems.length === 0" class="empty-state">今天没有明显失败风险。</div>
          <div v-else class="review-list">
            <div v-for="item in review.riskItems" :key="item.habitId" class="risk-card" :class="item.level">
              <div class="risk-card-title">
                <strong>{{ item.habitName }}</strong>
                <span>{{ riskLabelMap[item.level] }}</span>
              </div>
              <p>{{ item.reason }}</p>
            </div>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>明天建议</h2>
            <p>先给出可执行的本地规则建议。</p>
          </div>

          <ol class="suggestion-list">
            <li v-for="suggestion in review.tomorrowSuggestions" :key="suggestion">{{ suggestion }}</li>
          </ol>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>降级建议汇总</h2>
            <p>复用现有失败降级模块，页面只负责展示。</p>
          </div>

          <div v-if="review.downgradeSuggestions.length === 0" class="empty-state">暂时不需要降级建议。</div>
          <div v-else class="review-list">
            <div v-for="item in review.downgradeSuggestions" :key="item.habitId" class="downgrade-card">
              <strong>{{ item.habitName }} · {{ item.suggestion.title }}</strong>
              <p>{{ item.suggestion.action }}</p>
              <small>{{ item.suggestion.reason }}</small>
            </div>
          </div>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, onIonViewWillEnter } from '@ionic/vue';
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { buildLocalAiDailyReview, type AiReviewRiskItem } from '@/modules/ai/aiReviewService';
import { useAppStore } from '@/stores/appStore';
import { useCheckinStore } from '@/stores/checkinStore';
import { useHabitStore } from '@/stores/habitStore';

const appStore = useAppStore();
const habitStore = useHabitStore();
const checkinStore = useCheckinStore();
const checkIcon = checkmarkCircleOutline;
const pendingIcon = alertCircleOutline;
const riskLabelMap: Record<AiReviewRiskItem['level'], string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

onIonViewWillEnter(() => {
  appStore.loadSettings();
  habitStore.loadHabits();
  checkinStore.loadCheckIns();
});

const review = computed(() =>
  buildLocalAiDailyReview({
    habits: habitStore.habits,
    checkIns: checkinStore.checkIns,
    toneId: appStore.toneId,
  }),
);

const reviewDateLabel = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(`${review.value.date}T00:00:00`)),
);
</script>
