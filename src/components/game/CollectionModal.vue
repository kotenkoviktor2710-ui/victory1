<script setup lang="ts">
import GameModal from '@/components/game/GameModal.vue'
import ToySprite from '@/components/game/ToySprite.vue'
import { formatNumber } from '@/domain/formulas/economy'
import { useGameStore } from '@/stores/gameStore'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  buy: [definitionId: string, fromRect: DOMRect]
}>()

const game = useGameStore()

function canBuy(definitionId: string): boolean {
  return game.coins >= game.getPurchaseCost(definitionId) && game.canAddToy()
}

function buy(definitionId: string, event: MouseEvent): void {
  if (!canBuy(definitionId)) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  emit('buy', definitionId, rect)
}
</script>

<template>
  <GameModal v-if="open" picker title="Коллекция" @close="emit('close')">
    <template #subtitle>
      <p class="game-modal__subtitle game-text-stroke">
        Слияний: {{ game.totalMerges }}
      </p>
    </template>

    <div class="game-modal-picker__scroll">
      <div class="game-modal-picker__grid">
        <button
          v-for="toy in game.catalog"
          :key="toy.id"
          type="button"
          class="game-modal-picker__item"
          :disabled="!canBuy(toy.id)"
          @click="buy(toy.id, $event)"
        >
          <div class="game-modal-picker__hero">
            <ToySprite
              :definition-id="toy.id"
              :level="1"
              size="clamp(64px, 12vw, 96px)"
            />
          </div>
          <span class="game-modal-picker__value game-text-stroke">
            {{ formatNumber(game.getPurchaseCost(toy.id)) }}
          </span>
        </button>
      </div>
    </div>

    <div class="game-modal-picker__actions game-modal-picker__actions--single">
      <button
        type="button"
        class="game-sketch-btn game-sketch-btn--red game-modal-picker__action game-text-stroke"
        @click="emit('close')"
      >
        Закрыть
      </button>
    </div>
  </GameModal>
</template>
