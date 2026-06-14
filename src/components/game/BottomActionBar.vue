<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  attack: []
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

    <button type="button" class="game-img-btn game-img-btn--attack bottom-bar__attack" @click="emit('attack')">
      <img class="game-img-btn__img" src="/images/attack-btn.png" alt="Напасть" />
    </button>

    <div class="bottom-bar__spacer" aria-hidden="true" />
  </footer>
</template>

<style scoped>
.bottom-bar {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
}

.bottom-bar__left {
  display: flex;
  gap: 16px;
  justify-self: start;
  padding-left: 12px;
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

.bottom-bar__attack {
  justify-self: center;
}
</style>
