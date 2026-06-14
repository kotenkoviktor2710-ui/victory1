import { computed, onMounted, onUnmounted, ref } from 'vue'

const SLIDER_CYCLE_MS = 2600

/** x5 в центре, x1 по краям. */
export function rewardMultiplierAt(position: number): number {
  const dist = Math.abs(position - 50) / 50
  return Math.max(1, Math.min(5, 1 + Math.round((1 - dist) * 4)))
}

export function useRewardSlider() {
  const position = ref(0)
  let rafId = 0
  let startedAt = 0

  const multiplier = computed(() => rewardMultiplierAt(position.value))

  function tick(now: number): void {
    if (!startedAt) startedAt = now
    const elapsed = (now - startedAt) % SLIDER_CYCLE_MS
    const phase = elapsed / (SLIDER_CYCLE_MS / 2)
    position.value = phase <= 1 ? phase * 100 : (2 - phase) * 100
    rafId = requestAnimationFrame(tick)
  }

  onMounted(() => {
    rafId = requestAnimationFrame(tick)
  })

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
  })

  return {
    position,
    multiplier,
  }
}
