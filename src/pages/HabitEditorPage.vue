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
              <IonToggle v-model="draft.reminderEnabled" justify="space-between">每天提醒</IonToggle>
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

          <div v-if="errorMessage" class="form-error">{{ errorMessage }}</div>

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
            @click="deleteHabit"
          >
            删除任务
          </IonButton>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
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
import { useHabitStore } from '@/stores/habitStore';

const route = useRoute();
const router = useRouter();
const habitStore = useHabitStore();
const isEditing = computed(() => Boolean(route.params.id));
const habitId = computed(() => String(route.params.id || ''));
const draft = reactive(createEmptyHabitDraft());
const errorMessage = ref('');
const isSaving = ref(false);

onIonViewWillEnter(async () => {
  errorMessage.value = '';
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
    isSaving.value = false;
  }
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
    isSaving.value = false;
  }
};
</script>
