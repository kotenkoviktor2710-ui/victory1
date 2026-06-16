<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AdBreakModal from '@/components/game/AdBreakModal.vue'
import AdMilestoneBar from '@/components/game/AdMilestoneBar.vue'
import BottomActionBar from '@/components/game/BottomActionBar.vue'
import CollectionModal from '@/components/game/CollectionModal.vue'
import FloorArena from '@/components/game/FloorArena.vue'
import InboundAttackModal from '@/components/game/InboundAttackModal.vue'
import PvpBattleScreen from '@/components/game/PvpBattleScreen.vue'
import PvpModal from '@/components/game/PvpModal.vue'
import PvpRewardModal from '@/components/game/PvpRewardModal.vue'
import SideShopPanel from '@/components/game/SideShopPanel.vue'
import ToyAcquireModal from '@/components/game/ToyAcquireModal.vue'
import TopHud from '@/components/game/TopHud.vue'
import { useAdMilestone } from '@/composables/useAdMilestone'
import { useScheduledAdBreak } from '@/composables/useScheduledAdBreak'
import { useInboundAttack } from '@/composables/useInboundAttack'
import { useAttackCooldown } from '@/composables/useAttackCooldown'
import { usePvp } from '@/composables/usePvp'
import type { BattleSnapshot } from '@/domain/formulas/combat'
import { showRewarded } from '@/ads/ads'
import { tryShowPlatformReviewNow } from '@/yandex/reviewPrompt'
import { useGameStore } from '@/stores/gameStore'

const game = useGameStore()
const arenaRef = ref<InstanceType<typeof FloorArena> | null>(null)
const adMilestoneRef = ref<InstanceType<typeof AdMilestoneBar> | null>(null)
const showCollection = ref(false)
const showPvp = ref(false)
const battleSnapshot = ref<BattleSnapshot | null>(null)
const rewardSnapshot = ref<BattleSnapshot | null>(null)
const pvp = usePvp()
const inbound = useInboundAttack()
const {
  canAttack,
  isOnCooldown,
  cooldownLabel,
  startAttackCooldown,
  resetAttackCooldown,
} = useAttackCooldown()
const isBattleLoading = computed(() => pvp.isPreparingBattle.value)
const inboundAttack = computed(() => inbound.pendingInbound.value)
const isBattleActive = computed(() => battleSnapshot.value !== null)
const scheduledAdActive = computed(() => !isBattleActive.value)
const { countdown: adBreakCountdown } = useScheduledAdBreak(scheduledAdActive)

function onRewardMilestone(fromRect: DOMRect): void {
  const granted = arenaRef.value?.grantAdMilestoneToysWithFlight(fromRect) ?? 0
  if (granted === 0) {
    game.flushAdMilestonePendingGrants()
  }
}

useAdMilestone(
  () => adMilestoneRef.value?.getAnchorRect() ?? null,
  onRewardMilestone,
)

function onShopBuy(fromRect: DOMRect): void {
  arenaRef.value?.purchaseShopToy(fromRect)
}

function onShopGrant(fromRect: DOMRect): void {
  arenaRef.value?.grantShopAdToyWithFlight(fromRect)
}

async function onFreeToys(fromRect: DOMRect): Promise<void> {
  if (!game.canGrantFreeCharacter()) return

  const reviewed = await tryShowPlatformReviewNow()
  if (!reviewed) return

  arenaRef.value?.grantFreeCharacterWithFlight(fromRect)
}

async function onStartBattle(): Promise<void> {
  const snapshot = await pvp.prepareOutboundBattle()
  if (!snapshot) return
  startAttackCooldown()
  battleSnapshot.value = snapshot
  showPvp.value = false
}

function onAttack(): void {
  if (!canAttack.value) return
  showPvp.value = true
}

function onSkipAttackCooldown(): void {
  showRewarded(() => resetAttackCooldown())
}

function onInboundAccept(): void {
  const attack = inbound.consumeInboundAttack()
  if (!attack) return

  const snapshot = pvp.prepareInboundBattle(attack)
  if (!snapshot) return

  battleSnapshot.value = snapshot
}

function onInboundFlee(): void {
  inbound.dismissInboundAttack()
}

function onBattleFinished(): void {
  if (!battleSnapshot.value) return
  pvp.finalizeBattleStats(battleSnapshot.value)
  rewardSnapshot.value = battleSnapshot.value
  battleSnapshot.value = null
}

function onRewardClaimed(amount: number): void {
  pvp.claimBattleReward(amount)
  rewardSnapshot.value = null
  pvp.clearBattleState()
}

onMounted(() => {
  void game.syncPvpDefense()
  void inbound.checkInboundAttack()
})
</script>

<template>
  <div class="playground">
    <div v-show="!isBattleActive" class="playground__bg" aria-hidden="true" />
    <div v-show="!isBattleActive" class="playground__shade" aria-hidden="true" />

    <div v-show="!isBattleActive" class="playground__header">
      <TopHud @collection="showCollection = true" @free-toys="onFreeToys" />
    </div>

    <div v-show="!isBattleActive" class="playground__stage">
      <FloorArena ref="arenaRef" />
      <SideShopPanel @buy="onShopBuy" @grant="onShopGrant" />
    </div>

    <div v-show="!isBattleActive" class="playground__footer">
      <BottomActionBar
        :can-attack="canAttack"
        :cooldown-label="cooldownLabel"
        :show-cooldown-ad="isOnCooldown"
        @attack="onAttack"
        @skip-cooldown="onSkipAttackCooldown"
      />
      <AdMilestoneBar ref="adMilestoneRef" class="playground__ad-milestone" />
    </div>

    <CollectionModal :open="showCollection" @close="showCollection = false" />
    <PvpModal
      :open="showPvp"
      :loading="isBattleLoading"
      @close="showPvp = false"
      @start-battle="onStartBattle"
    />
    <InboundAttackModal
      v-if="inboundAttack"
      :attack="inboundAttack"
      @accept="onInboundAccept"
      @flee="onInboundFlee"
    />
    <Teleport to="body">
      <PvpBattleScreen
        v-if="battleSnapshot"
        :snapshot="battleSnapshot"
        @finished="onBattleFinished"
      />
    </Teleport>
    <PvpRewardModal
      v-if="rewardSnapshot"
      :won="rewardSnapshot.winner === 'player'"
      :base-reward="rewardSnapshot.coinReward"
      @claim="onRewardClaimed"
    />
    <ToyAcquireModal />
    <AdBreakModal v-if="adBreakCountdown !== null" :seconds-left="adBreakCountdown" />
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

.playground__header {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.playground__footer {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  overflow: visible;
  --playground-footer-pad-y: 10px;
  padding-top: var(--playground-footer-pad-y);
  padding-bottom: calc(var(--playground-footer-pad-y) + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

.playground__footer :deep(.bottom-bar) {
  flex: 1;
  width: 100%;
  min-height: var(--bottom-bar-row-height, clamp(56px, 15vw, 72px));
  height: var(--bottom-bar-row-height, clamp(56px, 15vw, 72px));
  max-height: var(--bottom-bar-row-height, clamp(56px, 15vw, 72px));
}

.playground__stage {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: visible;
}

.playground__ad-milestone {
  position: absolute;
  right: clamp(10px, 3vw, 18px);
  top: var(--playground-footer-pad-y, 10px);
  bottom: calc(var(--playground-footer-pad-y, 10px) + env(safe-area-inset-bottom, 0px));
  left: auto;
  z-index: 11;
  display: flex;
  align-items: center;
  width: min(62vw, 360px);
  height: auto;
  overflow: visible;
  pointer-events: none;
}
</style>
