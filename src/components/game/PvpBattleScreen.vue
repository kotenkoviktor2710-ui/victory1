<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, type ComponentPublicInstance } from 'vue'

import BattleFighterCard from '@/components/game/BattleFighterCard.vue'
import type { BattleSnapshot } from '@/domain/formulas/combat'
import { useBattlePlayback } from '@/composables/useBattlePlayback'
import { assetUrl } from '@/shared/utils/assetUrl'

const BATTLE_TOY_SIZE = 'var(--game-battle-toy-size, clamp(120px, 22vmin, 210px))'
const VERTICAL_FIGHTER_LIMIT = 3
/** sword.png: рукоять сверху, остриё снизу — выравниваем остриём по вектору полёта */
const SWORD_FLIGHT_OFFSET_DEG = -90
const battleBg = assetUrl('images/fight.png')
const battleSword = assetUrl('images/sword.png')

const props = defineProps<{
  snapshot: BattleSnapshot
}>()

const emit = defineEmits<{
  finished: []
}>()

const {
  activeAttackerIds,
  activeTargetIds,
  hitTargetIds,
  flyingProjectiles,
  damageFloats,
  hitWords,
  phase,
  healthPercent,
  isAlive,
  start,
} = useBattlePlayback(props.snapshot)

const arenaRef = ref<HTMLElement | null>(null)
const fighterAnchors = ref<Record<string, Element | null>>({})

interface ProjectilePoint {
  x: number
  y: number
}

interface ProjectileVisual {
  id: number
  isCrit: boolean
  from: ProjectilePoint
  to: ProjectilePoint
  angle: number
  beamAngle: number
  distance: number
  trailLength: number
}

const projectileVisuals = ref<ProjectileVisual[]>([])

const playerRoster = computed(() => props.snapshot.playerRoster)
const enemyRoster = computed(() => props.snapshot.enemyRoster)

function formationSlotClass(index: number): string {
  if (index < VERTICAL_FIGHTER_LIMIT) {
    return `battle-screen__formation-slot--main-${index + 1}`
  }
  return `battle-screen__formation-slot--between-${index - VERTICAL_FIGHTER_LIMIT + 1}`
}

function setFighterRef(unitId: string, el: Element | ComponentPublicInstance | null): void {
  fighterAnchors.value[unitId] = el instanceof Element ? el : null
}

function anchorCenter(unitId: string): ProjectilePoint | null {
  const arena = arenaRef.value
  const node = fighterAnchors.value[unitId]
  if (!arena || !node) return null

  const sprite = node.querySelector('.battle-fighter__sprite-wrap')
  const anchor = sprite ?? node
  const arenaRect = arena.getBoundingClientRect()
  const nodeRect = anchor.getBoundingClientRect()
  return {
    x: nodeRect.left + nodeRect.width / 2 - arenaRect.left,
    y: nodeRect.top + nodeRect.height * 0.45 - arenaRect.top,
  }
}

async function updateProjectileVisuals(): Promise<void> {
  const projectiles = flyingProjectiles.value
  if (projectiles.length === 0) {
    projectileVisuals.value = []
    return
  }

  await nextTick()
  const visuals: ProjectileVisual[] = []

  for (const projectile of projectiles) {
    const from = anchorCenter(projectile.attackerId)
    const to = anchorCenter(projectile.targetId)
    if (!from || !to) continue

    const dx = to.x - from.x
    const dy = to.y - from.y
    const distance = Math.hypot(dx, dy)
    const flightAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI

    visuals.push({
      id: projectile.id,
      isCrit: projectile.isCrit,
      from,
      to,
      angle: flightAngleDeg + SWORD_FLIGHT_OFFSET_DEG,
      beamAngle: flightAngleDeg,
      distance,
      trailLength: Math.min(distance * 0.42, 132),
    })
  }

  projectileVisuals.value = visuals
}

watch(flyingProjectiles, () => {
  void updateProjectileVisuals()
}, { deep: true })

function damagesFor(unitId: string) {
  return damageFloats.value.filter((entry) => entry.unitId === unitId)
}

function hitWordsFor(unitId: string) {
  return hitWords.value.filter((entry) => entry.unitId === unitId)
}

function fighterClass(unitId: string, side: 'player' | 'enemy'): Record<string, boolean> {
  return {
    'battle-fighter--attacking': activeAttackerIds.value.includes(unitId),
    'battle-fighter--target': activeTargetIds.value.includes(unitId),
    'battle-fighter--hit': hitTargetIds.value.includes(unitId),
    'battle-fighter--down': !isAlive(unitId),
    'battle-fighter--player': side === 'player',
    'battle-fighter--enemy': side === 'enemy',
  }
}

watch(phase, (value) => {
  if (value === 'done') emit('finished')
})

onMounted(() => {
  start()
})
</script>

<template>
  <div class="battle-screen">
    <div class="battle-screen__bg" :style="{ backgroundImage: `url(${battleBg})` }" aria-hidden="true" />
    <div class="battle-screen__shade" aria-hidden="true" />

    <div ref="arenaRef" class="battle-screen__arena">
      <section class="battle-screen__team battle-screen__team--player">
        <div class="battle-screen__formation">
          <div
            v-for="(entry, index) in playerRoster"
            :key="entry.unitId"
            :ref="(el) => setFighterRef(entry.unitId, el)"
            class="battle-screen__formation-slot"
            :class="formationSlotClass(index)"
          >
            <BattleFighterCard
              :entry="entry"
              side="player"
              :toy-size="BATTLE_TOY_SIZE"
              :health-percent="healthPercent(entry.unitId)"
              :damages="damagesFor(entry.unitId)"
              :hit-words="hitWordsFor(entry.unitId)"
              :fighter-class="fighterClass(entry.unitId, 'player')"
            />
          </div>
        </div>
      </section>

      <section class="battle-screen__team battle-screen__team--enemy">
        <div class="battle-screen__formation">
          <div
            v-for="(entry, index) in enemyRoster"
            :key="entry.unitId"
            :ref="(el) => setFighterRef(entry.unitId, el)"
            class="battle-screen__formation-slot"
            :class="formationSlotClass(index)"
          >
            <BattleFighterCard
              :entry="entry"
              side="enemy"
              :toy-size="BATTLE_TOY_SIZE"
              :health-percent="healthPercent(entry.unitId)"
              :damages="damagesFor(entry.unitId)"
              :hit-words="hitWordsFor(entry.unitId)"
              :fighter-class="fighterClass(entry.unitId, 'enemy')"
            />
          </div>
        </div>
      </section>

      <div
        v-for="visual in projectileVisuals"
        :key="visual.id"
        class="battle-screen__projectile-group"
        aria-hidden="true"
      >
        <span
          class="battle-screen__projectile-trail-glow"
          :class="{ 'battle-screen__projectile-trail-glow--crit': visual.isCrit }"
          :style="{
            '--from-x': `${visual.from.x}px`,
            '--from-y': `${visual.from.y}px`,
            '--to-x': `${visual.to.x}px`,
            '--to-y': `${visual.to.y}px`,
            '--trail-length': `${visual.trailLength}px`,
            '--beam-angle': `${visual.beamAngle}deg`,
          }"
        />
        <span
          class="battle-screen__projectile-trail"
          :class="{ 'battle-screen__projectile-trail--crit': visual.isCrit }"
          :style="{
            '--from-x': `${visual.from.x}px`,
            '--from-y': `${visual.from.y}px`,
            '--to-x': `${visual.to.x}px`,
            '--to-y': `${visual.to.y}px`,
            '--trail-length': `${visual.trailLength}px`,
            '--beam-angle': `${visual.beamAngle}deg`,
          }"
        />
        <span
          class="battle-screen__projectile-glow"
          :class="{ 'battle-screen__projectile-glow--crit': visual.isCrit }"
          :style="{
            '--from-x': `${visual.from.x}px`,
            '--from-y': `${visual.from.y}px`,
            '--to-x': `${visual.to.x}px`,
            '--to-y': `${visual.to.y}px`,
          }"
        />
        <span
          class="battle-screen__projectile"
          :class="{ 'battle-screen__projectile--crit': visual.isCrit }"
          :style="{
            '--from-x': `${visual.from.x}px`,
            '--from-y': `${visual.from.y}px`,
            '--to-x': `${visual.to.x}px`,
            '--to-y': `${visual.to.y}px`,
            '--projectile-angle': `${visual.angle}deg`,
            backgroundImage: `url('${battleSword}')`,
          }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.battle-screen {
  position: fixed;
  inset: 0;
  z-index: 500;
  overflow: hidden;
  font-weight: var(--game-font-weight);
  background: #120c1c;
}

.battle-screen__bg {
  position: absolute;
  inset: 0;
  background-color: #120c1c;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

.battle-screen__shade {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 90% 70% at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.35) 100%),
    linear-gradient(180deg, rgba(8, 12, 24, 0.15) 0%, rgba(8, 12, 24, 0.45) 100%);
}

.battle-screen__arena {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(8px, 2vw, 18px);
  height: 100%;
  padding:
    calc(12px + env(safe-area-inset-top, 0px))
    clamp(10px, 3vw, 24px)
    calc(16px + env(safe-area-inset-bottom, 0px));
  overflow: hidden;
}

.battle-screen__team {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  min-height: 0;
}

.battle-screen__team--enemy {
  justify-content: flex-end;
}

.battle-screen__formation {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: repeat(6, auto);
  column-gap: clamp(10px, 2.4vw, 18px);
  align-items: center;
  justify-items: center;
}

.battle-screen__formation-slot {
  display: flex;
}

.battle-screen__team--player .battle-screen__formation-slot--main-1 {
  grid-column: 1;
  grid-row: 1 / 3;
}

.battle-screen__team--player .battle-screen__formation-slot--main-2 {
  grid-column: 1;
  grid-row: 3 / 5;
}

.battle-screen__team--player .battle-screen__formation-slot--main-3 {
  grid-column: 1;
  grid-row: 5 / 7;
}

.battle-screen__team--player .battle-screen__formation-slot--between-1 {
  grid-column: 2;
  grid-row: 2 / 4;
}

.battle-screen__team--player .battle-screen__formation-slot--between-2 {
  grid-column: 2;
  grid-row: 4 / 6;
}

.battle-screen__team--enemy .battle-screen__formation-slot--main-1 {
  grid-column: 2;
  grid-row: 1 / 3;
}

.battle-screen__team--enemy .battle-screen__formation-slot--main-2 {
  grid-column: 2;
  grid-row: 3 / 5;
}

.battle-screen__team--enemy .battle-screen__formation-slot--main-3 {
  grid-column: 2;
  grid-row: 5 / 7;
}

.battle-screen__team--enemy .battle-screen__formation-slot--between-1 {
  grid-column: 1;
  grid-row: 2 / 4;
}

.battle-screen__team--enemy .battle-screen__formation-slot--between-2 {
  grid-column: 1;
  grid-row: 4 / 6;
}

.battle-screen__projectile-group {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
}

.battle-screen__projectile-trail {
  position: absolute;
  left: var(--from-x);
  top: var(--from-y);
  width: var(--trail-length);
  height: clamp(5px, 1.2vmin, 8px);
  transform: translate(-100%, -50%) rotate(var(--beam-angle));
  transform-origin: 100% 50%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 70, 50, 0.05) 18%,
    rgba(255, 120, 70, 0.55) 52%,
    rgba(255, 230, 170, 0.95) 82%,
    rgba(255, 255, 230, 1) 100%
  );
  box-shadow: 0 0 14px rgba(255, 100, 70, 0.65);
  opacity: 0;
  animation: battle-trail-fly 0.56s linear forwards;
}

.battle-screen__projectile-trail--crit {
  height: clamp(7px, 1.6vmin, 10px);
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 140, 30, 0.08) 16%,
    rgba(255, 170, 50, 0.65) 50%,
    rgba(255, 240, 160, 1) 84%,
    #fff 100%
  );
  box-shadow: 0 0 18px rgba(255, 170, 50, 0.85);
  animation-duration: 0.46s;
}

.battle-screen__projectile-trail-glow {
  position: absolute;
  left: var(--from-x);
  top: var(--from-y);
  width: var(--trail-length);
  height: clamp(14px, 3.2vmin, 22px);
  transform: translate(-100%, -50%) rotate(var(--beam-angle));
  transform-origin: 100% 50%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 180, 80, 0.08) 30%,
    rgba(255, 200, 100, 0.28) 70%,
    rgba(255, 220, 140, 0.42) 100%
  );
  filter: blur(4px);
  opacity: 0;
  animation: battle-trail-fly 0.56s linear forwards;
}

.battle-screen__projectile-trail-glow--crit {
  height: clamp(18px, 4vmin, 28px);
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 200, 80, 0.1) 28%,
    rgba(255, 220, 120, 0.38) 72%,
    rgba(255, 240, 180, 0.5) 100%
  );
  animation-duration: 0.46s;
}

.battle-screen__projectile-glow {
  position: absolute;
  left: var(--from-x);
  top: var(--from-y);
  width: clamp(18px, 4vmin, 28px);
  height: clamp(18px, 4vmin, 28px);
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 220, 0.95) 0%, rgba(255, 160, 60, 0.55) 45%, transparent 72%);
  opacity: 0;
  animation: battle-glow-fly 0.56s linear forwards;
}

.battle-screen__projectile-glow--crit {
  width: clamp(24px, 5vmin, 36px);
  height: clamp(24px, 5vmin, 36px);
  background: radial-gradient(circle, rgba(255, 255, 240, 1) 0%, rgba(255, 190, 60, 0.7) 42%, transparent 74%);
  animation-duration: 0.46s;
}

.battle-screen__projectile {
  position: absolute;
  left: var(--from-x);
  top: var(--from-y);
  width: clamp(64px, 16vmin, 96px);
  height: clamp(64px, 16vmin, 96px);
  transform: translate(-50%, -50%) rotate(var(--projectile-angle));
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;
  filter:
    drop-shadow(0 0 10px rgba(255, 240, 160, 0.95))
    drop-shadow(0 0 18px rgba(255, 120, 60, 0.8))
    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45));
  animation: battle-projectile-fly 0.56s linear forwards;
}

.battle-screen__projectile--crit {
  filter:
    drop-shadow(0 0 14px rgba(255, 220, 100, 1))
    drop-shadow(0 0 24px rgba(255, 145, 0, 0.95))
    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45));
  animation-duration: 0.46s;
}

@keyframes battle-trail-fly {
  0% {
    left: var(--from-x);
    top: var(--from-y);
    opacity: 0.25;
    transform: translate(-100%, -50%) rotate(var(--beam-angle)) scaleX(0.55);
  }
  14% {
    opacity: 1;
    transform: translate(-100%, -50%) rotate(var(--beam-angle)) scaleX(1);
  }
  100% {
    left: var(--to-x);
    top: var(--to-y);
    opacity: 0.45;
    transform: translate(-100%, -50%) rotate(var(--beam-angle)) scaleX(1);
  }
}

@keyframes battle-glow-fly {
  0% {
    left: var(--from-x);
    top: var(--from-y);
    opacity: 0.2;
    transform: translate(-50%, -50%) scale(0.6);
  }
  12% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    left: var(--to-x);
    top: var(--to-y);
    opacity: 0.35;
    transform: translate(-50%, -50%) scale(1.15);
  }
}

@keyframes battle-projectile-fly {
  from {
    left: var(--from-x);
    top: var(--from-y);
    opacity: 0.35;
    transform: translate(-50%, -50%) rotate(var(--projectile-angle)) scale(0.75);
  }
  12% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--projectile-angle)) scale(1);
  }
  100% {
    left: var(--to-x);
    top: var(--to-y);
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--projectile-angle)) scale(1.05);
  }
}
</style>
