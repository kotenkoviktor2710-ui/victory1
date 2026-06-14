<script setup lang="ts">
import { computed } from 'vue'

import { COMBO_LEVEL_COLORS } from '@/domain/types/game'
import { useClicker } from '@/composables/useClicker'

const { comboBarPercent, comboLabel, comboLevel } = useClicker()

const levelColors = [...COMBO_LEVEL_COLORS]

const levelFillGradients = [
  'linear-gradient(90deg, #757575 0%, #eeeeee 28%, #ffffff 52%, #bdbdbd 100%)',
  'linear-gradient(90deg, #2e7d32 0%, #7ee06a 28%, #c8f7a8 52%, #4caf50 100%)',
  'linear-gradient(90deg, #1565c0 0%, #64b5f6 28%, #bbdefb 52%, #42a5f5 100%)',
  'linear-gradient(90deg, #7b1fa2 0%, #ce93d8 28%, #f3e5f5 52%, #ab47bc 100%)',
  'linear-gradient(90deg, #c62828 0%, #ef5350 28%, #ffccbc 52%, #e53935 100%)',
]

const fillStyle = computed(() => ({
  width: `${comboBarPercent.value}%`,
  background: levelFillGradients[comboLevel.value] ?? levelFillGradients[0],
}))
</script>

<template>
  <div class="game-combo-bar">
    <div class="game-combo-bar__frame">
      <div class="game-combo-bar__track">
        <span class="game-combo-bar__fill" :style="fillStyle" />
        <div class="game-combo-bar__levels">
          <span
            v-for="(color, i) in levelColors"
            :key="i"
            class="game-combo-bar__level game-text-stroke"
            :class="{ 'game-combo-bar__level--active': comboLabel === `x${i + 1}` }"
            :style="{ color }"
          >
            x{{ i + 1 }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
