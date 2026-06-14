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
    <p class="collection-modal__hint">
      Купи игрушки и объединяй любые две одного уровня на поле. Собрано merge: {{ game.totalMerges }}
    </p>
    <div class="collection-modal__grid">
      <button
        v-for="toy in game.catalog"
        :key="toy.id"
        type="button"
        class="collection-modal__item"
        :disabled="game.coins < game.getPurchaseCost(toy.id) || !game.canAddToy()"
        @click="buy(toy.id, $event)"
      >
        <ToySprite :definition-id="toy.id" :level="1" size="56px" />
        <span class="collection-modal__name">{{ toy.name }}</span>
        <span
          class="collection-modal__rarity"
          :style="{ color: RARITY_COLORS[toy.rarity] }"
        >
          {{ RARITY_LABELS[toy.rarity] }}
        </span>
        <span class="collection-modal__cost">🪙 {{ formatNumber(game.getPurchaseCost(toy.id)) }}</span>
      </button>
    </div>
  </GameModal>
</template>

<style scoped>
.collection-modal__hint {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 800;
  opacity: 0.7;
}

.collection-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.collection-modal__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  cursor: pointer;
  text-align: center;
}

.collection-modal__item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.collection-modal__name {
  font-size: 12px;
  font-weight: 900;
}

.collection-modal__rarity {
  font-size: 10px;
  font-weight: 800;
}

.collection-modal__cost {
  font-size: 11px;
  color: #ffd54a;
  font-weight: 900;
}
</style>
