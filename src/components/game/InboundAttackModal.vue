<script setup lang="ts">
import type { InboundAttack } from '@/domain/pvp/types'

defineProps<{
  attack: InboundAttack
}>()

const emit = defineEmits<{
  accept: []
  flee: []
}>()
</script>

<template>
  <div class="inbound-attack-overlay">
    <div class="inbound-attack">
      <p class="inbound-attack__label game-text-stroke">На вас напал игрок:</p>
      <p class="inbound-attack__name">{{ attack.attackerName }}</p>

      <div class="inbound-attack__actions">
        <button
          type="button"
          class="game-sketch-btn game-sketch-btn--green inbound-attack__btn game-text-stroke"
          @click="emit('accept')"
        >
          В БОЙ!
        </button>
        <button
          type="button"
          class="game-sketch-btn game-sketch-btn--red inbound-attack__btn game-text-stroke"
          @click="emit('flee')"
        >
          Убежать
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.inbound-attack-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.62);
}

.inbound-attack {
  width: min(520px, 100%);
  padding: 28px 24px 22px;
  text-align: center;
  background: #0b0b0b;
  border-radius: 4px;
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.08),
    0 18px 40px rgba(0, 0, 0, 0.55);
}

.inbound-attack__label {
  margin: 0 0 10px;
  font-size: clamp(1.1rem, 3vw, 1.35rem);
  color: #fff;
}

.inbound-attack__name {
  margin: 0 0 24px;
  font-size: clamp(1.5rem, 4.5vw, 2rem);
  font-weight: 900;
  color: #ff4f8b;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.45);
}

.inbound-attack__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.inbound-attack__btn {
  min-height: 54px;
  font-size: clamp(1rem, 2.8vw, 1.2rem);
}
</style>
