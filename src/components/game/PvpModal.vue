<script setup lang="ts">
import { watch } from 'vue'

import GameModal from '@/components/game/GameModal.vue'
import ToySprite from '@/components/game/ToySprite.vue'
import { TOY_BY_ID } from '@/domain/data/toys'
import { formatNumber, getToyStats } from '@/domain/formulas/economy'
import type { PlacedToy } from '@/domain/types/toy'
import { usePvp } from '@/composables/usePvp'
import { useI18n } from '@/i18n'
import { useGameStore } from '@/stores/gameStore'

const props = defineProps<{
  open: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  'start-battle': []
}>()

const game = useGameStore()
const { t } = useI18n()
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
  if (!canBattle.value || props.loading) return
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
    :title="t('pvp.selectTeam')"
    @close="emit('close')"
  >
    <template #subtitle>
      <p class="game-modal__subtitle game-text-stroke">
        {{ t('pvp.selected', { count: game.teamInstanceIds.length }) }}
      </p>
    </template>

    <div v-if="game.board.length" class="game-modal-picker__scroll">
      <div class="game-modal-picker__grid">
        <button
          v-for="toy in game.board"
          :key="toy.instanceId"
          type="button"
          class="game-modal-picker__item"
          :class="{ 'game-modal-picker__item--selected': isSelected(toy.instanceId) }"
          @click="onTeamToy(toy.instanceId)"
        >
          <div class="game-modal-picker__hero">
            <span
              class="game-modal-picker__mark"
              :class="{ 'game-modal-picker__mark--on': isSelected(toy.instanceId) }"
              aria-hidden="true"
            >
              <span v-if="isSelected(toy.instanceId)" class="game-modal-picker__mark-icon">✓</span>
            </span>
            <ToySprite
              :definition-id="toy.definitionId"
              :level="toy.level"
              size="min(118px, 22vw)"
            />
          </div>
          <span class="game-modal-picker__value game-text-stroke">{{ formatNumber(toyPower(toy)) }}</span>
        </button>
      </div>
    </div>

    <p v-else class="game-modal-picker__empty">{{ t('pvp.emptyBoard') }}</p>

    <div v-if="lastBattle" class="game-modal-result">
      <p class="pvp-modal__result-text">
        {{ lastBattle.winner === 'player' ? t('pvp.victory') : t('pvp.defeat') }}
        · {{ t('pvp.coinsReward', { amount: formatNumber(lastBattle.coinReward) }) }}
        · {{ t('pvp.rating', { delta: `${lastBattle.ratingDelta > 0 ? '+' : ''}${lastBattle.ratingDelta}` }) }}
      </p>
    </div>

    <div class="game-modal-picker__actions">
      <button
        type="button"
        class="game-sketch-btn game-sketch-btn--green game-modal-picker__action game-text-stroke"
        :disabled="!canBattle || loading"
        @click="onBattle"
      >
        {{ loading ? t('pvp.searching') : t('pvp.startBattle') }}
      </button>
      <button
        type="button"
        class="game-sketch-btn game-sketch-btn--red game-modal-picker__action game-text-stroke"
        @click="onFlee"
      >
        {{ t('pvp.flee') }}
      </button>
    </div>
  </GameModal>
</template>

<style scoped>
.pvp-modal__result-text {
  margin: 0;
}
</style>
