<script setup lang="ts">
import GameModal from '@/components/game/GameModal.vue'
import ToySprite from '@/components/game/ToySprite.vue'
import { usePvp } from '@/composables/usePvp'
import { PVP_RANK_LABELS } from '@/domain/constants'
import { useGameStore } from '@/stores/gameStore'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const game = useGameStore()
const { playerTeam, teamPower, canBattle, lastBattle, startBattle } = usePvp()

function onBattle(): void {
  startBattle()
}

function onTeamToy(instanceId: string): void {
  game.toggleTeamToy(instanceId)
}
</script>

<template>
  <GameModal v-if="open" title="PvP — Напасть" @close="emit('close')">
    <div class="pvp-modal__stats">
      <span>Рейтинг: <strong>{{ game.pvpRating }}</strong></span>
      <span>{{ PVP_RANK_LABELS[game.pvpRank] }}</span>
      <span>{{ game.pvpWins }}W / {{ game.pvpLosses }}L</span>
    </div>

    <p class="pvp-modal__hint">Выбери до 5 игрушек с поля:</p>

    <div class="pvp-modal__picker">
      <button
        v-for="toy in game.board"
        :key="toy.instanceId"
        type="button"
        class="pvp-modal__toy"
        :class="{ 'pvp-modal__toy--team': game.teamInstanceIds.includes(toy.instanceId) }"
        @click="onTeamToy(toy.instanceId)"
      >
        <ToySprite :definition-id="toy.definitionId" :level="toy.level" size="32px" />
        <span class="pvp-modal__toy-level">Lv{{ toy.level }}</span>
      </button>
      <p v-if="!game.board.length" class="pvp-modal__empty">На поле нет игрушек</p>
    </div>

    <p class="pvp-modal__team">
      Команда: {{ playerTeam.length }}/5 · Сила {{ teamPower }}
    </p>

    <button
      type="button"
      class="game-sketch-btn game-sketch-btn--red pvp-modal__btn"
      :disabled="!canBattle"
      @click="onBattle"
    >
      ⚔️ Найти противника
    </button>

    <div v-if="lastBattle" class="pvp-modal__result">
      <p>
        {{ lastBattle.winner === 'player' ? '🏆 Победа!' : '💀 Поражение' }}
        · +{{ lastBattle.coinReward }} 🪙
        · рейтинг {{ lastBattle.ratingDelta > 0 ? '+' : '' }}{{ lastBattle.ratingDelta }}
      </p>
    </div>
  </GameModal>
</template>

<style scoped>
.pvp-modal__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 800;
  opacity: 0.85;
}

.pvp-modal__hint {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 800;
  opacity: 0.7;
}

.pvp-modal__picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.pvp-modal__toy {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  cursor: pointer;
  font-size: 22px;
}

.pvp-modal__toy--team {
  border-color: #ffd54a;
  background: rgba(255, 213, 74, 0.2);
}

.pvp-modal__toy-level {
  font-size: 11px;
  font-weight: 900;
  color: #ffd54a;
}

.pvp-modal__empty {
  font-size: 12px;
  font-weight: 800;
  opacity: 0.55;
}

.pvp-modal__team {
  margin: 0 0 12px;
  font-size: 13px;
  color: #ffd54a;
  font-weight: 900;
}

.pvp-modal__btn {
  width: 100%;
}

.pvp-modal__result {
  margin-top: 12px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  font-size: 13px;
  font-weight: 800;
}
</style>
