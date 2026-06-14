<script setup lang="ts">
import { computed, ref } from 'vue'

import { APP_TITLE } from '@/config/env'

const progress = ref(0)

const progressPercent = computed(() => Math.round(progress.value * 100))

function setProgress(value: number): void {
  progress.value = Math.min(1, Math.max(0, value))
}

async function finish(): Promise<void> {
  setProgress(1)
  await new Promise((resolve) => window.setTimeout(resolve, 280))
}

function waitUntilReady(): Promise<void> {
  return Promise.resolve()
}

defineExpose({ setProgress, finish, waitUntilReady })
</script>

<template>
  <div
    class="loading-screen"
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label="Загрузка"
  >
    <div class="loading-screen__panel">
      <p class="loading-screen__brand">🧸 {{ APP_TITLE }}</p>
      <p class="loading-screen__label">Загрузка…</p>
      <div
        class="loading-screen__track"
        role="progressbar"
        :aria-valuenow="progressPercent"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`Загрузка ${progressPercent}%`"
      >
        <span class="loading-screen__bar" :style="{ width: `${progressPercent}%` }" />
      </div>
      <p class="loading-screen__value">{{ progressPercent }}%</p>
    </div>
  </div>
</template>

<style scoped>
.loading-screen {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  color: var(--color-text);
}

.loading-screen__panel {
  width: min(100%, 360px);
  margin: 0 1.25rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
}

.loading-screen__brand {
  margin: 0 0 0.5rem;
  font-size: 18px;
  font-weight: 900;
  text-align: center;
  color: var(--color-heading);
}

.loading-screen__label {
  margin: 0 0 0.75rem;
  font-size: 14px;
  font-weight: 800;
  opacity: 0.8;
}

.loading-screen__track {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--color-background-mute);
}

.loading-screen__bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #ffd54a;
  transition: width 0.2s ease;
}

.loading-screen__value {
  margin: 0.75rem 0 0;
  font-size: 13px;
  font-weight: 800;
  text-align: right;
  opacity: 0.75;
}

@media (prefers-reduced-motion: reduce) {
  .loading-screen__bar {
    transition: none;
  }
}
</style>
