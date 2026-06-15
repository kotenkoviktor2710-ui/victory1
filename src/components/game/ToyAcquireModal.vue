<script setup lang="ts">
import { computed } from 'vue'

import { showRewarded } from '@/ads/ads'
import LottieEffect from '@/components/game/LottieEffect.vue'
import ToySprite from '@/components/game/ToySprite.vue'
import { getToyNameByLevel } from '@/domain/data/toyLevelNames'
import { useGameStore } from '@/stores/gameStore'

const LIGHT_EFFECT = '/images/effects/light.json'

const game = useGameStore()

const celebration = computed(() => game.activeToyCelebration)

const characterName = computed(() => {
  if (!celebration.value) return ''
  return getToyNameByLevel(celebration.value.level)
})

function dismiss(): void {
  game.dismissToyCelebration()
}

function onClaim(): void {
  showRewarded(() => dismiss())
}
</script>

<template>
  <Teleport to="body">
    <Transition name="celebrate">
      <div
        v-if="celebration"
        class="toy-acquire-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="toy-acquire-title"
        @click.self="dismiss"
      >
        <div class="toy-acquire">
          <header class="toy-acquire__header">
            <p class="toy-acquire__eyebrow game-text-stroke">Поздравляем!</p>
            <h2 id="toy-acquire-title" class="toy-acquire__title game-text-stroke">Новый персонаж</h2>
          </header>

          <div class="toy-acquire__preview">
            <div class="toy-acquire__hero">
              <LottieEffect class="toy-acquire__light" :path="LIGHT_EFFECT" />
              <ToySprite
                :level="celebration.level"
                :alt="characterName"
                size="clamp(160px, 42vw, 240px)"
              />
            </div>
          </div>

          <button
            type="button"
            class="game-sketch-btn game-sketch-btn--yellow toy-acquire__btn game-text-stroke"
            @click="onClaim"
          >
            Забрать
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toy-acquire-overlay {
  position: fixed;
  inset: 0;
  z-index: 260;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.72);
}

.toy-acquire {
  width: min(100%, 520px);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0 0 24px;
  border: 4px solid var(--game-blue-border);
  border-radius: 0;
  background: url('/images/card-bg-1.png') center center / cover no-repeat;
  box-shadow:
    var(--game-shadow-inset),
    4px 4px 0 rgba(0, 0, 0, 0.45);
  text-align: center;
  color: #fff;
}

.toy-acquire__header {
  padding: 20px 24px 16px;
  border-bottom: 3px solid var(--game-blue-deep);
  background: rgba(15, 45, 82, 0.42);
}

.toy-acquire__eyebrow {
  margin: 0;
  font-size: clamp(14px, 3.6vw, 18px);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ffe566;
}

.toy-acquire__title {
  margin: 8px 0 0;
  font-size: clamp(26px, 6.8vw, 36px);
}

.toy-acquire__preview {
  position: relative;
  width: min(100%, 380px);
  margin: 22px auto 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.toy-acquire__hero {
  position: relative;
  width: clamp(160px, 42vw, 240px);
  height: clamp(160px, 42vw, 240px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.toy-acquire__light {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 240%;
  height: 240%;
  transform: translate(-50%, -50%);
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.toy-acquire__hero :deep(.toy-sprite) {
  position: relative;
  z-index: 1;
}

.toy-acquire__btn {
  margin: 20px 24px 0;
  width: calc(100% - 48px);
  min-height: clamp(48px, 12vw, 56px);
  border-radius: 0;
  font-size: clamp(16px, 4.2vw, 22px);
  color: #fff;
}

.celebrate-enter-active,
.celebrate-leave-active {
  transition: opacity 0.22s ease;
}

.celebrate-enter-active .toy-acquire,
.celebrate-leave-active .toy-acquire {
  transition: transform 0.22s ease;
}

.celebrate-enter-from,
.celebrate-leave-to {
  opacity: 0;
}

.celebrate-enter-from .toy-acquire,
.celebrate-leave-to .toy-acquire {
  transform: scale(0.94);
}
</style>
