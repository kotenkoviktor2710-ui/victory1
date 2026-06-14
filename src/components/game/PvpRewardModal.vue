<script setup lang="ts">
import { computed, ref } from 'vue'

import { showRewarded } from '@/ads/ads'
import { formatNumber } from '@/domain/formulas/economy'
import { useRewardSlider } from '@/composables/useRewardSlider'

const props = defineProps<{
  won: boolean
  baseReward: number
}>()

const emit = defineEmits<{
  claim: [amount: number, multiplier: number]
}>()

const { position, multiplier } = useRewardSlider()
const claimed = ref(false)

const bonusReward = computed(() => Math.round(props.baseReward * multiplier.value))

const multiplierMarks = [1, 2, 3, 4, 5] as const

function finishClaim(amount: number, mult: number): void {
  if (claimed.value) return
  claimed.value = true
  emit('claim', amount, mult)
}

function onClaimWithAd(): void {
  if (claimed.value) return
  const mult = multiplier.value
  const amount = Math.round(props.baseReward * mult)
  showRewarded(() => finishClaim(amount, mult))
}

function onSkip(): void {
  finishClaim(props.baseReward, 1)
}
</script>

<template>
  <div class="pvp-reward-overlay">
    <div class="pvp-reward__rays" aria-hidden="true" />

    <div class="pvp-reward">
      <h2 class="pvp-reward__title game-text-stroke">
        {{ won ? 'Победа' : 'Поражение' }}
      </h2>

      <div v-if="won" class="pvp-reward__stars" aria-hidden="true">
        <span v-for="i in 3" :key="i" class="pvp-reward__star">★</span>
      </div>

      <p class="pvp-reward__hint">
        Увеличить награду за просмотр рекламы?
      </p>

      <div class="pvp-reward__slider-wrap">
        <span class="pvp-reward__live-mult game-text-stroke">x{{ multiplier }}</span>

        <div class="pvp-reward__slider">
          <div class="pvp-reward__marks" aria-hidden="true">
            <span
              v-for="mark in multiplierMarks"
              :key="mark"
              class="pvp-reward__mark game-text-stroke"
              :class="{ 'pvp-reward__mark--peak': mark === 5 }"
            >
              x{{ mark }}
            </span>
          </div>
          <div class="pvp-reward__slider-track" />
          <span
            class="pvp-reward__thumb"
            :style="{ left: `${position}%` }"
            aria-hidden="true"
          />
        </div>
      </div>

      <button
        type="button"
        class="pvp-reward__claim"
        :disabled="claimed"
        @click="onClaimWithAd"
      >
        <img class="pvp-reward__claim-ad" src="/images/ads.png" alt="" aria-hidden="true" />
        <span class="pvp-reward__claim-value game-text-stroke">{{ formatNumber(bonusReward) }}</span>
        <img class="pvp-reward__claim-coin" src="/images/monets.png" alt="" aria-hidden="true" />
      </button>

      <button
        type="button"
        class="pvp-reward__skip"
        :disabled="claimed"
        @click="onSkip"
      >
        Не надо
      </button>
    </div>
  </div>
</template>

<style scoped>
.pvp-reward-overlay {
  position: fixed;
  inset: 0;
  z-index: 250;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.78);
}

.pvp-reward__rays {
  position: absolute;
  inset: 0;
  background:
    repeating-conic-gradient(
      from 0deg at 50% 42%,
      rgba(255, 255, 255, 0.05) 0deg 10deg,
      transparent 10deg 20deg
    );
  opacity: 0.45;
  pointer-events: none;
}

.pvp-reward {
  position: relative;
  z-index: 1;
  width: min(100%, 420px);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 22px 24px;
  border: 4px solid var(--game-blue-border);
  background: url('/images/card-bg-1.png') center center / cover no-repeat;
  box-shadow:
    var(--game-shadow-inset),
    4px 4px 0 rgba(0, 0, 0, 0.45);
  text-align: center;
}

.pvp-reward__title {
  margin: 0;
  font-size: clamp(30px, 8vw, 42px);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
}

.pvp-reward__stars {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.pvp-reward__star {
  font-size: clamp(34px, 9vw, 48px);
  line-height: 1;
  color: #ffe566;
  text-shadow:
    0 0 10px rgba(255, 229, 102, 0.65),
    2px 2px 0 var(--game-ink);
}

.pvp-reward__hint {
  margin: 18px 0 16px;
  font-size: clamp(14px, 3.6vw, 17px);
  font-weight: var(--game-font-weight);
  line-height: 1.35;
  color: #ffe566;
}

.pvp-reward__slider-wrap {
  position: relative;
  width: 100%;
  padding-top: 40px;
  margin-bottom: 22px;
}

.pvp-reward__live-mult {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  font-size: clamp(24px, 6.4vw, 34px);
  color: #ffe566;
  line-height: 1;
}

.pvp-reward__slider {
  position: relative;
  height: 44px;
  padding-top: 22px;
}

.pvp-reward__marks {
  position: absolute;
  left: 14px;
  right: 14px;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.pvp-reward__mark {
  flex: 1;
  text-align: center;
  font-size: 11px;
  font-weight: var(--game-font-weight);
  color: rgba(255, 255, 255, 0.82);
  white-space: nowrap;
}

.pvp-reward__mark--peak {
  color: #ffe566;
  font-size: 12px;
}

.pvp-reward__slider-track {
  position: absolute;
  left: 0;
  right: 0;
  top: 22px;
  height: 16px;
  border: 3px solid var(--game-ink);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.12);
}

.pvp-reward__thumb {
  position: absolute;
  top: calc(22px + 8px);
  z-index: 2;
  width: 28px;
  height: 28px;
  border: 3px solid var(--game-ink);
  border-radius: 50%;
  background: linear-gradient(180deg, #ce93d8 0%, #8e24aa 100%);
  box-shadow:
    0 0 10px rgba(206, 147, 216, 0.55),
    2px 2px 0 rgba(0, 0, 0, 0.35);
  transform: translate(-50%, -50%);
  transition: left 0.04s linear;
}

.pvp-reward__claim {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: clamp(54px, 14vw, 64px);
  padding: 10px 16px;
  border: 3px solid #4a148c;
  border-radius: 8px;
  background: linear-gradient(180deg, #ce93d8 0%, #8e24aa 100%);
  box-shadow:
    2px 2px 0 #4a148c,
    inset 0 -3px 0 rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.08s ease, opacity 0.15s ease;
}

.pvp-reward__claim:active:not(:disabled) {
  transform: scale(0.97) translateY(1px);
}

.pvp-reward__claim:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.pvp-reward__claim-ad {
  position: absolute;
  top: -10px;
  right: -6px;
  width: clamp(34px, 9vw, 42px);
  height: clamp(34px, 9vw, 42px);
  object-fit: contain;
  filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.4));
  pointer-events: none;
}

.pvp-reward__claim-value {
  font-size: clamp(22px, 5.8vw, 30px);
  color: #fff;
}

.pvp-reward__claim-coin {
  width: clamp(34px, 9vw, 42px);
  height: clamp(34px, 9vw, 42px);
  object-fit: contain;
  filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.35));
  pointer-events: none;
}

.pvp-reward__skip {
  margin-top: 14px;
  padding: 6px 10px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font-size: clamp(13px, 3.4vw, 15px);
  font-weight: var(--game-font-weight);
  cursor: pointer;
  transition: color 0.15s ease, opacity 0.15s ease;
}

.pvp-reward__skip:hover:not(:disabled) {
  color: rgba(255, 255, 255, 0.82);
}

.pvp-reward__skip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
