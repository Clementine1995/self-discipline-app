<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/tasks" text="" />
        </IonButtons>
        <IonTitle>AI 任务计划</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>
      <main class="page-stack with-top-space">
        <section class="hero-panel">
          <p class="eyebrow">本地规则占位版</p>
          <h1>把长期目标拆成每日任务</h1>
          <p>{{ plan.summary }}</p>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>目标</h2>
            <p>先不接真实 AI，只用本地规则生成可创建的任务草案。</p>
          </div>

          <VanForm class="van-form-panel">
            <VanCellGroup inset>
              <VanField
                v-model="goal"
                label="长期目标"
                type="textarea"
                autosize
                clearable
                :maxlength="120"
                show-word-limit
                placeholder="例如：我想开始规律运动、减少熬夜、准备英语考试"
              />
            </VanCellGroup>
          </VanForm>

          <VanButton block type="primary" class="primary-action" @click="generatePlan">生成计划</VanButton>
        </section>

        <section v-if="hasGenerated" class="section-block">
          <div class="section-heading">
            <h2>建议任务</h2>
            <p>确认合适后再创建，之后可以在任务详情里继续编辑。</p>
          </div>

          <div class="review-list">
            <div v-for="suggestion in plan.suggestions" :key="suggestion.id" class="plan-card">
              <div class="plan-card-title">
                <strong>{{ suggestion.draft.name }}</strong>
                <span>{{ suggestion.draft.reminderTime }}</span>
              </div>
              <p>{{ suggestion.title }}：{{ suggestion.reason }}</p>
              <small>失败阈值 {{ suggestion.draft.failureThreshold }} 次 · {{ suggestion.draft.rewardText }}</small>
              <VanButton
                block
                type="primary"
                size="small"
                :disabled="isCreated(suggestion.draft.name) || isSaving"
                @click="createSuggestedHabit(suggestion)"
              >
                {{ isCreated(suggestion.draft.name) ? '已创建' : '创建这个任务' }}
              </VanButton>
            </div>
          </div>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { Button as VanButton, CellGroup as VanCellGroup, Field as VanField, Form as VanForm, showToast } from 'vant';
import { buildLocalAiHabitPlan, type AiHabitPlanSuggestion } from '@/modules/ai/aiHabitPlanService';
import { useAppStore } from '@/stores/appStore';
import { useHabitStore } from '@/stores/habitStore';

const appStore = useAppStore();
const habitStore = useHabitStore();
const goal = ref('');
const hasGenerated = ref(false);
const createdNames = ref<string[]>([]);
const isSaving = ref(false);

onIonViewWillEnter(() => {
  appStore.loadSettings();
  habitStore.loadHabits();
});

const plan = computed(() =>
  buildLocalAiHabitPlan({
    goal: goal.value,
    toneId: appStore.toneId,
  }),
);

const generatePlan = () => {
  hasGenerated.value = Boolean(goal.value.trim());

  if (!hasGenerated.value) {
    showToast('先写一个长期目标');
  }
};

const createSuggestedHabit = async (suggestion: AiHabitPlanSuggestion) => {
  isSaving.value = true;
  try {
    await habitStore.createHabit(suggestion.draft);
    createdNames.value = [...createdNames.value, suggestion.draft.name];
    showToast(`${suggestion.draft.name} 已创建`);
  } finally {
    isSaving.value = false;
  }
};

const isCreated = (name: string) =>
  createdNames.value.includes(name) || habitStore.habits.some((habit) => habit.name === name);
</script>
