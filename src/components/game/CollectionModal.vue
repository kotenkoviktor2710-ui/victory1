<script setup lang="ts">
import GameModal from '@/components/game/GameModal.vue'
import ToySprite from '@/components/game/ToySprite.vue'
import { getToyPreviewLevel } from '@/domain/data/toys'
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
              v-if="game.isDefinitionUnlocked(toy.id)"
              :definition-id="toy.id"
              :level="getToyPreviewLevel(toy.id)"
              size="min(118px, 22vw)"
            />
            <span
              v-else
              class="game-modal-picker__locked game-text-stroke"
              aria-hidden="true"
            >?</span>
          </div>
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
