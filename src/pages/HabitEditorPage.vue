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
      <main class="page-stack with-top-space habit-editor-page">
        <section class="editor-briefing-panel" :class="{ quiet: !draft.reminderEnabled }">
          <div class="editor-briefing-top">
            <div>
              <p class="eyebrow">{{ isEditing ? '编辑任务' : '新建任务' }}</p>
              <h1>{{ previewName }}</h1>
            </div>
            <span class="editor-mode-pill">{{ draft.reminderEnabled ? '定时提醒' : '全天完成' }}</span>
          </div>
          <p>{{ editorSubtitle }}</p>
          <div class="editor-preview-grid">
            <div>
              <IonIcon :icon="timeIcon" />
              <span>{{ scheduleSummary }}</span>
            </div>
            <div>
              <IonIcon :icon="repeatIcon" />
              <span>{{ repeatRuleLabel }}</span>
            </div>
            <div>
              <IonIcon :icon="thresholdIcon" />
              <span>{{ failureSummary }}</span>
            </div>
          </div>
        </section>

        <section class="section-block editor-section">
          <div class="section-heading">
            <h2>任务核心</h2>
            <p>先把任务说清楚，再决定它什么时候出现。</p>
          </div>

          <VanForm class="van-form-panel editor-form-panel">
            <VanCellGroup inset>
              <VanField v-model="draft.name" label="任务名称" placeholder="例如：看书 20 分钟" clearable />
              <VanField label="定时提醒">
                <template #input>
                  <VanSwitch v-model="draft.reminderEnabled" size="22px" />
                </template>
              </VanField>
              <VanField
                v-if="draft.reminderEnabled"
                :model-value="draft.reminderTime"
                label="提醒时间"
                readonly
                is-link
                placeholder="选择提醒时间"
                @click="openTimePicker"
              />
            </VanCellGroup>
          </VanForm>

          <div v-if="!draft.reminderEnabled" class="form-note inline-note">
            这个任务会出现在今日列表里，但不会弹本地通知。适合“当天内完成即可”的任务。
          </div>
        </section>

        <section class="section-block editor-section">
          <div class="section-heading">
            <h2>执行节奏</h2>
            <p>选择它出现的频率。越贴近日常，后面越不用反复改。</p>
          </div>

          <div class="repeat-card-grid">
            <button
              v-for="option in repeatRuleOptions"
              :key="option.type"
              class="repeat-card"
              :class="{ selected: draft.repeatRule.type === option.type }"
              type="button"
              @click="setRepeatRule(option.type)"
            >
              <strong>{{ option.label }}</strong>
              <small>{{ option.description }}</small>
            </button>
          </div>

          <div v-if="draft.repeatRule.type === 'weekly'" class="weekday-grid editor-weekday-grid">
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

          <div v-if="draft.repeatRule.type === 'weeklyTarget'" class="weekly-target-panel editor-weekly-target">
            <div>
              <strong>每周完成次数</strong>
              <small>适合运动、冥想、整理这类不固定星期几，但一周要达标的任务。</small>
            </div>
            <VanStepper v-model="draft.repeatRule.timesPerWeek" :min="1" :max="7" integer />
          </div>
        </section>

        <section class="section-block editor-section">
          <div class="section-heading">
            <h2>奖惩协议</h2>
            <p>给未来的自己留一份清楚的反馈规则。</p>
          </div>

          <VanForm class="van-form-panel editor-form-panel">
            <VanCellGroup inset>
              <VanField
                v-model.number="draft.failureThreshold"
                label="失败阈值"
                :min="1"
                type="number"
                placeholder="至少 1 次"
              />
              <VanField
                v-model="draft.rewardText"
                label="奖励说明"
                type="textarea"
                autosize
                :maxlength="120"
                show-word-limit
                placeholder="连续完成后的奖励提示"
              />
              <VanField
                v-model="draft.punishmentText"
                label="惩罚说明"
                type="textarea"
                autosize
                :maxlength="120"
                show-word-limit
                placeholder="失败达到阈值后的惩罚提示"
              />
            </VanCellGroup>
          </VanForm>
        </section>

        <section class="editor-save-dock">
          <div v-if="errorMessage" class="form-error">{{ errorMessage }}</div>
          <div v-if="reminderMessage" class="form-note">{{ reminderMessage }}</div>

          <VanButton block type="primary" class="primary-action" :disabled="isSaving" @click="saveHabit">
            {{ isSaving ? '保存中...' : isEditing ? '保存修改' : '创建任务' }}
          </VanButton>

          <VanButton
            v-if="isEditing"
            block
            plain
            type="danger"
            class="secondary-action"
            :disabled="isSaving"
            @click="showDeleteConfirm = true"
          >
            删除任务
          </VanButton>
        </section>
      </main>
    </IonContent>

    <VanPopup v-model:show="showTimePicker" round position="bottom">
      <VanTimePicker
        v-model="timePickerValue"
        title="选择提醒时间"
        confirm-button-text="完成"
        cancel-button-text="取消"
        @confirm="confirmReminderTime"
        @cancel="showTimePicker = false"
      />
    </VanPopup>

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
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { alarmOutline, calendarOutline, flagOutline } from 'ionicons/icons';
import {
  Button as VanButton,
  CellGroup as VanCellGroup,
  Field as VanField,
  Form as VanForm,
  Popup as VanPopup,
  Stepper as VanStepper,
  Switch as VanSwitch,
  TimePicker as VanTimePicker,
} from 'vant';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createEmptyHabitDraft, toHabitDraft, validateHabitDraft } from '@/modules/habits/habitService';
import { formatRepeatRule, weekdayOptions } from '@/modules/habits/repeatRules';
import { useHabitStore } from '@/stores/habitStore';
import type { RepeatRule, Weekday } from '@/types/habit';

const route = useRoute();
const router = useRouter();
const habitStore = useHabitStore();
const timeIcon = alarmOutline;
const repeatIcon = calendarOutline;
const thresholdIcon = flagOutline;
const isEditing = computed(() => Boolean(route.params.id));
const habitId = computed(() => String(route.params.id || ''));
const draft = reactive(createEmptyHabitDraft());
const errorMessage = ref('');
const reminderMessage = ref('');
const isSaving = ref(false);
const showDeleteConfirm = ref(false);
const showTimePicker = ref(false);
const timePickerValue = ref(['08', '00']);
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
  { type: 'weeklyTarget', label: '每周次数', description: '不固定日期，只要求一周完成几次。' },
];
const previewName = computed(() => draft.name.trim() || '给任务起个名字');
const scheduleSummary = computed(() => (draft.reminderEnabled ? `${draft.reminderTime} 提醒` : '当天内完成即可'));
const failureSummary = computed(() => `失败 ${Math.max(1, Number(draft.failureThreshold) || 1)} 次触发提醒`);
const editorSubtitle = computed(() => {
  if (!draft.name.trim()) {
    return '把任务写成一个能立刻开始的动作，后面打卡时会轻松很多。';
  }

  if (!draft.reminderEnabled) {
    return '这是一个全天任务，不催时间，只看今天有没有完成。';
  }

  return '提醒、重复和奖惩会一起进入今日清单。';
});

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

    await router.replace({ path: '/tasks', query: { reminder: '1' } });
  } finally {
    reminderMessage.value = habitStore.reminderMessage;
    isSaving.value = false;
  }
};

const repeatRuleLabel = computed(() => formatRepeatRule(draft.repeatRule));

const openTimePicker = () => {
  timePickerValue.value = draft.reminderTime.split(':');
  showTimePicker.value = true;
};

const confirmReminderTime = ({ selectedValues }: { selectedValues: string[] }) => {
  draft.reminderTime = selectedValues.join(':');
  showTimePicker.value = false;
};

const setRepeatRule = (type: RepeatRule['type']) => {
  if (type === 'weekly') {
    draft.repeatRule = {
      type,
      daysOfWeek: draft.repeatRule.type === 'weekly' ? draft.repeatRule.daysOfWeek : [1],
    };
    return;
  }

  if (type === 'weeklyTarget') {
    draft.repeatRule = {
      type,
      timesPerWeek: draft.repeatRule.type === 'weeklyTarget' ? draft.repeatRule.timesPerWeek : 4,
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
    await router.replace({ path: '/tasks', query: { reminder: '1' } });
  } finally {
    reminderMessage.value = habitStore.reminderMessage;
    isSaving.value = false;
  }
};
</script>
