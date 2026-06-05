<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/tasks" text="" />
        </IonButtons>
        <IonTitle>{{ isEditing ? '编辑任务' : '新建任务' }}</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>
      <main class="page-stack with-top-space">
        <section class="section-block">
          <IonList lines="full" class="form-list">
            <IonItem>
              <IonInput v-model="draft.name" label="名称" label-placement="stacked" placeholder="例如：看书" />
            </IonItem>
            <IonItem>
              <IonInput v-model="draft.reminderTime" label="提醒时间" label-placement="stacked" type="time" />
            </IonItem>
            <IonItem>
              <IonToggle v-model="draft.reminderEnabled" justify="space-between">启用提醒</IonToggle>
            </IonItem>
            <IonItem>
              <IonLabel>
                <h3>重复规则</h3>
                <p>{{ repeatRuleLabel }}</p>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonInput
                v-model.number="draft.failureThreshold"
                label="失败阈值"
                label-placement="stacked"
                min="1"
                type="number"
              />
            </IonItem>
            <IonItem>
              <IonTextarea
                v-model="draft.rewardText"
                label="奖励说明"
                label-placement="stacked"
                placeholder="连续完成后的奖励提示"
              />
            </IonItem>
            <IonItem>
              <IonTextarea
                v-model="draft.punishmentText"
                label="惩罚说明"
                label-placement="stacked"
                placeholder="失败达到阈值后的惩罚提示"
              />
            </IonItem>
          </IonList>

          <div class="option-stack form-option-stack">
            <button
              v-for="option in repeatRuleOptions"
              :key="option.type"
              class="option-row option-row-single"
              :class="{ selected: draft.repeatRule.type === option.type }"
              type="button"
              @click="setRepeatRule(option.type)"
            >
              <span>
                <strong>{{ option.label }}</strong>
                <small>{{ option.description }}</small>
              </span>
            </button>
          </div>

          <div v-if="draft.repeatRule.type === 'weekly'" class="weekday-grid">
            <button
              v-for="weekday in weekdayOptions"
              :key="weekday.value"
              class="weekday-chip"
              :class="{ selected: draft.repeatRule.daysOfWeek.includes(weekday.value) }"
              type="button"
              @click="toggleWeekday(weekday.value)"
            >
              {{ weekday.label }}
            </button>
          </div>

          <div v-if="errorMessage" class="form-error">{{ errorMessage }}</div>
          <div v-if="reminderMessage" class="form-note">{{ reminderMessage }}</div>

          <IonButton expand="block" class="primary-action" :disabled="isSaving" @click="saveHabit">
            {{ isSaving ? '保存中...' : '保存任务' }}
          </IonButton>

          <IonButton
            v-if="isEditing"
            expand="block"
            fill="clear"
            color="danger"
            class="secondary-action"
            :disabled="isSaving"
            @click="showDeleteConfirm = true"
          >
            删除任务
          </IonButton>
        </section>
      </main>
    </IonContent>

    <IonAlert
      :is-open="showDeleteConfirm"
      header="删除这个任务？"
      message="删除后，这个任务和对应的打卡记录都会从本地移除。"
      :buttons="deleteAlertButtons"
      @didDismiss="showDeleteConfirm = false"
    />
  </IonPage>
</template>

<script setup lang="ts">
import {
  IonAlert,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createEmptyHabitDraft, toHabitDraft, validateHabitDraft } from '@/modules/habits/habitService';
import { formatRepeatRule, weekdayOptions } from '@/modules/habits/repeatRules';
import { useHabitStore } from '@/stores/habitStore';
import type { RepeatRule, Weekday } from '@/types/habit';

const route = useRoute();
const router = useRouter();
const habitStore = useHabitStore();
const isEditing = computed(() => Boolean(route.params.id));
const habitId = computed(() => String(route.params.id || ''));
const draft = reactive(createEmptyHabitDraft());
const errorMessage = ref('');
const reminderMessage = ref('');
const isSaving = ref(false);
const showDeleteConfirm = ref(false);
const deleteAlertButtons = [
  {
    text: '取消',
    role: 'cancel',
  },
  {
    text: '删除',
    role: 'destructive',
    handler: () => {
      void deleteHabit();
    },
  },
];
const repeatRuleOptions: { type: RepeatRule['type']; label: string; description: string }[] = [
  { type: 'daily', label: '每天', description: '每天都出现在今日任务里。' },
  { type: 'weekdays', label: '工作日', description: '周一到周五执行。' },
  { type: 'weekends', label: '周末', description: '周六和周日执行。' },
  { type: 'weekly', label: '每周几', description: '自己选择一周中的执行日。' },
];

onIonViewWillEnter(async () => {
  errorMessage.value = '';
  reminderMessage.value = '';
  await habitStore.loadHabits();

  if (!isEditing.value) {
    Object.assign(draft, createEmptyHabitDraft());
    return;
  }

  const habit = habitStore.getHabitById(habitId.value);

  if (habit) {
    Object.assign(draft, toHabitDraft(habit));
  }
});

const saveHabit = async () => {
  const errors = validateHabitDraft(draft);

  if (errors.length > 0) {
    errorMessage.value = errors[0];
    return;
  }

  isSaving.value = true;
  try {
    if (isEditing.value) {
      await habitStore.updateHabit(habitId.value, draft);
    } else {
      await habitStore.createHabit(draft);
    }

    router.replace('/tasks');
  } finally {
    reminderMessage.value = habitStore.reminderMessage;
    isSaving.value = false;
  }
};

const repeatRuleLabel = computed(() => formatRepeatRule(draft.repeatRule));

const setRepeatRule = (type: RepeatRule['type']) => {
  if (type === 'weekly') {
    draft.repeatRule = {
      type,
      daysOfWeek: draft.repeatRule.type === 'weekly' ? draft.repeatRule.daysOfWeek : [1],
    };
    return;
  }

  draft.repeatRule = { type };
};

const toggleWeekday = (weekday: Weekday) => {
  if (draft.repeatRule.type !== 'weekly') {
    return;
  }

  const hasWeekday = draft.repeatRule.daysOfWeek.includes(weekday);

  if (hasWeekday && draft.repeatRule.daysOfWeek.length === 1) {
    return;
  }

  draft.repeatRule = {
    type: 'weekly',
    daysOfWeek: hasWeekday
      ? draft.repeatRule.daysOfWeek.filter((item) => item !== weekday)
      : [...draft.repeatRule.daysOfWeek, weekday].sort(),
  };
};

const deleteHabit = async () => {
  if (!isEditing.value) {
    return;
  }

  isSaving.value = true;
  try {
    await habitStore.deleteHabit(habitId.value);
    router.replace('/tasks');
  } finally {
    reminderMessage.value = habitStore.reminderMessage;
    isSaving.value = false;
  }
};
</script>
