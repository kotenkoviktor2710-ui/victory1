<script setup lang="ts">
import HudAudioControls from '@/components/game/HudAudioControls.vue'

defineProps<{
  canAttack: boolean
  cooldownLabel: string
  showCooldownAd: boolean
}>()

const emit = defineEmits<{
  attack: []
  'skip-cooldown': []
}>()
</script>

<template>
  <footer class="bottom-bar">
    <div class="bottom-bar__left">
      <HudAudioControls />
    </div>

    <div class="bottom-bar__actions" :class="{ 'bottom-bar__actions--cooldown-ad': showCooldownAd }">
      <div class="bottom-bar__attack-wrap">
        <button
          v-if="canAttack"
          type="button"
          class="game-img-btn game-img-btn--attack bottom-bar__attack"
          @click="emit('attack')"
        >
          <img class="game-img-btn__img" src="/images/attack-btn.png" alt="Напасть" />
        </button>

        <div
          v-else-if="cooldownLabel"
          class="bottom-bar__cooldown-btn"
          role="status"
          aria-live="polite"
          :aria-label="`Кулдаун нападения ${cooldownLabel}`"
        >
          <span class="bottom-bar__cooldown-title game-text-stroke">Напасть</span>
          <span class="bottom-bar__cooldown game-text-stroke">{{ cooldownLabel }}</span>
        </div>
      </div>

      <button
        v-if="showCooldownAd"
        type="button"
        class="bottom-bar__ad-btn"
        aria-label="Не ждать — сбросить ожидание за просмотр рекламы"
        @click="emit('skip-cooldown')"
      >
        <span class="bottom-bar__ad-btn-text game-text-stroke">не ждать!</span>
        <img class="bottom-bar__ad-btn-icon" src="/images/ads.png" alt="" aria-hidden="true" />
      </button>
    </div>

    <div class="bottom-bar__spacer" aria-hidden="true" />
  </footer>
</template>

<style scoped>
.bottom-bar {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content minmax(0, 1fr);
  grid-template-rows: minmax(var(--bottom-bar-row-height, clamp(56px, 15vw, 72px)), auto);
  align-items: center;
  gap: 6px;
  min-height: var(--bottom-bar-row-height, clamp(56px, 15vw, 72px));
  padding: 8px 12px;
  box-sizing: border-box;
  overflow: hidden;
}

.bottom-bar__left {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-start;
  justify-self: start;
  flex-shrink: 0;
  min-width: 0;
  --game-hud-audio-icon-size: var(--game-bottom-icon-size, 34px);
  --game-hud-audio-gap: 10px;
}

.bottom-bar__spacer {
  grid-column: 3;
  grid-row: 1;
  min-width: 0;
}

.bottom-bar__actions {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(6px, 1.6vw, 10px);
  justify-self: center;
  width: auto;
  max-width: 100%;
  min-width: 0;
  flex-shrink: 0;
  z-index: 1;
  --bottom-action-btn-width: var(--game-attack-btn-width, clamp(188px, 50vw, 260px));
}

.bottom-bar__actions--cooldown-ad {
  gap: clamp(6px, 1.6vw, 10px);
}

.bottom-bar__attack-wrap {
  position: relative;
  flex: 0 0 auto;
  width: auto;
  min-width: 0;
  max-width: 100%;
}

.bottom-bar__attack {
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
}

.bottom-bar__attack :deep(.game-img-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bottom-bar__attack :deep(.game-img-btn__img) {
  display: block;
  width: var(--bottom-action-btn-width);
  max-width: none;
  max-height: var(--bottom-bar-row-height, clamp(56px, 15vw, 72px));
  height: auto;
  object-fit: contain;
}

.bottom-bar__cooldown-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(4px, 1.2vw, 8px);
  flex: 0 0 auto;
  width: var(--bottom-action-btn-width);
  max-width: 100%;
  height: var(--bottom-bar-row-height, clamp(56px, 15vw, 72px));
  min-height: 0;
  padding: 0 clamp(6px, 1.6vw, 10px);
  box-sizing: border-box;
  border: 3px solid #3d0a0a;
  border-radius: 8px;
  background: linear-gradient(180deg, #a32828 0%, #7d1818 45%, #5a1010 100%);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.2),
    inset 0 -4px 0 rgba(0, 0, 0, 0.24),
    2px 3px 0 rgba(0, 0, 0, 0.42);
  opacity: 0.72;
  pointer-events: none;
}

.bottom-bar__cooldown-title {
  font-size: clamp(22px, 5.8vw, 32px);
  line-height: 1;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.bottom-bar__ad-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(3px, 1vw, 6px);
  flex: 0 0 auto;
  width: var(--bottom-action-btn-width);
  max-width: 100%;
  min-width: 0;
  height: var(--bottom-bar-row-height, clamp(56px, 15vw, 72px));
  padding: 0 clamp(6px, 1.6vw, 10px);
  box-sizing: border-box;
  border: 2.5px solid var(--game-blue-deep);
  border-radius: 6px;
  background: var(--game-panel-texture) center center / cover no-repeat;
  box-shadow: var(--game-shadow-inset), var(--game-shadow);
  cursor: pointer;
  transition: transform 0.1s ease, opacity 0.15s ease;
}

.bottom-bar__ad-btn:active {
  transform: scale(0.96);
}

.bottom-bar__ad-btn-text {
  font-size: clamp(20px, 5.4vw, 30px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bottom-bar__ad-btn-icon {
  flex-shrink: 0;
  width: clamp(26px, 7vw, 36px);
  height: clamp(26px, 7vw, 36px);
  object-fit: contain;
  filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.4));
  pointer-events: none;
}

.bottom-bar__cooldown {
  font-size: clamp(18px, 4.8vw, 26px);
  line-height: 1;
  color: #fff;
  white-space: nowrap;
}
</style>
