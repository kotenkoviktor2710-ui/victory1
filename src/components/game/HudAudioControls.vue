<script setup lang="ts">
import { useHudAudio } from '@/composables/useHudAudio'

const { soundOn, musicOn, toggleSound, toggleMusic } = useHudAudio()
</script>

<template>
  <div class="hud-audio">
    <button
      type="button"
      class="hud-audio__btn"
      :aria-label="soundOn ? 'Звук' : 'Звук выключен'"
      @click="toggleSound"
    >
      <span class="hud-audio__icon-wrap" :class="{ 'hud-audio__icon-wrap--off': !soundOn }">
        <img class="hud-audio__icon" src="/images/volume.png" alt="" aria-hidden="true" />
        <span v-if="!soundOn" class="hud-audio__off-mark" aria-hidden="true" />
      </span>
    </button>
    <button
      type="button"
      class="hud-audio__btn"
      :aria-label="musicOn ? 'Музыка' : 'Музыка выключена'"
      @click="toggleMusic"
    >
      <span class="hud-audio__icon-wrap" :class="{ 'hud-audio__icon-wrap--off': !musicOn }">
        <img class="hud-audio__icon hud-audio__icon--melody" src="/images/melody.png" alt="" aria-hidden="true" />
        <span v-if="!musicOn" class="hud-audio__off-mark" aria-hidden="true" />
      </span>
    </button>
  </div>
</template>

<style scoped>
.hud-audio {
  display: flex;
  align-items: center;
  gap: var(--game-hud-audio-gap, 10px);
  flex-shrink: 0;
  --game-hud-audio-icon-size: 34px;
}

.hud-audio__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--game-hud-audio-icon-size);
  height: var(--game-hud-audio-icon-size);
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  overflow: visible;
  transition: transform 0.1s ease, opacity 0.15s ease;
}

.hud-audio__btn:active:not(:disabled) {
  transform: scale(0.96);
}

.hud-audio__icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.hud-audio__icon-wrap--off .hud-audio__icon {
  opacity: 0.45;
}

.hud-audio__off-mark {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.hud-audio__off-mark::before,
.hud-audio__off-mark::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(var(--game-hud-audio-icon-size) * 0.68);
  height: 4px;
  background: #e52424;
  border-radius: 2px;
  box-shadow: 0 0 0 1.5px rgb(26 18 8 / 40%);
  transform: translate(-50%, -50%) rotate(45deg);
}

.hud-audio__off-mark::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.hud-audio__icon {
  display: block;
  width: var(--game-hud-audio-icon-size);
  height: var(--game-hud-audio-icon-size);
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  transition: opacity 0.15s ease;
}

.hud-audio__icon--melody {
  transform: scale(1.2);
}
</style>
