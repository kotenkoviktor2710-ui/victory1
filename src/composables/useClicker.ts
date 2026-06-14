import { computed, onMounted, onUnmounted, ref } from 'vue'

import {
  COMBO_BAR_DECAY_LERP,
  COMBO_BAR_FILL_LERP,
  COMBO_MAX_PROGRESS,
  COMBO_MULTIPLIERS,
} from '@/domain/types/game'
import { useGameStore } from '@/stores/gameStore'

export function useClicker() {
  const game = useGameStore()
  const displayProgress = ref(0)
  let rafId = 0

  function animateComboBar(): void {
    const target = game.comboProgress
    const current = displayProgress.value
    const diff = target - current

    if (Math.abs(diff) > 0.015) {
      const lerp = diff > 0 ? COMBO_BAR_FILL_LERP : COMBO_BAR_DECAY_LERP
      displayProgress.value = current + diff * lerp
    } else if (diff !== 0) {
      displayProgress.value = target
    }

    rafId = requestAnimationFrame(animateComboBar)
  }

  onMounted(() => {
    displayProgress.value = game.comboProgress
    rafId = requestAnimationFrame(animateComboBar)
  })

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
  })

  const comboBarPercent = computed(() => {
    if (COMBO_MAX_PROGRESS <= 0) return 0
    return Math.min(100, Math.max(0, (displayProgress.value / COMBO_MAX_PROGRESS) * 100))
  })

  const comboLabel = computed(() => `x${COMBO_MULTIPLIERS[game.comboLevel] ?? 1}`)

  const comboLevel = computed(() => game.comboLevel)

  return {
    comboBarPercent,
    comboLabel,
    comboLevel,
    comboMultiplier: computed(() => game.comboMultiplier),
    floatingCoins: computed(() => game.floatingCoins),
  }
}
