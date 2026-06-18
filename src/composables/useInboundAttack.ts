import { onMounted, onUnmounted, ref } from 'vue'

import { PVP_ATTACK_COOLDOWN_MS } from '@/domain/constants'
import type { InboundAttack } from '@/domain/pvp/types'
import { pickInboundAttack } from '@/yandex/pvpSync'
import { scheduleAfterServerMs, type ServerTimerHandle } from '@/yandex/serverTimeTimers'
import { useGameStore } from '@/stores/gameStore'

const pendingInbound = ref<InboundAttack | null>(null)
const isCheckingInbound = ref(false)

let nextInboundCheckTimer: ServerTimerHandle | null = null

function clearInboundCheckTimer(): void {
  nextInboundCheckTimer?.cancel()
  nextInboundCheckTimer = null
}

export function useInboundAttack() {
  const game = useGameStore()

  function scheduleNextInboundCheck(delay = PVP_ATTACK_COOLDOWN_MS): void {
    clearInboundCheckTimer()
    nextInboundCheckTimer = scheduleAfterServerMs(delay, () => {
      nextInboundCheckTimer = null
      void checkInboundAttack()
    })
  }

  async function checkInboundAttack(): Promise<InboundAttack | null> {
    if (isCheckingInbound.value || pendingInbound.value) {
      return pendingInbound.value
    }

    if (game.board.length === 0) {
      scheduleNextInboundCheck()
      return null
    }

    isCheckingInbound.value = true
    try {
      const attack = await pickInboundAttack(game.pvpRating, game.seenPvpSessionIds)
      pendingInbound.value = attack
      if (!attack) {
        scheduleNextInboundCheck()
      }
      return attack
    } finally {
      isCheckingInbound.value = false
    }
  }

  function dismissInboundAttack(): void {
    if (pendingInbound.value) {
      game.markPvpSessionSeen(pendingInbound.value.sessionId)
    }
    pendingInbound.value = null
    scheduleNextInboundCheck()
  }

  function consumeInboundAttack(): InboundAttack | null {
    const attack = pendingInbound.value
    if (!attack) return null
    game.markPvpSessionSeen(attack.sessionId)
    pendingInbound.value = null
    scheduleNextInboundCheck()
    return attack
  }

  onMounted(() => {
    void checkInboundAttack()
  })

  onUnmounted(() => {
    clearInboundCheckTimer()
  })

  return {
    pendingInbound,
    isCheckingInbound,
    checkInboundAttack,
    dismissInboundAttack,
    consumeInboundAttack,
  }
}
