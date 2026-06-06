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
            <p class="permission-hint">
              测试通知只验证“通知权限”；任务到点准时响，还需要 Android 的“闹钟与提醒/精确闹钟”允许定时唤醒。
            </p>
          </div>

          <div v-if="reminderMessage" class="form-note">{{ reminderMessage }}</div>

          <div class="option-stack compact-options">
            <button
              v-for="option in reminderIntensityOptions"
              :key="option.value"
              class="option-row option-row-single"
              :class="{ selected: appStore.reminderIntensity === option.value }"
              type="button"
              @click="setReminderIntensity(option.value)"
            >
              <span>
                <strong>{{ option.label }}</strong>
                <small>{{ option.description }}</small>
              </span>
            </button>
          </div>

          <div class="segmented-grid">
            <button
              v-for="option in reminderScheduleCountOptions"
              :key="option.value"
              :class="{ selected: appStore.reminderScheduleCount === option.value }"
              type="button"
              @click="setReminderScheduleCount(option.value)"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="action-row">
            <IonButton expand="block" @click="sendReminderTest">发送测试通知</IonButton>
            <IonButton expand="block" fill="outline" @click="refreshReminderStatus">刷新权限状态</IonButton>
            <IonButton expand="block" fill="outline" @click="rescheduleReminders">重排任务提醒</IonButton>
            <IonButton
              v-if="reminderStatus.exactAlarm === 'denied'"
              expand="block"
              fill="outline"
              color="warning"
              @click="openExactAlarm"
            >
              打开闹钟与提醒设置
            </IonButton>
          </div>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>后台提醒</h2>
            <p>后台提醒已收进排查面板，日常使用时不用一直盯着这些技术状态。</p>
          </div>

          <div class="action-row compact-action-row">
            <IonButton expand="block" fill="outline" @click="showReminderDiagnostics = !showReminderDiagnostics">
              {{ showReminderDiagnostics ? '收起排查信息' : '查看排查信息' }}
            </IonButton>
          </div>

          <template v-if="showReminderDiagnostics">
            <div class="diagnostic-grid">
              <div class="diagnostic-item">
                <span>通知权限</span>
                <strong>{{ reminderStatus.display === 'granted' ? '已开启' : '未开启' }}</strong>
              </div>
              <div class="diagnostic-item">
                <span>闹钟与提醒</span>
                <strong>{{ reminderStatus.exactAlarm === 'denied' ? '未允许' : '可用' }}</strong>
              </div>
              <div class="diagnostic-item">
                <span>已排入提醒</span>
                <strong>{{ reminderStatus.pendingCount ?? 0 }} 条</strong>
              </div>
            </div>

            <div class="background-checklist">
              <p>如果后台关闭后不响，优先检查这些系统项：</p>
              <p>1. 不要在系统设置里“强行停止”App；强停后 Android 会禁止闹钟，直到你重新打开 App。</p>
              <p>2. 在电池设置里把本 App 改成“不受限制”或“允许后台运行”。</p>
              <p>3. 如果手机有“自启动/后台弹出/关联启动”管理，把本 App 放行。</p>
              <p>4. 打开 App 后点“重排任务提醒”，确认“已排入提醒”不是 0。</p>
            </div>
          </template>
        </section>

        <section class="section-block">
          <div class="section-heading">
            <h2>界面主题</h2>
            <p>主题只控制界面外观；文案语气单独保留，切换主题不会改掉你选好的说话风格。</p>
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
                <small class="tone-meta">
                  {{ theme.tagline }} · 适合搭配：{{ getToneName(theme.recommendedToneId) }}
                </small>
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
            <p>语气比主题更细，可在当前主题的适配语气里继续调整。</p>
          </div>

          <div class="option-stack">
            <button
              v-for="tone in toneProfiles"
              :key="tone.id"
              class="option-row"
              :class="{
                selected: appStore.toneId === tone.id,
                recommended: tone.id === appStore.currentTheme.recommendedToneId,
                compatible: isToneCompatible(tone.id),
              }"
              type="button"
              @click="appStore.setTone(tone.id)"
            >
              <span>
                <strong>{{ tone.name }}</strong>
                <small>{{ tone.description }}</small>
                <small class="tone-meta">
                  {{ intensityLabelMap[tone.intensity] }} · {{ categoryLabelMap[tone.category] }}
                  <template v-if="tone.id === appStore.currentTheme.recommendedToneId"> · 当前主题推荐</template>
                  <template v-else-if="isToneCompatible(tone.id)"> · 当前主题适配</template>
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
            <p>先内置轻刺素材包，后续可以扩展为更强势的梗包或自定义文案包。</p>
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
            <IonButton expand="block" fill="outline" @click="importData">从剪贴板导入 JSON</IonButton>
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
import { getReminderPermissionStatus, openExactAlarmSettings, sendTestReminder } from '@/modules/reminders/reminderService';
import { clearLocalData, exportLocalDataAsJson, importLocalDataFromJson } from '@/modules/data/dataBackupService';
import { useAppStore } from '@/stores/appStore';
import { useCheckinStore } from '@/stores/checkinStore';
import { useHabitStore } from '@/stores/habitStore';
import type { ReminderIntensity, ReminderScheduleCount } from '@/modules/settings/settingsRepository';
import type { ToneCategory, ToneId, ToneIntensity, ToneMemePack, ToneMemePackSafetyLevel } from '@/types/tone';

const appStore = useAppStore();
const habitStore = useHabitStore();
const checkinStore = useCheckinStore();
const reminderMessage = ref('');
const dataMessage = ref('');
const showReminderDiagnostics = ref(false);
const reminderStatus = reactive({
  supported: false,
  display: 'unknown',
  exactAlarm: undefined as string | undefined,
  pendingCount: undefined as number | undefined,
  message: '正在读取通知权限...',
});
const intensityLabelMap: Record<ToneIntensity, string> = {
  low: '轻压迫',
  medium: '强督促',
  high: '高压接管',
};
const categoryLabelMap: Record<ToneCategory, string> = {
  supportive: '陪伴',
  pressure: '督促',
  data: '理性',
  playful: '玩梗',
  teasing: '挑衅',
  command: '命令',
};
const safetyLevelLabelMap: Record<ToneMemePackSafetyLevel, string> = {
  safe: '安全',
  edgy: '刺激',
  restricted: '受限',
};
const reminderIntensityOptions: { value: ReminderIntensity; label: string; description: string }[] = [
  { value: 'strong', label: '强提醒', description: '更明显的标题、展开正文、锁屏可见和高重要性渠道。' },
  { value: 'normal', label: '普通提醒', description: '保留提醒，但文案和打扰程度更克制。' },
];
const reminderScheduleCountOptions: { value: ReminderScheduleCount; label: string }[] = [
  { value: 7, label: '预排 7 次' },
  { value: 14, label: '预排 14 次' },
  { value: 30, label: '预排 30 次' },
];

onIonViewWillEnter(() => {
  appStore.loadSettings();
  refreshReminderStatus();
});

const rewardPreview = computed(() =>
  renderTonePrompt(appStore.toneId, 'reward', '连续 7 天守住规则，允许安排一段真正属于自己的放松时间。'),
);
const punishmentPreview = computed(() =>
  renderTonePrompt(appStore.toneId, 'punishment', '连续失败 3 次，暂停一段娱乐时间，补一条复盘，把原因写清楚。'),
);

const previewPackScenes = (pack: ToneMemePack) =>
  ['reward', 'punishment', 'recovery']
    .map((scene) => pack.scenePrefixes[scene as keyof ToneMemePack['scenePrefixes']]?.[0])
    .filter(Boolean)
    .join(' / ');

const getToneName = (toneId: ToneId) => toneProfiles.find((tone) => tone.id === toneId)?.name ?? '默认语气';

const isToneCompatible = (toneId: ToneId) => appStore.currentTheme.compatibleToneIds.includes(toneId);

const refreshReminderStatus = async () => {
  const nextStatus = await getReminderPermissionStatus();
  Object.assign(reminderStatus, nextStatus);
};

const sendReminderTest = async () => {
  const result = await sendTestReminder();
  reminderMessage.value = result.message;
  await refreshReminderStatus();
};

const openExactAlarm = async () => {
  const result = await openExactAlarmSettings();
  reminderMessage.value = result.message;
  await refreshReminderStatus();
};

const rescheduleReminders = async () => {
  await habitStore.refreshScheduledReminders();
  reminderMessage.value = '已重新排入所有启用提醒的任务；如果后台仍不响，请检查电池和自启动限制。';
  await refreshReminderStatus();
};

const setReminderIntensity = async (value: ReminderIntensity) => {
  await appStore.setReminderIntensity(value);
  await habitStore.refreshScheduledReminders();
  reminderMessage.value = `提醒强度已切换为${value === 'strong' ? '强提醒' : '普通提醒'}，并已重排任务提醒`;
  await refreshReminderStatus();
};

const setReminderScheduleCount = async (value: ReminderScheduleCount) => {
  await appStore.setReminderScheduleCount(value);
  await habitStore.refreshScheduledReminders();
  reminderMessage.value = `未来提醒已改为预排 ${value} 次，并已重排任务提醒`;
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

const importData = async () => {
  try {
    const json = await navigator.clipboard.readText();
    const backup = await importLocalDataFromJson(json);
    appStore.isLoaded = false;
    await appStore.loadSettings();
    await habitStore.loadHabits();
    await checkinStore.loadCheckIns();
    await habitStore.refreshScheduledReminders();
    dataMessage.value = `已导入 ${backup.habits.length} 个任务和 ${backup.checkIns.length} 条打卡记录`;
  } catch (error) {
    dataMessage.value = error instanceof Error ? `导入失败：${error.message}` : '导入失败，请确认剪贴板里是备份 JSON';
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
