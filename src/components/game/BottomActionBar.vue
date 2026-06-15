<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  canAttack: boolean
  cooldownLabel: string
  showCooldownAd: boolean
}>()

const emit = defineEmits<{
  attack: []
  'skip-cooldown': []
}>()

const soundOn = ref(true)
const musicOn = ref(true)

function toggleSound(): void {
  soundOn.value = !soundOn.value
}

function toggleMusic(): void {
  musicOn.value = !musicOn.value
}
</script>

<template>
  <footer class="bottom-bar">
    <div class="bottom-bar__left">
      <button
        type="button"
        class="bottom-bar__icon-btn"
        :aria-label="soundOn ? 'Звук' : 'Звук выключен'"
        @click="toggleSound"
      >
        <span class="bottom-bar__icon-wrap">
          <img class="bottom-bar__icon-img" src="/images/volume.png" alt="" aria-hidden="true" />
          <span v-if="!soundOn" class="bottom-bar__icon-off-mark" aria-hidden="true" />
        </span>
      </button>
      <button
        type="button"
        class="bottom-bar__icon-btn"
        :aria-label="musicOn ? 'Музыка' : 'Музыка выключена'"
        @click="toggleMusic"
      >
        <span class="bottom-bar__icon-wrap">
          <img class="bottom-bar__icon-img bottom-bar__icon-img--melody" src="/images/melody.png" alt="" aria-hidden="true" />
          <span v-if="!musicOn" class="bottom-bar__icon-off-mark" aria-hidden="true" />
        </span>
      </button>
    </div>

    <div class="bottom-bar__actions">
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
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
}

.bottom-bar__left {
  display: flex;
  flex: 1;
  gap: 16px;
  justify-content: flex-start;
  padding-left: 12px;
  min-width: 0;
}

.bottom-bar__spacer {
  flex: 1;
  min-width: 0;
}

.bottom-bar__actions {
  display: flex;
  align-items: stretch;
  gap: clamp(8px, 2.2vw, 14px);
  flex-shrink: 0;
  --bottom-action-btn-width: clamp(168px, 46vw, 232px);
}

.bottom-bar__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  overflow: visible;
  transition: transform 0.1s ease, opacity 0.15s ease;
}

.bottom-bar__icon-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.bottom-bar__icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bottom-bar__icon-off-mark {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bottom-bar__icon-off-mark::before,
.bottom-bar__icon-off-mark::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 16px;
  height: 3px;
  background: #e52424;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgb(26 18 8 / 35%);
  transform: translate(-50%, -50%) rotate(45deg);
}

.bottom-bar__icon-off-mark::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.bottom-bar__icon-img {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.bottom-bar__icon-img--melody {
  transform: scale(1.48);
}

.bottom-bar__attack-wrap {
  position: relative;
}

.bottom-bar__attack {
  display: block;
}

.bottom-bar__attack :deep(.game-img-btn__img) {
  width: var(--bottom-action-btn-width);
  height: auto;
}

.bottom-bar__cooldown-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(10px, 2.8vw, 16px);
  width: var(--bottom-action-btn-width);
  min-height: clamp(54px, 15vw, 72px);
  padding: clamp(10px, 2.8vw, 14px) clamp(14px, 3.6vw, 18px);
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
}

.bottom-bar__ad-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(4px, 1.2vw, 8px);
  width: var(--bottom-action-btn-width);
  min-height: 100%;
  padding: 8px 10px;
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
}

.bottom-bar__ad-btn-icon {
  flex-shrink: 0;
  width: clamp(32px, 8.5vw, 42px);
  height: clamp(32px, 8.5vw, 42px);
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
