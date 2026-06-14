import { computed, ref } from 'vue'

import { TOY_BY_ID } from '@/domain/data/toys'
import { calcTeamPower, generateEnemyTeam, simulateBattle } from '@/domain/formulas/combat'
import type { BattleResult } from '@/domain/formulas/combat'
import { useGameStore } from '@/stores/gameStore'

export function usePvp() {
  const game = useGameStore()
  const lastBattle = ref<BattleResult | null>(null)
  const enemyTeam = ref<ReturnType<typeof generateEnemyTeam>>([])

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

  function startBattle(): BattleResult | null {
    if (!canBattle.value) return null

    enemyTeam.value = generateEnemyTeam(teamPower.value, game.catalog)
    const result = simulateBattle(playerTeam.value, enemyTeam.value)
    lastBattle.value = result
    game.recordPvpResult(result.winner === 'player', result.ratingDelta, result.coinReward)
    return result
  }

  return {
    playerTeam,
    teamPower,
    canBattle,
    lastBattle,
    enemyTeam,
    startBattle,
  }
}
