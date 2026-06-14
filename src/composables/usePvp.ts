import { computed, ref } from 'vue'

import { TOY_BY_ID } from '@/domain/data/toys'
import {
  calcTeamPower,
  generateEnemyTeam,
  simulateBattle,
  simulateBattleDetailed,
  snapshotToBattleResult,
} from '@/domain/formulas/combat'
import type { BattleResult, BattleSnapshot } from '@/domain/formulas/combat'
import { useGameStore } from '@/stores/gameStore'

const lastBattle = ref<BattleResult | null>(null)
const enemyTeam = ref<ReturnType<typeof generateEnemyTeam>>([])
const activeSnapshot = ref<BattleSnapshot | null>(null)

export function usePvp() {
  const game = useGameStore()

  const playerTeam = computed(() =>
    game.teamInstanceIds
      .map((instanceId) => {
        const toy = game.board.find((t) => t.instanceId === instanceId)
        if (!toy) return null
        const definition = TOY_BY_ID[toy.definitionId]
        if (!definition) return null
        return { definition, level: toy.level, instanceId }
      })
      .filter((t): t is NonNullable<typeof t> => t !== null),
  )

  const teamPower = computed(() => calcTeamPower(playerTeam.value))

  const canBattle = computed(() => playerTeam.value.length > 0)

  function prepareBattle(): BattleSnapshot | null {
    if (!canBattle.value) return null

    enemyTeam.value = generateEnemyTeam(teamPower.value, game.catalog)
    const snapshot = simulateBattleDetailed(playerTeam.value, enemyTeam.value)
    activeSnapshot.value = snapshot
    return snapshot
  }

  function finalizeBattleStats(snapshot: BattleSnapshot): void {
    lastBattle.value = snapshotToBattleResult(snapshot)
    game.recordPvpStats(snapshot.winner === 'player', snapshot.ratingDelta)
    activeSnapshot.value = null
  }

  function claimBattleReward(amount: number): void {
    game.addCoins(amount)
    if (lastBattle.value) {
      lastBattle.value = {
        ...lastBattle.value,
        coinReward: amount,
      }
    }
  }

  function completeBattle(snapshot: BattleSnapshot): void {
    finalizeBattleStats(snapshot)
    claimBattleReward(snapshot.coinReward)
  }

  function clearBattleState(): void {
    lastBattle.value = null
    activeSnapshot.value = null
  }

  function startBattle(): BattleResult | null {
    const snapshot = prepareBattle()
    if (!snapshot) return null
    completeBattle(snapshot)
    return lastBattle.value
  }

  return {
    playerTeam,
    teamPower,
    canBattle,
    lastBattle,
    enemyTeam,
    activeSnapshot,
    prepareBattle,
    finalizeBattleStats,
    claimBattleReward,
    completeBattle,
    clearBattleState,
    startBattle,
  }
}
