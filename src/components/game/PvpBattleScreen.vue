<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'

import ToySprite from '@/components/game/ToySprite.vue'
import { formatNumber } from '@/domain/formulas/economy'
import type { BattleSnapshot } from '@/domain/formulas/combat'
import { useBattlePlayback } from '@/composables/useBattlePlayback'

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
  damageFloats,
  phase,
  healthPercent,
  isAlive,
  start,
} = useBattlePlayback(props.snapshot)

const playerRoster = computed(() => props.snapshot.playerRoster)
const enemyRoster = computed(() => props.snapshot.enemyRoster)

function damagesFor(unitId: string) {
  return damageFloats.value.filter((entry) => entry.unitId === unitId)
}

function fighterClass(unitId: string, side: 'player' | 'enemy'): Record<string, boolean> {
  return {
    'battle-screen__fighter--attacking': activeAttackerId.value === unitId,
    'battle-screen__fighter--target': activeTargetId.value === unitId,
    'battle-screen__fighter--hit': hitTargetId.value === unitId,
    'battle-screen__fighter--down': !isAlive(unitId),
    'battle-screen__fighter--player': side === 'player',
    'battle-screen__fighter--enemy': side === 'enemy',
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
    <div class="battle-screen__bg" aria-hidden="true" />
    <div class="battle-screen__shade" aria-hidden="true" />

    <div class="battle-screen__arena">
      <section class="battle-screen__team battle-screen__team--player">
        <div
          v-for="entry in playerRoster"
          :key="entry.unitId"
          class="battle-screen__fighter"
          :class="fighterClass(entry.unitId, 'player')"
        >
          <div class="battle-screen__hp">
            <div
              class="battle-screen__hp-fill battle-screen__hp-fill--ally"
              :style="{ width: `${healthPercent(entry.unitId)}%` }"
            />
          </div>
          <div class="battle-screen__sprite-wrap">
            <ToySprite
              :definition-id="entry.definitionId"
              :level="entry.level"
              size="clamp(72px, 16vw, 108px)"
            />
            <span
              v-for="dmg in damagesFor(entry.unitId)"
              :key="dmg.id"
              class="battle-screen__damage game-text-stroke"
              :class="{ 'battle-screen__damage--crit': dmg.isCrit }"
            >
              -{{ formatNumber(dmg.amount) }}
            </span>
          </div>
        </div>
      </section>

      <div class="battle-screen__center" aria-hidden="true">
        <span class="battle-screen__vs game-text-stroke">VS</span>
      </div>

      <section class="battle-screen__team battle-screen__team--enemy">
        <div
          v-for="entry in enemyRoster"
          :key="entry.unitId"
          class="battle-screen__fighter"
          :class="fighterClass(entry.unitId, 'enemy')"
        >
          <div class="battle-screen__hp">
            <div
              class="battle-screen__hp-fill battle-screen__hp-fill--enemy"
              :style="{ width: `${healthPercent(entry.unitId)}%` }"
            />
          </div>
          <div class="battle-screen__sprite-wrap battle-screen__sprite-wrap--enemy">
            <ToySprite
              :definition-id="entry.definitionId"
              :level="entry.level"
              size="clamp(72px, 16vw, 108px)"
            />
            <span
              v-for="dmg in damagesFor(entry.unitId)"
              :key="dmg.id"
              class="battle-screen__damage game-text-stroke"
              :class="{ 'battle-screen__damage--crit': dmg.isCrit }"
            >
              -{{ formatNumber(dmg.amount) }}
            </span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.battle-screen {
  position: fixed;
  inset: 0;
  z-index: 240;
  overflow: hidden;
  font-weight: var(--game-font-weight);
}

.battle-screen__bg {
  position: absolute;
  inset: 0;
  background: url('/images/6bg.png') center center / cover no-repeat;
}

.battle-screen__shade {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 90% 70% at 50% 50%, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.62) 100%),
    linear-gradient(180deg, rgba(8, 12, 24, 0.45) 0%, rgba(8, 12, 24, 0.72) 100%);
}

.battle-screen__arena {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(8px, 2vw, 18px);
  height: 100%;
  padding:
    calc(12px + env(safe-area-inset-top, 0px))
    clamp(10px, 3vw, 24px)
    calc(16px + env(safe-area-inset-bottom, 0px));
}

.battle-screen__team {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(10px, 2.4vw, 18px);
  min-height: 0;
}

.battle-screen__team--player {
  align-items: flex-start;
}

.battle-screen__team--enemy {
  align-items: flex-end;
}

.battle-screen__center {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.battle-screen__vs {
  font-size: clamp(28px, 7vw, 42px);
  color: #ffe566;
  opacity: 0.9;
}

.battle-screen__fighter {
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition:
    transform 0.2s ease,
    opacity 0.25s ease,
    filter 0.2s ease;
}

.battle-screen__fighter--player {
  align-items: flex-start;
}

.battle-screen__fighter--enemy {
  align-items: flex-end;
}

.battle-screen__fighter--attacking {
  transform: scale(1.08) translateX(6px);
  filter: drop-shadow(0 0 10px rgba(255, 229, 102, 0.55));
}

.battle-screen__fighter--enemy.battle-screen__fighter--attacking {
  transform: scale(1.08) translateX(-6px);
}

.battle-screen__fighter--hit {
  animation: battle-hit 0.34s ease;
}

.battle-screen__fighter--down {
  opacity: 0.35;
  filter: grayscale(0.85);
  transform: scale(0.92);
}

.battle-screen__hp {
  width: clamp(88px, 20vw, 128px);
  height: 12px;
  border: 2px solid var(--game-ink);
  background: rgba(20, 10, 10, 0.85);
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.45);
  overflow: hidden;
}

.battle-screen__hp-fill {
  height: 100%;
  transition: width 0.28s ease-out;
}

.battle-screen__hp-fill--ally {
  background: linear-gradient(180deg, #7ee06a 0%, #2e7d32 100%);
}

.battle-screen__hp-fill--enemy {
  background: linear-gradient(180deg, #ff6b5b 0%, #c62828 100%);
}

.battle-screen__sprite-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  filter:
    drop-shadow(0 0 2px #fff)
    drop-shadow(0 0 5px rgba(255, 255, 255, 0.45));
}

.battle-screen__sprite-wrap--enemy {
  transform: scaleX(-1);
}

.battle-screen__damage {
  position: absolute;
  top: 8%;
  left: 50%;
  z-index: 2;
  font-size: clamp(18px, 4.6vw, 30px);
  color: #ff5252;
  white-space: nowrap;
  pointer-events: none;
  animation: battle-damage-float 0.78s ease-out forwards;
}

.battle-screen__damage--crit {
  color: #ff9100;
  font-size: clamp(22px, 5.4vw, 36px);
}

@keyframes battle-hit {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes battle-damage-float {
  0% {
    opacity: 0;
    transform: translate(-50%, 8px) scale(0.7);
  }
  18% {
    opacity: 1;
    transform: translate(-50%, -8px) scale(1.08);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -42px) scale(1);
  }
}
</style>
