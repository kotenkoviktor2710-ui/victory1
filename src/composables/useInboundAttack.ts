import { ref } from 'vue'

import type { InboundAttack } from '@/domain/pvp/types'
import { pickInboundAttack } from '@/yandex/pvpSync'
import { useGameStore } from '@/stores/gameStore'

const pendingInbound = ref<InboundAttack | null>(null)
const isCheckingInbound = ref(false)

export function useInboundAttack() {
  const game = useGameStore()

  async function checkInboundAttack(): Promise<InboundAttack | null> {
    if (isCheckingInbound.value || pendingInbound.value) {
      return pendingInbound.value
    }

    if (game.board.length === 0) return null

    isCheckingInbound.value = true
    try {
      const attack = await pickInboundAttack(game.pvpRating, game.seenPvpSessionIds)
      pendingInbound.value = attack
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
  }

  function consumeInboundAttack(): InboundAttack | null {
    const attack = pendingInbound.value
    if (!attack) return null
    game.markPvpSessionSeen(attack.sessionId)
    pendingInbound.value = null
    return attack
  }

  return {
    pendingInbound,
    isCheckingInbound,
    checkInboundAttack,
    dismissInboundAttack,
    consumeInboundAttack,
  }
}
