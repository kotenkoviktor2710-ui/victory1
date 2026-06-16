<script setup lang="ts">
import GameModal from '@/components/game/GameModal.vue'
import { formatNumber } from '@/domain/formulas/economy'
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
  <GameModal title="На вас напал игрок:" @close="emit('flee')">
    <div class="inbound-attack__hero">
      <img
        v-if="attack.attackerAvatar"
        class="inbound-attack__avatar"
        :src="attack.attackerAvatar"
        alt=""
        aria-hidden="true"
      />
      <p class="inbound-attack__name game-text-stroke">{{ attack.attackerName }}</p>
      <p class="inbound-attack__meta game-text-stroke">
        Сила {{ formatNumber(attack.power) }}
      </p>
    </div>

    <div class="game-modal-picker__actions">
      <button
        type="button"
        class="game-sketch-btn game-sketch-btn--green game-modal-picker__action game-text-stroke"
        @click="emit('accept')"
      >
        В БОЙ!
      </button>
      <button
        type="button"
        class="game-sketch-btn game-sketch-btn--red game-modal-picker__action game-text-stroke"
        @click="emit('flee')"
      >
        Убежать
      </button>
    </div>
  </GameModal>
</template>

<style scoped>
.inbound-attack__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  text-align: center;
}

.inbound-attack__avatar {
  width: clamp(56px, 14vw, 72px);
  height: clamp(56px, 14vw, 72px);
  border: 3px solid var(--game-blue-border);
  border-radius: 50%;
  object-fit: cover;
  box-shadow: var(--game-shadow);
}

.inbound-attack__name {
  margin: 0;
  font-size: clamp(28px, 7vw, 40px);
  line-height: 1.05;
  color: #ff5f9a;
  letter-spacing: 0.02em;
}

.inbound-attack__meta {
  margin: 0;
  font-size: clamp(16px, 4vw, 22px);
  color: #ffe566;
}
</style>
