<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, type ComponentPublicInstance } from 'vue'

import BattleFighterCard from '@/components/game/BattleFighterCard.vue'
import type { BattleSnapshot } from '@/domain/formulas/combat'
import { useBattlePlayback } from '@/composables/useBattlePlayback'
import { assetUrl } from '@/shared/utils/assetUrl'

const BATTLE_TOY_SIZE = 'clamp(100px, 18vmin, 180px)'
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
  activeAttackerId,
  activeTargetId,
  hitTargetId,
  flyingProjectile,
  damageFloats,
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

const projectilePoints = ref<{
  from: ProjectilePoint
  to: ProjectilePoint
  angle: number
} | null>(null)

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

async function updateProjectilePoints(): Promise<void> {
  const projectile = flyingProjectile.value
  if (!projectile) {
    projectilePoints.value = null
    return
  }

  await nextTick()
  const from = anchorCenter(projectile.attackerId)
  const to = anchorCenter(projectile.targetId)
  if (!from || !to) {
    projectilePoints.value = null
    return
  }

  const flightAngleDeg = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
  const angle = flightAngleDeg + SWORD_FLIGHT_OFFSET_DEG
  projectilePoints.value = { from, to, angle }
}

watch(flyingProjectile, () => {
  void updateProjectilePoints()
})

function damagesFor(unitId: string) {
  return damageFloats.value.filter((entry) => entry.unitId === unitId)
}

function fighterClass(unitId: string, side: 'player' | 'enemy'): Record<string, boolean> {
  return {
    'battle-fighter--attacking': activeAttackerId.value === unitId,
    'battle-fighter--target': activeTargetId.value === unitId,
    'battle-fighter--hit': hitTargetId.value === unitId,
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
              :fighter-class="fighterClass(entry.unitId, 'enemy')"
            />
          </div>
        </div>
      </section>

      <div
        v-if="flyingProjectile && projectilePoints"
        :key="flyingProjectile.id"
        class="battle-screen__projectile"
        :class="{ 'battle-screen__projectile--crit': flyingProjectile.isCrit }"
        :style="{
          '--from-x': `${projectilePoints.from.x}px`,
          '--from-y': `${projectilePoints.from.y}px`,
          '--to-x': `${projectilePoints.to.x}px`,
          '--to-y': `${projectilePoints.to.y}px`,
          '--projectile-angle': `${projectilePoints.angle}deg`,
          backgroundImage: `url('${battleSword}')`,
        }"
        aria-hidden="true"
      />
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

.battle-screen__projectile {
  position: absolute;
  left: var(--from-x);
  top: var(--from-y);
  z-index: 20;
  width: clamp(64px, 16vmin, 96px);
  height: clamp(64px, 16vmin, 96px);
  transform: translate(-50%, -50%) rotate(var(--projectile-angle));
  pointer-events: none;
  animation: battle-projectile-fly 0.56s linear forwards;
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45));
}

.battle-screen__projectile--crit {
  filter:
    drop-shadow(0 0 10px rgba(255, 145, 0, 0.85))
    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45));
  animation-duration: 0.46s;
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
