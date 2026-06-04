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
            <h2>界面主题</h2>
            <p>第一版先接 3 个主题，后续可以继续扩展视觉人格。</p>
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
                <small>{{ theme.backgroundColor }} · {{ theme.accentColor }}</small>
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
      </main>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, onIonViewWillEnter } from '@ionic/vue';
import { themeConfigs } from '@/modules/themes/themeConfig';
import { toneProfiles } from '@/modules/tones/toneProfiles';
import { renderTonePrompt } from '@/modules/tones/toneCopy';
import { useAppStore } from '@/stores/appStore';

const appStore = useAppStore();

onIonViewWillEnter(() => {
  appStore.loadSettings();
});

const rewardPreview = computed(() =>
  renderTonePrompt(appStore.toneId, 'reward', '连续 7 天完成，可以安排一段认真放松时间。'),
);
const punishmentPreview = computed(() =>
  renderTonePrompt(appStore.toneId, 'punishment', '连续失败 3 次，减少一段娱乐时间并补一条复盘。'),
);
</script>
