<script setup lang="ts">
import GameModal from '@/components/game/GameModal.vue'
import ToySprite from '@/components/game/ToySprite.vue'
import { formatNumber } from '@/domain/formulas/economy'
import { RARITY_COLORS, RARITY_LABELS } from '@/domain/constants'
import { useGameStore } from '@/stores/gameStore'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  buy: [definitionId: string, fromRect: DOMRect]
}>()

const game = useGameStore()

function buy(definitionId: string, event: MouseEvent): void {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  emit('buy', definitionId, rect)
}
</script>

<template>
  <GameModal v-if="open" title="Коллекция" @close="emit('close')">
    <p class="game-modal-hint">
      Купи игрушки и объединяй любые две одного уровня на поле. Собрано merge: {{ game.totalMerges }}
    </p>
    <div class="collection-modal__grid">
      <button
        v-for="toy in game.catalog"
        :key="toy.id"
        type="button"
        class="game-modal-chip game-modal-chip--card"
        :disabled="game.coins < game.getPurchaseCost(toy.id) || !game.canAddToy()"
        @click="buy(toy.id, $event)"
      >
        <ToySprite :definition-id="toy.id" :level="1" size="56px" />
        <span class="game-modal-chip__meta">{{ toy.name }}</span>
        <span
          class="game-modal-chip__meta"
          :style="{ color: RARITY_COLORS[toy.rarity] }"
        >
          {{ RARITY_LABELS[toy.rarity] }}
        </span>
        <span class="game-modal-chip__accent">🪙 {{ formatNumber(game.getPurchaseCost(toy.id)) }}</span>
      </button>
    </div>
  </GameModal>
</template>

<style scoped>
.collection-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
</style>
