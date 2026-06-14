<script setup lang="ts">
import { watch } from 'vue'

import GameModal from '@/components/game/GameModal.vue'
import ToySprite from '@/components/game/ToySprite.vue'
import { TOY_BY_ID } from '@/domain/data/toys'
import { formatNumber, getToyStats } from '@/domain/formulas/economy'
import type { PlacedToy } from '@/domain/types/toy'
import { usePvp } from '@/composables/usePvp'
import { useGameStore } from '@/stores/gameStore'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  'start-battle': []
}>()

const game = useGameStore()
const { canBattle, lastBattle, clearBattleState } = usePvp()

function isSelected(instanceId: string): boolean {
  return game.teamInstanceIds.includes(instanceId)
}

function toyPower(toy: PlacedToy): number {
  const definition = TOY_BY_ID[toy.definitionId]
  if (!definition) return 0
  const stats = getToyStats(definition, toy.level)
  return stats.attack + stats.health
}

function onTeamToy(instanceId: string): void {
  game.toggleTeamToy(instanceId)
}

function onBattle(): void {
  emit('start-battle')
}

function onFlee(): void {
  emit('close')
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) clearBattleState()
  },
)
</script>

<template>
  <GameModal
    v-if="open"
    picker
    title="Выберите до 5 игрушек"
    @close="emit('close')"
  >
    <div v-if="game.board.length" class="pvp-modal__scroll">
      <div class="pvp-modal__grid">
        <button
          v-for="toy in game.board"
          :key="toy.instanceId"
          type="button"
          class="pvp-modal__pick"
          :class="{ 'pvp-modal__pick--selected': isSelected(toy.instanceId) }"
          @click="onTeamToy(toy.instanceId)"
        >
          <div class="pvp-modal__hero">
            <span
              class="pvp-modal__mark"
              :class="{ 'pvp-modal__mark--on': isSelected(toy.instanceId) }"
              aria-hidden="true"
            >
              <span v-if="isSelected(toy.instanceId)" class="pvp-modal__mark-icon">✓</span>
            </span>
            <ToySprite
              :definition-id="toy.definitionId"
              :level="toy.level"
              size="clamp(52px, 8.2vw, 84px)"
            />
          </div>
          <span class="pvp-modal__power game-text-stroke">{{ formatNumber(toyPower(toy)) }}</span>
        </button>
      </div>
    </div>

    <p v-else class="pvp-modal__empty">На поле нет игрушек — добавь персонажей и возвращайся в бой.</p>

    <div v-if="lastBattle" class="game-modal-result pvp-modal__result">
      <p class="pvp-modal__result-text">
        {{ lastBattle.winner === 'player' ? 'Победа!' : 'Поражение' }}
        · +{{ formatNumber(lastBattle.coinReward) }} монет
        · рейтинг {{ lastBattle.ratingDelta > 0 ? '+' : '' }}{{ lastBattle.ratingDelta }}
      </p>
    </div>

    <div class="pvp-modal__actions">
      <button
        type="button"
        class="game-sketch-btn game-sketch-btn--green pvp-modal__action game-text-stroke"
        :disabled="!canBattle"
        @click="onBattle"
      >
        Начать бой
      </button>
      <button
        type="button"
        class="game-sketch-btn game-sketch-btn--red pvp-modal__action game-text-stroke"
        @click="onFlee"
      >
        Убежать
      </button>
    </div>
  </GameModal>
</template>

<style scoped>
.pvp-modal__scroll {
  max-height: min(50dvh, 400px);
  margin-bottom: 16px;
  padding-right: 6px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #f5c518 #0f2d52;
}

.pvp-modal__scroll::-webkit-scrollbar {
  width: 14px;
}

.pvp-modal__scroll::-webkit-scrollbar-track {
  background: linear-gradient(180deg, #143052 0%, #0a1a30 100%);
  border: 2px solid var(--game-ink);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.35);
}

.pvp-modal__scroll::-webkit-scrollbar-thumb {
  border: 2px solid var(--game-ink);
  background: linear-gradient(180deg, #ffe566 0%, #f5c518 55%, #d4a017 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    1px 1px 0 rgba(0, 0, 0, 0.28);
}

.pvp-modal__scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #fff1a8 0%, #ffe566 55%, #f5c518 100%);
}

.pvp-modal__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: clamp(8px, 1.6vw, 14px);
  padding: 4px 2px 6px;
}

.pvp-modal__pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: transform 0.08s ease;
}

.pvp-modal__pick:active {
  transform: scale(0.97);
}

.pvp-modal__pick--selected .pvp-modal__hero {
  filter:
    drop-shadow(0 0 2px #fff)
    drop-shadow(0 0 8px rgba(255, 229, 102, 0.75));
}

.pvp-modal__hero {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pvp-modal__mark {
  position: absolute;
  top: -2px;
  right: -2px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(18px, 4vw, 24px);
  height: clamp(18px, 4vw, 24px);
  border: 2.5px solid var(--game-ink);
  border-radius: 50%;
  background: #fff;
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.25);
}

.pvp-modal__mark--on {
  border-color: #1f5f2d;
  background: linear-gradient(180deg, #7ee06a 0%, #4caf50 100%);
}

.pvp-modal__mark-icon {
  font-size: clamp(10px, 2.4vw, 13px);
  font-weight: var(--game-font-weight);
  line-height: 1;
  color: #fff;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
}

.pvp-modal__power {
  font-size: clamp(12px, 2.2vw, 20px);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1;
  color: #fff;
}

.pvp-modal__empty {
  margin: 0 0 16px;
  text-align: center;
  font-size: clamp(13px, 3.4vw, 15px);
  font-weight: var(--game-font-weight);
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.82);
}

.pvp-modal__result {
  margin-bottom: 12px;
}

.pvp-modal__result-text {
  margin: 0;
}

.pvp-modal__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.pvp-modal__action {
  min-height: clamp(46px, 12vw, 54px);
  border-radius: 0;
  font-size: clamp(15px, 4vw, 18px);
}
</style>
