<script setup lang="ts">
import ToySprite from '@/components/game/ToySprite.vue'
import { formatNumber } from '@/domain/formulas/economy'
import type { BattleDamageFloat, BattleHitWord } from '@/composables/useBattlePlayback'
import type { BattleRosterEntry } from '@/domain/formulas/combat'

defineProps<{
  entry: BattleRosterEntry
  side: 'player' | 'enemy'
  toySize: string
  healthPercent: number
  damages: BattleDamageFloat[]
  hitWords: BattleHitWord[]
  fighterClass: Record<string, boolean>
}>()
</script>

<template>
  <div class="battle-fighter" :class="fighterClass">
    <div
      class="battle-fighter__sprite-wrap"
      :class="{ 'battle-fighter__sprite-wrap--enemy': side === 'enemy' }"
    >
      <ToySprite
        :definition-id="entry.definitionId"
        :level="entry.level"
        :size="toySize"
      />
      <span
        v-for="hit in hitWords"
        :key="hit.id"
        class="battle-fighter__hit-word"
        :class="{ 'battle-fighter__hit-word--crit': hit.isCrit }"
      >
        {{ hit.word }}
      </span>
      <span
        v-for="dmg in damages"
        :key="dmg.id"
        class="battle-fighter__damage game-text-stroke"
        :class="{ 'battle-fighter__damage--crit': dmg.isCrit }"
      >
        -{{ formatNumber(dmg.amount) }}
      </span>
    </div>
    <div class="battle-fighter__hp">
      <div class="battle-fighter__hp-track">
        <div
          class="battle-fighter__hp-fill"
          :class="side === 'player' ? 'battle-fighter__hp-fill--ally' : 'battle-fighter__hp-fill--enemy'"
          :style="{ width: `${healthPercent}%` }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.battle-fighter {
  display: flex;
  flex-direction: column;
  gap: 6px;
  opacity: 1;
  transition:
    transform 0.24s ease,
    opacity 0.3s ease,
    filter 0.24s ease;
}

.battle-fighter--player {
  align-items: flex-start;
}

.battle-fighter--enemy {
  align-items: flex-end;
}

.battle-fighter--attacking {
  transform: scale(1.1) translateX(8px);
  filter: drop-shadow(0 0 12px rgba(255, 229, 102, 0.65));
}

.battle-fighter--enemy.battle-fighter--attacking {
  transform: scale(1.1) translateX(-8px);
}

.battle-fighter--target {
  filter: drop-shadow(0 0 8px rgba(255, 82, 82, 0.45));
}

.battle-fighter--hit {
  animation: battle-hit 0.42s ease;
}

.battle-fighter--down .battle-fighter__sprite-wrap {
  opacity: 0.5;
}

.battle-fighter__hp {
  width: clamp(100px, 18vmin, 160px);
  padding: 3px;
  border: 3px solid var(--game-ink);
  border-radius: 6px;
  background: #fff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    2px 2px 0 rgba(0, 0, 0, 0.38);
  filter: drop-shadow(1px 2px 0 rgba(0, 0, 0, 0.25));
}

.battle-fighter__hp-track {
  position: relative;
  height: clamp(12px, 2.8vmin, 18px);
  border: 2px solid var(--game-blue-deep);
  border-radius: 4px;
  background: linear-gradient(180deg, #0a1a30 0%, #143052 42%, #0d2644 100%);
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.5),
    inset 0 -1px 0 rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.battle-fighter__hp-fill {
  position: relative;
  height: 100%;
  min-width: 0;
  border-radius: 2px 0 0 2px;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.38),
    inset 0 -2px 0 rgba(0, 0, 0, 0.2);
  transition: width 0.38s ease-out;
}

.battle-fighter__hp-fill::after {
  content: '';
  position: absolute;
  inset: 2px 3px auto;
  height: 40%;
  border-radius: 2px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.55) 0%,
    rgba(255, 255, 255, 0.12) 60%,
    transparent 100%
  );
  pointer-events: none;
}

.battle-fighter__hp-fill--ally {
  background: linear-gradient(180deg, #9be86a 0%, #4caf50 55%, #2e7d32 100%);
}

.battle-fighter__hp-fill--enemy {
  background: linear-gradient(180deg, #ff8a80 0%, #e53935 55%, #b71c1c 100%);
}

.battle-fighter__sprite-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
}

.battle-fighter__sprite-wrap :deep(.toy-sprite__img) {
  opacity: 1;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4));
}

.battle-fighter__sprite-wrap--enemy :deep(.toy-sprite__img) {
  transform: scaleX(-1);
}

.battle-fighter__hit-word {
  position: absolute;
  top: 58%;
  left: 50%;
  z-index: 3;
  font-size: clamp(24px, 5.8vw, 42px);
  font-weight: 900;
  line-height: 1;
  color: #ff1744;
  letter-spacing: 0.02em;
  white-space: nowrap;
  pointer-events: none;
  -webkit-text-stroke: 2.5px #1a1208;
  paint-order: stroke fill;
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.95),
    0 0 18px rgba(255, 220, 80, 0.75),
    2px 2px 0 #1a1208;
  animation: battle-hit-word-pop 0.9s ease-out forwards;
}

.battle-fighter__hit-word::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: -1;
  width: 140%;
  height: 140%;
  transform: translate(-50%, -50%) rotate(-8deg);
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 235, 59, 0.95) 0%, rgba(255, 193, 7, 0.55) 38%, transparent 72%);
  clip-path: polygon(
    50% 0%,
    62% 18%,
    82% 10%,
    78% 32%,
    100% 38%,
    80% 52%,
    92% 74%,
    68% 68%,
    58% 92%,
    46% 70%,
    20% 78%,
    30% 54%,
    4% 42%,
    28% 34%,
    22% 10%,
    42% 20%
  );
  animation: battle-hit-burst 0.9s ease-out forwards;
}

.battle-fighter__hit-word--crit {
  color: #ff6d00;
  font-size: clamp(28px, 6.6vw, 48px);
  text-shadow:
    0 0 12px rgba(255, 255, 255, 1),
    0 0 22px rgba(255, 170, 40, 0.9),
    2px 2px 0 #1a1208;
}

.battle-fighter__damage {
  position: absolute;
  top: 8%;
  left: 50%;
  z-index: 2;
  font-size: clamp(18px, 4.6vw, 30px);
  color: #ff5252;
  white-space: nowrap;
  pointer-events: none;
  animation: battle-damage-float 0.9s ease-out forwards;
}

.battle-fighter__damage--crit {
  color: #ff9100;
  font-size: clamp(22px, 5.4vw, 36px);
}

@keyframes battle-hit {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-6px);
  }
  75% {
    transform: translateX(6px);
  }
}

@keyframes battle-hit-word-pop {
  0% {
    opacity: 0;
    transform: translate(-50%, 12px) scale(0.45) rotate(-12deg);
  }
  18% {
    opacity: 1;
    transform: translate(-50%, -4px) scale(1.12) rotate(4deg);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -36px) scale(1) rotate(0deg);
  }
}

@keyframes battle-hit-burst {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(-8deg) scale(0.4);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(-8deg) scale(1.08);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(-8deg) scale(1.2);
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
