<script setup lang="ts">
import { onMounted, ref } from 'vue'

import {
  showInterstitial,
  showRewarded,
  showStartupInterstitial,
} from '@/ads/ads'
import { fetchLeaderboardEntries, LEADERBOARD_NAME, submitLeaderboardScore } from '@/yandex/leaderboard'
import { loadPlayerData, savePlayerData } from '@/yandex/playerStorage'
import { getLang, isYsdkReady } from '@/yandex/sdk'
import { tryShowPlatformReviewWhenSafe } from '@/yandex/reviewPrompt'
import { APP_TITLE } from '@/config/env'

const sdkReady = ref(isYsdkReady())
const lang = ref(getLang())
const saveStatus = ref('—')
const leaderboardStatus = ref('—')

onMounted(async () => {
  sdkReady.value = isYsdkReady()
  lang.value = getLang()

  const save = await loadPlayerData<{ visits?: number }>()
  saveStatus.value = save ? `Визитов: ${save.visits ?? 0}` : 'Нет сохранения'
})

async function onSaveDemo(): Promise<void> {
  const current = (await loadPlayerData<{ visits?: number }>()) ?? { visits: 0 }
  const next = { visits: (current.visits ?? 0) + 1 }
  await savePlayerData(next, undefined, true)
  saveStatus.value = `Визитов: ${next.visits}`
}

function onInterstitial(): void {
  showInterstitial('demo')
}

function onRewarded(): void {
  showRewarded(() => {
    saveStatus.value = 'Награда получена'
  })
}

async function onLeaderboard(): Promise<void> {
  await submitLeaderboardScore(100)
  const entries = await fetchLeaderboardEntries(100)
  leaderboardStatus.value = `${LEADERBOARD_NAME}: ${entries.length} записей`
}

function onReview(): void {
  tryShowPlatformReviewWhenSafe()
}

function onStartupAd(): void {
  showStartupInterstitial()
}
</script>

<template>
  <main class="home">
    <header class="home__header">
      <h1 class="home__title">{{ APP_TITLE }}</h1>
      <p class="home__subtitle">Минимальный каркас с интеграцией Yandex SDK</p>
    </header>

    <section class="home__card">
      <h2 class="home__card-title">SDK</h2>
      <dl class="home__meta">
        <dt>SDK</dt>
        <dd>{{ sdkReady ? 'готов' : 'dev / не инициализирован' }}</dd>
        <dt>Язык</dt>
        <dd>{{ lang }}</dd>
        <dt>Облако</dt>
        <dd>{{ saveStatus }}</dd>
      </dl>
      <button type="button" class="home__btn" @click="onSaveDemo">Сохранить визит</button>
    </section>

    <section class="home__card">
      <h2 class="home__card-title">Лидерборд</h2>
      <button type="button" class="home__btn home__btn--secondary" @click="onLeaderboard">
        Отправить счёт и загрузить таблицу
      </button>
      <p class="home__hint">{{ leaderboardStatus }}</p>
    </section>

    <section class="home__card">
      <h2 class="home__card-title">Реклама</h2>
      <div class="home__actions">
        <button type="button" class="home__btn" @click="onStartupAd">Стартовая</button>
        <button type="button" class="home__btn home__btn--secondary" @click="onInterstitial">
          Interstitial
        </button>
        <button type="button" class="home__btn home__btn--secondary" @click="onRewarded">
          Rewarded
        </button>
        <button type="button" class="home__btn home__btn--ghost" @click="onReview">Оценка</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home {
  min-height: 100dvh;
  padding: 24px 16px 32px;
  background: var(--color-background);
  color: var(--color-text);
}

.home__header {
  margin-bottom: 24px;
  text-align: center;
}

.home__title {
  margin: 0 0 8px;
  font-size: clamp(22px, 5vw, 28px);
  font-weight: 700;
  color: var(--color-heading);
}

.home__subtitle {
  margin: 0;
  font-size: 14px;
  opacity: 0.7;
}

.home__card {
  max-width: 420px;
  margin: 0 auto 16px;
  padding: 16px;
  border-radius: 12px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
}

.home__card-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
}

.home__meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 12px;
  margin: 0 0 12px;
  font-size: 14px;
}

.home__meta dt {
  opacity: 0.7;
}

.home__meta dd {
  margin: 0;
  font-weight: 600;
}

.home__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.home__btn {
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background: #ffd54a;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.home__btn--secondary {
  background: #e8eef5;
}

.home__btn--ghost {
  background: transparent;
  border: 1px solid var(--color-border);
}

.home__hint {
  margin: 12px 0 0;
  font-size: 13px;
  opacity: 0.75;
}
</style>
