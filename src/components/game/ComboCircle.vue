<script setup lang="ts">
import { computed } from 'vue'

import { useClicker } from '@/composables/useClicker'
import { COMBO_LEVEL_COLORS, COMBO_MULTIPLIERS } from '@/domain/types/game'
import { useI18n } from '@/i18n'

const RING_RADIUS = 42
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const levelStrokeColors = ['#bdbdbd', '#7ee06a', '#64b5f6', '#ce93d8', '#ef5350']

const { comboBarPercent, comboLabel, comboLevel } = useClicker()
const { t } = useI18n()

const comboColor = computed(
  () => COMBO_LEVEL_COLORS[comboLevel.value] ?? COMBO_LEVEL_COLORS[0],
)

const comboMultiplier = computed(
  () => COMBO_MULTIPLIERS[comboLevel.value] ?? 1,
)

const progressStroke = computed(
  () => levelStrokeColors[comboLevel.value] ?? levelStrokeColors[0],
)

const progressOffset = computed(
  () => RING_CIRCUMFERENCE * (1 - comboBarPercent.value / 100),
)
</script>

<template>
  <div
    class="combo-circle"
    role="status"
    aria-live="polite"
    :aria-label="t('combo.aria', { label: comboLabel, percent: Math.round(comboBarPercent) })"
  >
    <svg class="combo-circle__svg" viewBox="0 0 100 100" aria-hidden="true">
      <circle
        class="combo-circle__track"
        cx="50"
        cy="50"
        :r="RING_RADIUS"
        fill="none"
      />
      <circle
        class="combo-circle__progress"
        cx="50"
        cy="50"
        :r="RING_RADIUS"
        fill="none"
        :stroke="progressStroke"
        :stroke-dasharray="RING_CIRCUMFERENCE"
        :stroke-dashoffset="progressOffset"
        transform="rotate(-90 50 50)"
      />
    </svg>

    <p class="combo-circle__label game-text-stroke" :style="{ color: comboColor }">
      <span class="combo-circle__x">x</span>
      <span class="combo-circle__num">{{ comboMultiplier }}</span>
    </p>
  </div>
</template>

<style scoped>
.combo-circle {
  position: relative;
  flex-shrink: 0;
  width: clamp(72px, 20vw, 104px);
  height: clamp(72px, 20vw, 104px);
}

.combo-circle__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(1px 2px 0 rgba(0, 0, 0, 0.35));
}

.combo-circle__track {
  stroke: rgba(15, 45, 82, 0.42);
  stroke-width: 7;
}

.combo-circle__progress {
  stroke-width: 7;
  stroke-linecap: round;
  transition:
    stroke-dashoffset 0.35s ease-out,
    stroke 0.45s ease;
}

.combo-circle__label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  margin: 0;
  line-height: 1;
  letter-spacing: 0.02em;
  pointer-events: none;
}

.combo-circle__x {
  font-size: 0.92em;
}

.combo-circle__num {
  font-size: 1em;
}
</style>
