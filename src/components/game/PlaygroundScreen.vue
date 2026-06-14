<script setup lang="ts">
import { ref } from 'vue'

import BottomActionBar from '@/components/game/BottomActionBar.vue'
import CollectionModal from '@/components/game/CollectionModal.vue'
import FloorArena from '@/components/game/FloorArena.vue'
import PvpModal from '@/components/game/PvpModal.vue'
import SideShopPanel from '@/components/game/SideShopPanel.vue'
import ToyAcquireModal from '@/components/game/ToyAcquireModal.vue'
import TopHud from '@/components/game/TopHud.vue'
import { showRewarded } from '@/ads/ads'
const arenaRef = ref<InstanceType<typeof FloorArena> | null>(null)
const showCollection = ref(false)
const showPvp = ref(false)

function onShopBuy(fromRect: DOMRect): void {
  arenaRef.value?.purchaseShopToy(fromRect)
}

function onShopGrant(fromRect: DOMRect): void {
  arenaRef.value?.grantShopAdToyWithFlight(fromRect)
}

function onCollectionBuy(definitionId: string, fromRect: DOMRect): void {
  arenaRef.value?.purchaseToy(definitionId, fromRect)
}

function onFreeToys(fromRect: DOMRect): void {
  showRewarded(() => {
    arenaRef.value?.grantRandomToyWithFlight(fromRect)
  })
}
</script>

<template>
  <div class="playground">
    <div class="playground__bg" aria-hidden="true" />
    <div class="playground__shade" aria-hidden="true" />

    <TopHud @collection="showCollection = true" @free-toys="onFreeToys" />

    <div class="playground__stage">
      <FloorArena ref="arenaRef" />
      <SideShopPanel @buy="onShopBuy" @grant="onShopGrant" />
    </div>

    <BottomActionBar @attack="showPvp = true" />

    <CollectionModal :open="showCollection" @buy="onCollectionBuy" @close="showCollection = false" />
    <PvpModal :open="showPvp" @close="showPvp = false" />
    <ToyAcquireModal />
  </div>
</template>

<style scoped>
.playground {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: #121820;
  font-weight: 900;
}

.playground__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: url('/images/bg.png') center center / cover no-repeat;
  pointer-events: none;
}

.playground__shade {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(
      180deg,
      rgba(6, 10, 20, 0.52) 0%,
      rgba(6, 10, 20, 0.1) 32%,
      rgba(6, 10, 20, 0.14) 68%,
      rgba(6, 10, 20, 0.55) 100%
    ),
    radial-gradient(ellipse 120% 90% at 50% 45%, transparent 35%, rgba(0, 0, 0, 0.28) 100%);
}

.playground__stage {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: visible;
}
</style>
