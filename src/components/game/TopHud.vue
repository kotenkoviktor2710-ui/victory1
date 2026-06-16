<script setup lang="ts">
import { computed } from 'vue'

import ComboBar from '@/components/game/ComboBar.vue'
import ComboCircle from '@/components/game/ComboCircle.vue'
import HudAudioControls from '@/components/game/HudAudioControls.vue'
import { formatNumber } from '@/domain/formulas/economy'
import { useGameStore } from '@/stores/gameStore'

const emit = defineEmits<{
  collection: []
  freeToys: [fromRect: DOMRect]
}>()

function onFreeToys(event: MouseEvent): void {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  emit('freeToys', rect)
}

const game = useGameStore()

const coinDisplay = computed(() => formatNumber(game.coins))
</script>

<template>
  <header class="top-hud">
    <div class="top-hud__main">
      <div class="top-hud__left">
        <button type="button" class="game-img-btn game-img-btn--hud" @click="emit('collection')">
          <img
            class="game-img-btn__img top-hud__hud-img top-hud__hud-img--full"
            src="/images/collection-btn.png"
            alt="Коллекция"
          />
          <img
            class="game-img-btn__img top-hud__hud-img top-hud__hud-img--icon"
            src="/images/collection-icon.png"
            alt="Коллекция"
          />
        </button>
        <button type="button" class="game-img-btn game-img-btn--hud" @click="onFreeToys">
          <img
            class="game-img-btn__img top-hud__hud-img top-hud__hud-img--full"
            src="/images/free-btn.png"
            alt="Бесплатные игрушки"
          />
          <img
            class="game-img-btn__img top-hud__hud-img top-hud__hud-img--icon"
            src="/images/review-icon.png"
            alt="Бесплатные игрушки"
          />
        </button>
      </div>

      <div class="top-hud__center">
        <ComboBar />
      </div>

      <div class="top-hud__right">
        <HudAudioControls class="top-hud__audio" />
        <div class="game-coin-banner game-panel">
          <span class="game-coin-banner__value game-text-stroke">{{ coinDisplay }}</span>
          <img class="game-coin-banner__icon" src="/images/monets.png" alt="" aria-hidden="true" />
        </div>
      </div>
    </div>

    <div class="top-hud__combo-row">
      <ComboCircle class="top-hud__combo-circle" />
    </div>
  </header>
</template>

<style scoped>
.top-hud {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 6px 6px 10px;
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
}

.top-hud__main {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 8px;
}

.top-hud__left {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: var(--game-hud-btn-width, clamp(172px, 48vw, 238px));
}

.top-hud__center {
  display: flex;
  justify-content: center;
  align-self: start;
  min-width: 0;
}

.top-hud__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  justify-self: end;
  align-self: start;
  gap: clamp(6px, 1.6vw, 10px);
  width: var(--game-coin-banner-width, clamp(172px, 46vw, 240px));
  min-width: 0;
}

.top-hud__audio {
  display: none;
  flex-shrink: 0;
}

.top-hud__combo-row {
  display: none;
  justify-content: flex-start;
  align-items: center;
  padding-left: 2px;
}

.top-hud__combo-circle {
  display: block;
}

.top-hud__combo-circle :deep(.combo-circle__label) {
  font-size: clamp(28px, 8vw, 44px);
}

.top-hud__hud-img--icon {
  display: none;
}
</style>
