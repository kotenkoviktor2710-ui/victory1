<script setup lang="ts">
import { computed, onUnmounted, ref, type ComponentPublicInstance } from 'vue'

import { clientToFieldPercent } from '@/domain/field'
import type { PlacedToy } from '@/domain/types/toy'
import { getToyImageByLevel } from '@/domain/data/toyImages'
import { formatNumber } from '@/domain/formulas/economy'
import { COMBO_LEVEL_COLORS } from '@/domain/types/game'
import { useClicker } from '@/composables/useClicker'
import { useMergeDrag } from '@/composables/useMergeDrag'
import { usePurchaseFlight } from '@/composables/usePurchaseFlight'
import { useGameStore } from '@/stores/gameStore'
import HitSpark from '@/components/game/HitSpark.vue'
import LottieEffect from '@/components/game/LottieEffect.vue'
import ToySprite from '@/components/game/ToySprite.vue'

const game = useGameStore()
const { floatingCoins } = useClicker()

const TAP_BURST_MS = 520
const TAP_REACT_MS = 480
const MERGE_EFFECT = '/images/effects/circle.json'
const MERGE_EFFECT_MS = 1400

interface TapBurst {
  id: number
  x: number
  y: number
  rotation: number
}

interface MergeBurst {
  id: number
  x: number
  y: number
}

const tapBursts = ref<TapBurst[]>([])
const mergeBursts = ref<MergeBurst[]>([])
let tapBurstId = 0
let mergeBurstId = 0

const fieldRef = ref<HTMLElement | null>(null)

const LANDING_MS = 520
const landingToyIds = ref<Record<string, true>>({})
const landingTimers = new Map<string, number>()
const tapReactingIds = ref<Record<string, true>>({})
const tapReactTimers = new Map<string, number>()

const { flights, launch } = usePurchaseFlight((toy) => {
  markToyLanding(toy.instanceId)
  game.finalizePurchase(toy)
})

const {
  dragFromId,
  isDragging,
  ghost,
  lastMergedId,
  setToyRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
} = useMergeDrag({
  canMerge: (fromId, toId) => game.canMergeToys(fromId, toId),
  onMerge: (fromId, toId) => {
    const target = game.board.find((toy) => toy.instanceId === toId)
    const fieldRect = fieldRef.value?.getBoundingClientRect()
    const mergedId = game.mergeToys(fromId, toId)
    if (mergedId && target && fieldRect) {
      spawnMergeBurst(
        fieldRect.left + (target.x / 100) * fieldRect.width,
        fieldRect.top + (target.y / 100) * fieldRect.height,
      )
    }
    return mergedId
  },
  onMove: (fromId, clientX, clientY) => {
    const rect = fieldRef.value?.getBoundingClientRect()
    if (!rect) return
    const pos = clientToFieldPercent(clientX, clientY, rect)
    game.moveToy(fromId, pos.x, pos.y)
  },
})

const flightHiddenIds = computed(() => {
  const ids = new Set<string>()
  for (const active of flights.value) ids.add(active.toy.instanceId)
  return ids
})

function isToyDragging(instanceId: string): boolean {
  return dragFromId.value === instanceId && isDragging.value
}

function isToyHidden(instanceId: string): boolean {
  return flightHiddenIds.value.has(instanceId)
}

const FIELD_TOY_SIZE = 'clamp(140px, 36vw, 220px)'

function wobbleDelay(instanceId: string): number {
  let hash = 0
  for (let i = 0; i < instanceId.length; i += 1) {
    hash = (hash + instanceId.charCodeAt(i) * 13) % 100
  }
  return (hash / 100) * 2.4
}

function isToyLanding(instanceId: string): boolean {
  return landingToyIds.value[instanceId] === true
}

function markToyLanding(instanceId: string): void {
  const prev = landingTimers.get(instanceId)
  if (prev != null) window.clearTimeout(prev)

  landingToyIds.value = { ...landingToyIds.value, [instanceId]: true }
  const timer = window.setTimeout(() => {
    landingTimers.delete(instanceId)
    const next = { ...landingToyIds.value }
    delete next[instanceId]
    landingToyIds.value = next
  }, LANDING_MS)
  landingTimers.set(instanceId, timer)
}

function isToyIdle(instanceId: string): boolean {
  return (
    !flightHiddenIds.value.has(instanceId) &&
    !isToyLanding(instanceId) &&
    lastMergedId.value !== instanceId
  )
}

function launchToy(toy: PlacedToy, fromRect: DOMRect, fieldRect: DOMRect): void {
  launch(toy, fromRect, fieldRect)
}

function bindToyRef(el: Element | ComponentPublicInstance | null, instanceId: string): void {
  const node = el instanceof Element ? el : (el?.$el as Element | undefined)
  setToyRef(node ?? null, instanceId)
}

function onToyPointerDown(toy: (typeof game.board)[number], event: PointerEvent): void {
  onPointerDown(toy.instanceId, event, getToyImageByLevel(toy.level), toy.level)
}

function onFieldPointerUp(event: PointerEvent): void {
  if (onPointerUp(event)) event.stopPropagation()
}

function onToyPointerUp(toy: (typeof game.board)[number], event: PointerEvent): void {
  const consumed = onPointerUp(event)
  if (consumed) {
    event.stopPropagation()
    return
  }
  game.registerToyClick(toy.instanceId, event.clientX, event.clientY)
  triggerToyTapReact(toy.instanceId)
  spawnTapBurst(event.clientX, event.clientY)
  event.stopPropagation()
}

function triggerToyTapReact(instanceId: string): void {
  const prev = tapReactTimers.get(instanceId)
  if (prev != null) window.clearTimeout(prev)

  if (tapReactingIds.value[instanceId]) {
    const next = { ...tapReactingIds.value }
    delete next[instanceId]
    tapReactingIds.value = next
    requestAnimationFrame(() => {
      tapReactingIds.value = { ...tapReactingIds.value, [instanceId]: true }
      scheduleTapReactEnd(instanceId)
    })
    return
  }

  tapReactingIds.value = { ...tapReactingIds.value, [instanceId]: true }
  scheduleTapReactEnd(instanceId)
}

function scheduleTapReactEnd(instanceId: string): void {
  const timer = window.setTimeout(() => {
    tapReactTimers.delete(instanceId)
    const next = { ...tapReactingIds.value }
    delete next[instanceId]
    tapReactingIds.value = next
  }, TAP_REACT_MS)
  tapReactTimers.set(instanceId, timer)
}

function isToyTapReacting(instanceId: string): boolean {
  return tapReactingIds.value[instanceId] === true
}

const TAP_BURST_OFFSET_Y = 0

function spawnTapBurst(x: number, y: number): void {
  tapBurstId += 1
  const id = tapBurstId
  tapBursts.value.push({
    id,
    x,
    y: y + TAP_BURST_OFFSET_Y,
    rotation: Math.random() * 360,
  })
  window.setTimeout(() => removeTapBurst(id), TAP_BURST_MS)
}

function removeTapBurst(id: number): void {
  tapBursts.value = tapBursts.value.filter((burst) => burst.id !== id)
}

function spawnMergeBurst(x: number, y: number): void {
  mergeBurstId += 1
  const id = mergeBurstId
  mergeBursts.value.push({ id, x, y })
  window.setTimeout(() => removeMergeBurst(id), MERGE_EFFECT_MS)
}

function removeMergeBurst(id: number): void {
  mergeBursts.value = mergeBursts.value.filter((burst) => burst.id !== id)
}

function purchaseToy(definitionId: string, fromRect: DOMRect): boolean {
  const pending = game.beginPurchase(definitionId)
  const fieldRect = fieldRef.value?.getBoundingClientRect()
  if (!pending || !fieldRect) return false
  launchToy(pending.toy, fromRect, fieldRect)
  return true
}

function purchaseShopToy(fromRect: DOMRect): boolean {
  const pending = game.beginShopPurchase()
  const fieldRect = fieldRef.value?.getBoundingClientRect()
  if (!pending || !fieldRect) return false
  launchToy(pending.toy, fromRect, fieldRect)
  return true
}

function grantToyWithFlight(definitionId: string, fromRect: DOMRect, level = 1): boolean {
  const pending = game.beginGrant(definitionId, level)
  const fieldRect = fieldRef.value?.getBoundingClientRect()
  if (!pending || !fieldRect) return false
  launchToy(pending.toy, fromRect, fieldRect)
  return true
}

function grantShopAdToyWithFlight(fromRect: DOMRect): boolean {
  const pending = game.beginShopAdGrant()
  const fieldRect = fieldRef.value?.getBoundingClientRect()
  if (!pending || !fieldRect) return false
  launchToy(pending.toy, fromRect, fieldRect)
  return true
}

function grantRandomToyWithFlight(fromRect: DOMRect): boolean {
  const pending = game.grantRandomCommonToy()
  const fieldRect = fieldRef.value?.getBoundingClientRect()
  if (!pending || !fieldRect) return false
  launchToy(pending.toy, fromRect, fieldRect)
  return true
}

onUnmounted(() => {
  for (const timer of landingTimers.values()) window.clearTimeout(timer)
  landingTimers.clear()
  for (const timer of tapReactTimers.values()) window.clearTimeout(timer)
  tapReactTimers.clear()
})

defineExpose({ purchaseToy, purchaseShopToy, grantToyWithFlight, grantRandomToyWithFlight, grantShopAdToyWithFlight })
</script>

<template>
  <section class="floor-arena">
    <div
      ref="fieldRef"
      class="floor-arena__field"
      @pointermove="onPointerMove"
      @pointerup="onFieldPointerUp"
      @pointercancel="onPointerCancel"
    >
      <button
        v-for="toy in game.board"
        :key="toy.instanceId"
        :ref="(el) => bindToyRef(el, toy.instanceId)"
        :data-toy-id="toy.instanceId"
        type="button"
        class="floor-arena__toy"
        :class="{
          'floor-arena__toy--hidden': isToyHidden(toy.instanceId),
          'floor-arena__toy--dragging': isToyDragging(toy.instanceId),
          'floor-arena__toy--idle': isToyIdle(toy.instanceId),
          'floor-arena__toy--landing': isToyLanding(toy.instanceId),
          'floor-arena__toy--tap': isToyTapReacting(toy.instanceId),
          'floor-arena__toy--merged': lastMergedId === toy.instanceId,
          'floor-arena__toy--team': game.teamInstanceIds.includes(toy.instanceId),
        }"
        :style="{
          left: `${toy.x}%`,
          top: `${toy.y}%`,
          '--toy-scale': 1,
          '--wobble-delay': `${wobbleDelay(toy.instanceId)}s`,
        }"
        @pointerdown="onToyPointerDown(toy, $event)"
        @pointerup="onToyPointerUp(toy, $event)"
      >
        <ToySprite
          :definition-id="toy.definitionId"
          :level="toy.level"
          :size="FIELD_TOY_SIZE"
        />
      </button>
    </div>

    <div
      v-for="active in flights"
      :key="active.id"
      class="floor-arena__flight"
      :style="{
        left: `${active.x}px`,
        top: `${active.y}px`,
        transform: `translate(-50%, -50%) scale(${active.scale})`,
      }"
    >
      <ToySprite :level="active.toy.level" :size="FIELD_TOY_SIZE" />
    </div>

    <div
      v-if="ghost && isDragging"
      class="floor-arena__ghost"
      :style="{
        left: `${ghost.x}px`,
        top: `${ghost.y}px`,
        transform: `translate(-50%, -50%)`,
      }"
    >
      <ToySprite :level="ghost.level" :size="FIELD_TOY_SIZE" />
    </div>

    <div class="floor-arena__merge-bursts">
      <div
        v-for="burst in mergeBursts"
        :key="burst.id"
        class="floor-arena__merge-burst"
        :style="{ left: `${burst.x}px`, top: `${burst.y}px` }"
      >
        <LottieEffect
          :path="MERGE_EFFECT"
          :loop="false"
          @complete="removeMergeBurst(burst.id)"
        />
      </div>
    </div>

    <div class="floor-arena__tap-bursts">
      <div
        v-for="burst in tapBursts"
        :key="burst.id"
        class="floor-arena__tap-burst"
        :style="{ left: `${burst.x}px`, top: `${burst.y}px` }"
      >
        <HitSpark :rotation="burst.rotation" @complete="removeTapBurst(burst.id)" />
      </div>
    </div>

    <div class="floor-arena__floats">
      <span
        v-for="coin in floatingCoins"
        :key="coin.id"
        class="floor-arena__float"
        :style="{
          left: `${coin.x + coin.driftX}px`,
          top: `${coin.y}px`,
          color: COMBO_LEVEL_COLORS[coin.comboLevel] ?? COMBO_LEVEL_COLORS[0],
        }"
      >
        +{{ formatNumber(coin.amount) }}
      </span>
    </div>
  </section>
</template>

<style scoped>
.floor-arena {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: visible;
  touch-action: none;
}

.floor-arena__field {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: visible;
}

.floor-arena__toy {
  position: absolute;
  transform: translate(-50%, -50%) scale(var(--toy-scale, 1));
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  outline: none;
  background: transparent;
  cursor: grab;
  padding: 0;
  touch-action: none;
}

.floor-arena__toy--hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}

.floor-arena__toy--dragging {
  opacity: 0.34;
  pointer-events: none;
  transition: opacity 0.16s ease;
}

.floor-arena__toy--dragging :deep(.toy-sprite__img) {
  filter: grayscale(0.12);
}

.floor-arena__toy--landing {
  pointer-events: none;
}

.floor-arena__toy--landing :deep(.toy-sprite__img) {
  animation: none;
  transform: rotate(0deg) translateY(0);
}

.floor-arena__toy--idle :deep(.toy-sprite__img) {
  animation: toy-idle-wobble 3.2s ease-in-out infinite;
  animation-delay: var(--wobble-delay, 0s);
  transform-origin: 50% 88%;
}

.floor-arena__toy--tap :deep(.toy-sprite__img) {
  animation: toy-tap-bounce 0.48s cubic-bezier(0.34, 1.45, 0.64, 1) forwards;
  transform-origin: 50% 88%;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.18));
}

.floor-arena__toy--dragging.floor-arena__toy--idle :deep(.toy-sprite__img) {
  animation-play-state: paused;
}

.floor-arena__toy--merged :deep(.toy-sprite__img) {
  animation: merge-pop 0.52s ease;
  transform-origin: center center;
}

.floor-arena__toy--team::after {
  content: '⚔';
  position: absolute;
  top: -4px;
  right: -8px;
  font-size: 11px;
}

.floor-arena__flight,
.floor-arena__ghost {
  position: fixed;
  z-index: 120;
  pointer-events: none;
}

.floor-arena__ghost {
  opacity: 0.78;
  transition: opacity 0.16s ease;
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.22));
}

.floor-arena__merge-bursts {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 49;
}

.floor-arena__merge-burst {
  position: fixed;
  width: clamp(220px, 58vw, 380px);
  height: clamp(110px, 29vw, 190px);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.floor-arena__tap-bursts {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 48;
}

.floor-arena__tap-burst {
  position: fixed;
  width: clamp(84px, 22vw, 140px);
  height: clamp(84px, 22vw, 140px);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.floor-arena__floats {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}

.floor-arena__float {
  position: fixed;
  z-index: 50;
  font-size: clamp(26px, 6.8vw, 42px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
  pointer-events: none;
  -webkit-text-stroke: 2.5px #1a1208;
  paint-order: stroke fill;
  text-shadow:
    2px 2px 0 #1a1208,
    1px 1px 0 #1a1208,
    0 0 2px #1a1208;
  animation: income-float 0.95s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes income-float {
  0% {
    opacity: 0;
    transform: translate(-50%, -68%) scale(0.7);
  }
  12% {
    opacity: 1;
    transform: translate(-50%, -82%) scale(1.12);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, calc(-82% - 96px)) scale(1);
  }
}

@keyframes toy-idle-wobble {
  0%,
  100% {
    transform: rotate(0deg) translateY(0);
  }
  50% {
    transform: rotate(2.5deg) translateY(-3px);
  }
}

@keyframes toy-tap-bounce {
  0% {
    transform: scale(1) translateY(0) rotate(0deg);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12));
  }
  14% {
    transform: scale(1.16, 0.8) translateY(6px) rotate(-4deg);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12));
  }
  32% {
    transform: scale(0.9, 1.14) translateY(-16px) rotate(5deg);
    filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.22));
  }
  52% {
    transform: scale(1.08, 0.92) translateY(-7px) rotate(-2.5deg);
    filter: drop-shadow(0 7px 10px rgba(0, 0, 0, 0.18));
  }
  72% {
    transform: scale(0.97, 1.04) translateY(-2px) rotate(1.5deg);
    filter: drop-shadow(0 4px 7px rgba(0, 0, 0, 0.14));
  }
  100% {
    transform: scale(1) translateY(0) rotate(0deg);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12));
  }
}

@keyframes merge-pop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
