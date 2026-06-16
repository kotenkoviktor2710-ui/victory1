import { computed, onMounted, onUnmounted, ref } from 'vue'

import { PVP_ATTACK_COOLDOWN_MS } from '@/domain/constants'
import { useGameStore } from '@/stores/gameStore'
import { getServerTime } from '@/yandex/sdk'
import { startServerTimeTicker } from '@/yandex/serverTimeTimers'

function formatCooldown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function useAttackCooldown() {
  const game = useGameStore()
  const now = ref(getServerTime())

  let stopTicker: (() => void) | null = null

  onMounted(() => {
    stopTicker = startServerTimeTicker((serverNow) => {
      now.value = serverNow
    })
  })

  onUnmounted(() => {
    stopTicker?.()
  })

  const remainingMs = computed(() =>
    Math.max(0, game.nextAttackAvailableAt - now.value),
  )

  const canAttack = computed(() => remainingMs.value <= 0)

  const isOnCooldown = computed(
    () => !canAttack.value && game.nextAttackAvailableAt > 0,
  )

  const cooldownLabel = computed(() => formatCooldown(remainingMs.value))

  function startAttackCooldown(): void {
    game.nextAttackAvailableAt = getServerTime() + PVP_ATTACK_COOLDOWN_MS
  }

  function resetAttackCooldown(): void {
    game.nextAttackAvailableAt = 0
  }

  return {
    canAttack,
    isOnCooldown,
    cooldownLabel,
    startAttackCooldown,
    resetAttackCooldown,
  }
}
