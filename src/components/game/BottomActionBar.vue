<script setup lang="ts">
import HudAudioControls from '@/components/game/HudAudioControls.vue'
import { useI18n } from '@/i18n'

defineProps<{
  canAttack: boolean
  cooldownLabel: string
  showCooldownAd: boolean
}>()

const emit = defineEmits<{
  attack: []
  'skip-cooldown': []
}>()

const { t } = useI18n()
</script>

<template>
  <footer class="bottom-bar">
    <div class="bottom-bar__left">
      <HudAudioControls />
    </div>

    <div class="bottom-bar__actions">
      <div
        class="bottom-bar__attack-wrap"
        :class="{ 'bottom-bar__attack-wrap--cooldown-ad': showCooldownAd }"
      >
        <button
          v-if="canAttack || cooldownLabel"
          type="button"
          class="game-attack-btn bottom-bar__attack"
          :class="{ 'game-attack-btn--cooldown': !canAttack }"
          :disabled="!canAttack"
          :aria-label="canAttack ? t('hud.attack') : t('hud.attackCooldown', { time: cooldownLabel })"
          :aria-live="canAttack ? undefined : 'polite'"
          @click="emit('attack')"
        >
          <span class="game-attack-btn__label game-text-stroke">
            {{ canAttack ? t('hud.attack') : cooldownLabel }}
          </span>
          <span class="game-attack-btn__icon" aria-hidden="true">
            <img class="game-attack-btn__sword" src="/images/sword.png" alt="" />
          </span>
        </button>

        <button
          v-if="showCooldownAd"
          type="button"
          class="game-attack-btn game-attack-btn--ad bottom-bar__ad-btn"
          :aria-label="t('hud.skipCooldownAria')"
          @click="emit('skip-cooldown')"
        >
          <span class="game-attack-btn__label game-text-stroke">{{ t('hud.dontWait') }}</span>
          <span class="game-attack-btn__icon" aria-hidden="true">
            <img class="game-attack-btn__ad-icon" src="/images/ads.png" alt="" />
          </span>
        </button>
      </div>
    </div>

    <div class="bottom-bar__spacer" aria-hidden="true" />
  </footer>
</template>

<style scoped>
.bottom-bar {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content minmax(0, 1fr);
  grid-template-rows: 1fr;
  align-items: center;
  gap: 6px;
  min-height: var(--bottom-bar-row-height, clamp(56px, 15vw, 72px));
  padding: 0 12px;
  box-sizing: border-box;
  overflow: visible;
}

.bottom-bar__actions,
.bottom-bar__attack-wrap {
  overflow: visible;
}

.game-attack-btn__label {
  text-transform: uppercase;
  font-weight: 900;
}

.bottom-bar__left {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-start;
  justify-self: start;
  align-self: center;
  flex-shrink: 0;
  min-width: 0;
  --game-hud-audio-icon-size: var(--game-bottom-icon-size, 34px);
  --game-hud-audio-gap: 10px;
}

.bottom-bar__spacer {
  grid-column: 3;
  grid-row: 1;
  min-width: 0;
  align-self: center;
}

.bottom-bar__actions {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  align-self: center;
  width: auto;
  max-width: 100%;
  min-width: 0;
  flex-shrink: 0;
  z-index: 1;
  --bottom-action-btn-width: var(--game-attack-btn-width, clamp(188px, 50vw, 260px));
  --game-attack-btn-height: var(--bottom-bar-row-height, clamp(56px, 15vw, 72px));
}

.bottom-bar__attack-wrap {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  justify-content: center;
  gap: clamp(6px, 1.6vw, 10px);
  flex: 0 0 auto;
  width: auto;
  min-width: 0;
  max-width: 100%;
}

.bottom-bar__attack-wrap--cooldown-ad {
  gap: clamp(6px, 1.6vw, 10px);
}

.bottom-bar__attack,
.bottom-bar__ad-btn {
  flex: 0 0 auto;
  height: var(--game-attack-btn-height);
  min-height: var(--game-attack-btn-height);
  max-height: var(--game-attack-btn-height);
}

.bottom-bar__attack {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--bottom-action-btn-width);
  min-width: 0;
}

.bottom-bar__ad-btn {
  width: auto;
  min-width: clamp(132px, 20vw, 168px);
  max-width: var(--bottom-action-btn-width);
}
</style>
