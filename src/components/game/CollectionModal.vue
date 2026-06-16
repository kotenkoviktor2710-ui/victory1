<script setup lang="ts">
import GameModal from '@/components/game/GameModal.vue'
import ToySprite from '@/components/game/ToySprite.vue'
import { useI18n } from '@/i18n'
import { MAX_TOY_LEVEL } from '@/domain/types/toy'
import { useGameStore } from '@/stores/gameStore'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const game = useGameStore()
const { t } = useI18n()

const collectionLevels = Array.from({ length: MAX_TOY_LEVEL }, (_, index) => index + 1)
const COLLECTION_CARD_TONES = 12

function cardTone(level: number): number {
  return (level - 1) % COLLECTION_CARD_TONES
}
</script>

<template>
  <GameModal v-if="open" picker :title="t('collection.title')" @close="emit('close')">
    <div class="game-modal-picker__scroll">
      <div class="collection-grid">
        <div
          v-for="level in collectionLevels"
          :key="level"
          class="collection-card"
          :class="[
            `collection-card--tone-${cardTone(level)}`,
            { 'collection-card--locked': !game.isLevelUnlocked(level) },
          ]"
        >
          <div class="collection-card__frame">
            <div class="collection-card__stage">
              <ToySprite
                v-if="game.isLevelUnlocked(level)"
                :level="level"
                size="min(88px, 17vw)"
              />
              <span
                v-else
                class="collection-card__locked game-text-stroke"
                aria-hidden="true"
              >?</span>
            </div>
            <span class="collection-card__level game-text-stroke">{{ level }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="game-modal-picker__actions game-modal-picker__actions--single">
      <button
        type="button"
        class="game-sketch-btn game-sketch-btn--red game-modal-picker__action game-text-stroke"
        @click="emit('close')"
      >
        {{ t('modal.close') }}
      </button>
    </div>
  </GameModal>
</template>

<style scoped>
.collection-grid {
  display: grid;
  grid-template-columns: repeat(var(--game-modal-grid-cols, 4), minmax(0, 1fr));
  gap: clamp(8px, 2vw, 12px);
  padding: 4px 2px 6px;
}

.collection-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.collection-card__frame {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: clamp(4px, 1vw, 6px);
  border: 3px solid var(--game-ink);
  background: #fff;
  box-shadow: var(--game-shadow);
  overflow: hidden;
}

.collection-card__frame::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.34) 0%,
    transparent 22%,
    transparent 78%,
    rgba(0, 0, 0, 0.1) 100%
  );
}

.collection-card__stage {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  overflow: hidden;
  border: 2px solid rgba(26, 18, 8, 0.55);
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.28);
}

.collection-card__stage :deep(.toy-sprite__img) {
  filter: drop-shadow(1px 3px 3px rgba(0, 0, 0, 0.38));
}

.collection-card__locked {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: min(88px, 17vw);
  height: min(88px, 17vw);
  font-size: clamp(44px, 12vw, 68px);
  line-height: 1;
  color: rgba(255, 255, 255, 0.92);
}

.collection-card__level {
  position: relative;
  z-index: 3;
  margin-top: clamp(4px, 1vw, 6px);
  padding: clamp(3px, 0.8vw, 5px) 6px;
  border: 2px solid var(--game-blue-deep);
  background: var(--game-panel-texture) center center / cover no-repeat;
  font-size: clamp(13px, 3.2vw, 17px);
  line-height: 1;
  text-align: center;
  color: #fff;
  box-shadow: var(--game-shadow-inset);
}

.collection-card--locked .collection-card__stage {
  filter: saturate(0.2) brightness(0.72);
}

.collection-card--locked .collection-card__level {
  opacity: 0.72;
}

.collection-card--tone-0 .collection-card__stage {
  background: linear-gradient(160deg, #90caf9 0%, #1e88e5 52%, #0d47a1 100%);
}

.collection-card--tone-1 .collection-card__stage {
  background: linear-gradient(160deg, #ce93d8 0%, #8e24aa 52%, #4a148c 100%);
}

.collection-card--tone-2 .collection-card__stage {
  background: linear-gradient(160deg, #f48fb1 0%, #e91e63 52%, #880e4f 100%);
}

.collection-card--tone-3 .collection-card__stage {
  background: linear-gradient(160deg, #ffcc80 0%, #fb8c00 52%, #e65100 100%);
}

.collection-card--tone-4 .collection-card__stage {
  background: linear-gradient(160deg, #a5d6a7 0%, #43a047 52%, #1b5e20 100%);
}

.collection-card--tone-5 .collection-card__stage {
  background: linear-gradient(160deg, #80deea 0%, #00acc1 52%, #006064 100%);
}

.collection-card--tone-6 .collection-card__stage {
  background: linear-gradient(160deg, #ffe082 0%, #ffb300 52%, #ff6f00 100%);
}

.collection-card--tone-7 .collection-card__stage {
  background: linear-gradient(160deg, #ef9a9a 0%, #e53935 52%, #b71c1c 100%);
}

.collection-card--tone-8 .collection-card__stage {
  background: linear-gradient(160deg, #b39ddb 0%, #5e35b1 52%, #311b92 100%);
}

.collection-card--tone-9 .collection-card__stage {
  background: linear-gradient(160deg, #80cbc4 0%, #00897b 52%, #004d40 100%);
}

.collection-card--tone-10 .collection-card__stage {
  background: linear-gradient(160deg, #ffab91 0%, #ff5722 52%, #bf360c 100%);
}

.collection-card--tone-11 .collection-card__stage {
  background: linear-gradient(160deg, #9fa8da 0%, #3949ab 52%, #1a237e 100%);
}
</style>
