<script setup lang="ts">
import { computed, ref } from 'vue'

import { useI18n } from '@/i18n'

const progress = ref(0)
const { t } = useI18n()

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
    :aria-label="t('loading.aria')"
  >
    <div class="loading-screen__bg" aria-hidden="true" />
    <div class="loading-screen__shade" aria-hidden="true" />

    <div class="loading-screen__stage">
      <div class="loading-screen__panel">
        <div class="loading-screen__hero" aria-hidden="true">
          <img class="loading-screen__toy loading-screen__toy--left" src="/images/toys/7.webp" alt="" />
          <img class="loading-screen__toy loading-screen__toy--center" src="/images/toys/12.webp" alt="" />
          <img class="loading-screen__toy loading-screen__toy--right" src="/images/toys/25.webp" alt="" />
        </div>

        <p class="loading-screen__label game-text-stroke">{{ t('loading.label') }}</p>

        <div
          class="loading-screen__track"
          role="progressbar"
          :aria-valuenow="progressPercent"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="t('loading.progress', { percent: progressPercent })"
        >
          <span class="loading-screen__fill" :style="{ width: `${progressPercent}%` }" />
          <span class="loading-screen__percent game-text-stroke">{{ progressPercent }}%</span>
        </div>
      </div>
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
  overflow: hidden;
  font-weight: 900;
  background: #121820;
}

.loading-screen__bg {
  position: absolute;
  inset: 0;
  background: url('/images/bg.jpg') center center / cover no-repeat;
  pointer-events: none;
}

.loading-screen__shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(
      180deg,
      rgba(6, 10, 20, 0.62) 0%,
      rgba(6, 10, 20, 0.28) 38%,
      rgba(6, 10, 20, 0.36) 72%,
      rgba(6, 10, 20, 0.68) 100%
    ),
    radial-gradient(ellipse 110% 80% at 50% 42%, transparent 30%, rgba(0, 0, 0, 0.42) 100%);
}

.loading-screen__stage {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(100%, 420px);
  padding: 0 clamp(16px, 5vw, 28px);
  padding-top: calc(12px + env(safe-area-inset-top, 0px));
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
}

.loading-screen__panel {
  width: 100%;
  padding: clamp(18px, 5vw, 28px) clamp(16px, 4.5vw, 24px) clamp(20px, 5.5vw, 30px);
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  text-align: center;
}

.loading-screen__hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: clamp(4px, 1.5vw, 10px);
  min-height: clamp(84px, 23vw, 124px);
  margin-bottom: clamp(8px, 2.5vw, 14px);
}

.loading-screen__toy {
  display: block;
  object-fit: contain;
  filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.45));
  pointer-events: none;
  user-select: none;
  animation: loading-toy-bob 2.4s ease-in-out infinite;
}

.loading-screen__toy--left {
  width: clamp(60px, 17vw, 90px);
  height: clamp(60px, 17vw, 90px);
  animation-delay: 0s;
}

.loading-screen__toy--center {
  width: clamp(74px, 21vw, 110px);
  height: clamp(74px, 21vw, 110px);
  animation-delay: 0.35s;
}

.loading-screen__toy--right {
  width: clamp(60px, 17vw, 90px);
  height: clamp(60px, 17vw, 90px);
  animation-delay: 0.7s;
}

.loading-screen__label {
  margin: 0 0 clamp(10px, 3vw, 14px);
  font-size: clamp(16px, 4.5vw, 22px);
  color: #fff;
  opacity: 0.95;
}

.loading-screen__track {
  position: relative;
  height: clamp(36px, 10vw, 46px);
  border: 3px solid var(--game-ink);
  border-radius: 10px;
  background: #fff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    2px 3px 0 rgba(0, 0, 0, 0.38);
  overflow: hidden;
}

.loading-screen__fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(180deg, #ffe566 0%, #f5c518 55%, #e6a800 100%);
  transition: width 0.22s ease-out;
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.35);
}

.loading-screen__percent {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(16px, 4.5vw, 22px);
  color: var(--game-ink);
  -webkit-text-stroke: 0;
  text-shadow: none;
  letter-spacing: 0.04em;
}

@media (prefers-reduced-motion: reduce) {
  .loading-screen__toy {
    animation: none;
  }

  .loading-screen__fill {
    transition: none;
  }
}

@keyframes loading-toy-bob {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}
</style>
