<script setup lang="ts">
import { computed } from 'vue'

import { useI18n } from '@/i18n'

const props = defineProps<{
  secondsLeft: number
}>()

const { t } = useI18n()

const countdownAria = computed(() =>
  t('ad.breakCountdown', { seconds: props.secondsLeft }),
)
</script>

<template>
  <Teleport to="body">
    <div
      class="ad-break-overlay"
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
      :aria-label="countdownAria"
    >
      <div class="ad-break-modal">
        <p class="ad-break-modal__label game-text-stroke">{{ t('ad.breakSoon') }}</p>
        <p class="ad-break-modal__count game-text-stroke" aria-hidden="true">{{ secondsLeft }}</p>
        <p class="ad-break-modal__hint game-text-stroke">{{ t('ad.breakPaused') }}</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ad-break-overlay {
  position: fixed;
  inset: 0;
  z-index: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.82);
  pointer-events: all;
  touch-action: none;
}

.ad-break-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: min(100%, 360px);
  padding: 28px 24px 32px;
  border: 4px solid var(--game-blue-border);
  background: url('/images/card-bg-1.png') center center / cover no-repeat;
  box-shadow:
    var(--game-shadow-inset),
    4px 4px 0 rgba(0, 0, 0, 0.45);
  text-align: center;
}

.ad-break-modal__label {
  margin: 0;
  font-size: clamp(22px, 5.5vw, 30px);
  line-height: 1.1;
  color: #ffd54f;
}

.ad-break-modal__count {
  margin: 4px 0;
  font-size: clamp(64px, 18vw, 96px);
  line-height: 1;
  color: #fff;
}

.ad-break-modal__hint {
  margin: 0;
  font-size: clamp(16px, 4vw, 20px);
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.88);
}
</style>
