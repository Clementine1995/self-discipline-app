<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle>设置</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>
      <main class="page-stack with-top-space">
        <section class="section-block">
          <div class="section-heading">
            <h2>本地通知</h2>
            <p>{{ reminderStatus.message }}</p>
          </div>

          <div v-if="reminderMessage" class="form-note">{{ reminderMessage }}</div>

          <div class="action-row">
            <IonButton expand="block" @click="sendReminderTest">发送测试通知</IonButton>
            <IonButton expand="block" fill="outline" @click="refreshReminderStatus">刷新权限状态</IonButton>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>界面主题</h2>
            <p>主题会影响颜色、反馈方式和整体情绪氛围。</p>
          </div>

          <div class="option-stack">
            <button
              v-for="theme in themeConfigs"
              :key="theme.id"
              class="option-row"
              :class="{ selected: appStore.themeId === theme.id }"
              type="button"
              @click="appStore.setTheme(theme.id)"
            >
              <span class="swatch" :style="{ backgroundColor: theme.accentColor }"></span>
              <span>
                <strong>{{ theme.name }}</strong>
                <small>{{ theme.description }}</small>
                <small class="tone-meta">{{ theme.tagline }}</small>
                <span class="theme-preview-strip">
                  <i :style="{ backgroundColor: theme.accentColor }"></i>
                  <i :style="{ backgroundColor: theme.secondaryAccentColor }"></i>
                  <i :style="{ backgroundColor: theme.successColor }"></i>
                  <i :style="{ backgroundColor: theme.warningColor }"></i>
                  <i :style="{ backgroundColor: theme.dangerColor }"></i>
                </span>
              </span>
            </button>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>文案语气</h2>
            <p>默认温和，刺激型文案后续必须由用户主动开启。</p>
          </div>

          <div class="option-stack">
            <button
              v-for="tone in toneProfiles"
              :key="tone.id"
              class="option-row"
              :class="{ selected: appStore.toneId === tone.id }"
              type="button"
              @click="appStore.setTone(tone.id)"
            >
              <span>
                <strong>{{ tone.name }}</strong>
                <small>{{ tone.description }}</small>
                <small class="tone-meta">
                  {{ intensityLabelMap[tone.intensity] }} · {{ categoryLabelMap[tone.category] }}
                  <template v-if="tone.supportsMemeExtension"> · 支持梗包扩展</template>
                </small>
                <small>{{ tone.sample.reward }}</small>
              </span>
            </button>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>语气预览</h2>
            <p>{{ rewardPreview }}</p>
            <p>{{ punishmentPreview }}</p>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>文案素材包</h2>
            <p>先内置低刺激素材包，后续可以扩展为可更新梗包或自定义文案包。</p>
          </div>

          <div class="option-stack">
            <div v-for="pack in toneMemePacks" :key="pack.id" class="option-row option-row-single">
              <span>
                <strong>{{ pack.name }}</strong>
                <small>{{ pack.description }}</small>
                <small class="tone-meta">
                  {{ safetyLevelLabelMap[pack.safetyLevel] }} · {{ pack.enabledByDefault ? '默认启用' : '默认关闭' }}
                </small>
                <small>{{ previewPackScenes(pack) }}</small>
              </span>
            </div>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>本地数据</h2>
            <p>导出 JSON 便于备份；清空数据会删除任务和打卡记录，但保留当前主题和语气设置。</p>
          </div>

          <div v-if="dataMessage" class="form-note">{{ dataMessage }}</div>

          <div class="action-row">
            <IonButton expand="block" @click="exportData">复制导出 JSON</IonButton>
            <IonButton expand="block" fill="outline" color="danger" @click="resetData">清空任务和打卡</IonButton>
          </div>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, onIonViewWillEnter } from '@ionic/vue';
import { themeConfigs } from '@/modules/themes/themeConfig';
import { toneProfiles } from '@/modules/tones/toneProfiles';
import { toneMemePacks } from '@/modules/tones/toneMemePacks';
import { renderTonePrompt } from '@/modules/tones/toneCopy';
import { getReminderPermissionStatus, sendTestReminder } from '@/modules/reminders/reminderService';
import { clearLocalData, exportLocalDataAsJson } from '@/modules/data/dataBackupService';
import { useAppStore } from '@/stores/appStore';
import { useCheckinStore } from '@/stores/checkinStore';
import { useHabitStore } from '@/stores/habitStore';
import type { ToneCategory, ToneIntensity, ToneMemePack, ToneMemePackSafetyLevel } from '@/types/tone';

const appStore = useAppStore();
const habitStore = useHabitStore();
const checkinStore = useCheckinStore();
const reminderMessage = ref('');
const dataMessage = ref('');
const reminderStatus = reactive({
  supported: false,
  display: 'unknown',
  message: '正在读取通知权限...',
});
const intensityLabelMap: Record<ToneIntensity, string> = {
  low: '低刺激',
  medium: '中刺激',
  high: '高刺激',
};
const categoryLabelMap: Record<ToneCategory, string> = {
  supportive: '陪伴',
  pressure: '督促',
  data: '理性',
  playful: '轻松',
};
const safetyLevelLabelMap: Record<ToneMemePackSafetyLevel, string> = {
  safe: '安全',
  edgy: '刺激',
  restricted: '受限',
};

onIonViewWillEnter(() => {
  appStore.loadSettings();
  refreshReminderStatus();
});

const rewardPreview = computed(() =>
  renderTonePrompt(appStore.toneId, 'reward', '连续 7 天完成，可以安排一段认真放松时间。'),
);
const punishmentPreview = computed(() =>
  renderTonePrompt(appStore.toneId, 'punishment', '连续失败 3 次，减少一段娱乐时间并补一条复盘。'),
);

const previewPackScenes = (pack: ToneMemePack) =>
  ['reward', 'punishment', 'recovery']
    .map((scene) => pack.scenePrefixes[scene as keyof ToneMemePack['scenePrefixes']]?.[0])
    .filter(Boolean)
    .join(' / ');

const refreshReminderStatus = async () => {
  const nextStatus = await getReminderPermissionStatus();
  Object.assign(reminderStatus, nextStatus);
};

const sendReminderTest = async () => {
  const result = await sendTestReminder();
  reminderMessage.value = result.message;
  await refreshReminderStatus();
};

const exportData = async () => {
  const json = await exportLocalDataAsJson();

  try {
    await navigator.clipboard.writeText(json);
    dataMessage.value = '数据 JSON 已复制到剪贴板';
  } catch {
    dataMessage.value = json;
  }
};

const resetData = async () => {
  await clearLocalData();
  habitStore.habits = [];
  habitStore.isLoaded = true;
  checkinStore.checkIns = [];
  checkinStore.isLoaded = true;
  dataMessage.value = '任务和打卡记录已清空';
};
</script>
