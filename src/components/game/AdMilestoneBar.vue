<script setup lang="ts">
import { computed, ref } from 'vue'

import ToySprite from '@/components/game/ToySprite.vue'
import { AD_MILESTONE_REWARD_TOYS, AD_MILESTONE_VIEWS } from '@/domain/constants'
import { useI18n } from '@/i18n'
import { useGameStore } from '@/stores/gameStore'

const rootRef = ref<HTMLElement | null>(null)
const game = useGameStore()
const { t } = useI18n()

const progressPercent = computed(() => game.adMilestoneProgressPercent)

defineExpose({
  getAnchorRect(): DOMRect | null {
    return rootRef.value?.getBoundingClientRect() ?? null
  },
})
</script>

<template>
  <div ref="rootRef" class="ad-milestone">
    <img class="ad-milestone__icon" src="/images/ads.png" alt="" aria-hidden="true" />

    <div
      class="ad-milestone__track"
      role="progressbar"
      :aria-valuenow="game.rewardedAdViews"
      :aria-valuemin="0"
      :aria-valuemax="AD_MILESTONE_VIEWS"
      :aria-label="t('ad.milestoneAria')"
    >
      <span class="ad-milestone__fill" :style="{ width: `${progressPercent}%` }" />
      <span class="ad-milestone__label game-text-stroke">{{ game.adMilestoneProgressLabel }}</span>
    </div>

    <div class="ad-milestone__reward" aria-hidden="true">
      <span class="ad-milestone__reward-text game-text-stroke">+{{ AD_MILESTONE_REWARD_TOYS }}</span>
      <div class="ad-milestone__reward-toys">
        <ToySprite :level="game.shopAdGrantLevel" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ad-milestone {
  display: flex;
  align-items: center;
  gap: clamp(6px, 1.6vw, 10px);
  width: 100%;
  overflow: visible;
}

.ad-milestone__icon {
  flex-shrink: 0;
  width: clamp(34px, 9vw, 44px);
  height: clamp(34px, 9vw, 44px);
  object-fit: contain;
  filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.35));
  pointer-events: none;
}

.ad-milestone__track {
  position: relative;
  flex: 1;
  min-width: 0;
  height: clamp(34px, 8.8vw, 44px);
  border: 3px solid var(--game-ink);
  border-radius: 0;
  background: #fff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    2px 3px 0 rgba(0, 0, 0, 0.38);
  overflow: hidden;
}

.ad-milestone__fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(180deg, #ce93d8 0%, #ab47bc 55%, #8e24aa 100%);
  transition: width 0.35s ease-out;
}

.ad-milestone__label {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(16px, 4.2vw, 22px);
  color: var(--game-ink);
  -webkit-text-stroke: 0;
  text-shadow: none;
  letter-spacing: 0.04em;
}

.ad-milestone__reward {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  min-width: clamp(72px, 18vw, 92px);
  min-height: clamp(30px, 8vw, 36px);
  padding: 4px clamp(44px, 11vw, 56px) 4px 10px;
  border: 2.5px solid var(--game-blue-deep);
  border-radius: 0;
  background: linear-gradient(180deg, #b39ddb 0%, #7e57c2 100%);
  box-shadow: var(--game-shadow-inset), var(--game-shadow);
  overflow: visible;
  pointer-events: none;
}

.ad-milestone__reward-text {
  position: relative;
  z-index: 1;
  flex: 1;
  font-size: clamp(14px, 3.6vw, 18px);
  white-space: nowrap;
}

.ad-milestone__reward-toys {
  position: absolute;
  right: clamp(-12px, -3vw, -6px);
  top: 50%;
  z-index: 2;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
  pointer-events: none;
}

.ad-milestone__reward-toys :deep(.toy-sprite) {
  --toy-size: clamp(48px, 12vw, 62px);
}

.ad-milestone__reward-toys :deep(.toy-sprite__img) {
  filter: drop-shadow(1px 3px 2px rgba(0, 0, 0, 0.35));
}

@media (min-width: 1025px) {
  .ad-milestone__reward {
    min-width: clamp(88px, 11vw, 112px);
    min-height: clamp(40px, 5vw, 52px);
    padding-right: clamp(54px, 6.8vw, 70px);
  }

  .ad-milestone__reward-toys {
    right: clamp(-16px, -2vw, -10px);
  }

  .ad-milestone__reward-toys :deep(.toy-sprite) {
    --toy-size: clamp(58px, 7.2vw, 76px);
  }
}
</style>
