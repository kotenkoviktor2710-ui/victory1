<script setup lang="ts">
import { computed, ref } from 'vue'

import { showRewarded } from '@/ads/ads'
import ToySprite from '@/components/game/ToySprite.vue'
import { formatNumber } from '@/domain/formulas/economy'
import { assetUrl } from '@/shared/utils/assetUrl'
import { useGameStore } from '@/stores/gameStore'

const emit = defineEmits<{
  buy: [fromRect: DOMRect]
  grant: [fromRect: DOMRect]
}>()

const game = useGameStore()
const shopBtnRef = ref<HTMLButtonElement | null>(null)
const adBtnRef = ref<HTMLButtonElement | null>(null)

const shopLevel = computed(() => game.shopPurchaseLevel)
const adGrantLevel = computed(() => game.shopAdGrantLevel)

const shopCost = computed(() => game.getPurchaseCost('', shopLevel.value))

const canBuyFeatured = computed(
  () => game.canAddToy() && game.coins >= shopCost.value,
)

const canWatchAd = computed(() => game.canAddToy())

const TOY_PREVIEW_SIZE = 'clamp(94px, 24vw, 180px)'

function buyFeatured(): void {
  const rect = shopBtnRef.value?.getBoundingClientRect()
  if (!rect || !canBuyFeatured.value) return
  emit('buy', rect)
}

function onRewardedAd(): void {
  if (!canWatchAd.value) return
  showRewarded(() => {
    const rect = adBtnRef.value?.getBoundingClientRect()
    if (rect) emit('grant', rect)
  })
}
</script>

<template>
  <aside class="side-shop">
    <button
      ref="shopBtnRef"
      type="button"
      class="game-side-card"
      :disabled="!canBuyFeatured"
      @click="buyFeatured"
    >
      <div class="game-side-card__frame">
        <div class="game-side-card__ribbon game-side-card__ribbon--shop">
          <span class="game-side-card__ribbon-text game-text-stroke">{{ formatNumber(shopCost) }}</span>
          <img class="game-side-card__ribbon-icon" :src="assetUrl('images/moneta.png')" alt="" aria-hidden="true" />
        </div>
        <div class="game-side-card__stage game-side-card__stage--shop">
          <div class="game-side-card__body">
            <div class="game-side-card__toy">
              <ToySprite :level="shopLevel" :size="TOY_PREVIEW_SIZE" />
            </div>
          </div>
        </div>
      </div>
    </button>

    <button
      ref="adBtnRef"
      type="button"
      class="game-side-card"
      :disabled="!canWatchAd"
      @click="onRewardedAd"
    >
      <div class="game-side-card__frame">
        <div class="game-side-card__ribbon game-side-card__ribbon--ad">
          <span class="game-side-card__ribbon-text game-text-stroke">Реклама</span>
          <img class="game-side-card__ribbon-icon" :src="assetUrl('images/ads.png')" alt="" aria-hidden="true" />
        </div>
        <div class="game-side-card__stage game-side-card__stage--ad">
          <div class="game-side-card__body">
            <div class="game-side-card__toy">
              <ToySprite :level="adGrantLevel" :size="TOY_PREVIEW_SIZE" />
            </div>
          </div>
        </div>
      </div>
    </button>
  </aside>
</template>

<style scoped>
.side-shop {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  align-self: center;
  gap: 16px;
  padding: 8px 6px 8px 0;
  z-index: 10;
}
</style>
