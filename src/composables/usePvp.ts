import { computed, ref } from 'vue'

import { TOY_BY_ID } from '@/domain/data/toys'
import { teamSlotsToCombatTeam } from '@/domain/pvp/defenseSnapshot'
import { pickRandomOpponent } from '@/domain/pvp/opponentPicker'
import type { InboundAttack, PvpOpponent } from '@/domain/pvp/types'
import {
  calcTeamPower,
  generateEnemyTeam,
  simulateBattle,
  simulateBattleDetailed,
  snapshotToBattleResult,
} from '@/domain/formulas/combat'
import type { BattleResult, BattleSnapshot } from '@/domain/formulas/combat'
import { getPlayerUniqueId } from '@/yandex/player'
import {
  fetchPvpLeaderboardOpponents,
  publishPvpDefense,
  recordPvpAttackSession,
} from '@/yandex/pvpSync'
import { useGameStore } from '@/stores/gameStore'

const lastBattle = ref<BattleResult | null>(null)
const enemyTeam = ref<ReturnType<typeof generateEnemyTeam>>([])
const activeSnapshot = ref<BattleSnapshot | null>(null)
const currentOpponent = ref<PvpOpponent | null>(null)
const battleSource = ref<'outbound' | 'inbound'>('outbound')
const isPreparingBattle = ref(false)

export function usePvp() {
  const game = useGameStore()

  function resolvePlayerCombatTeam() {
    const slots = game.getPvpTeamSlots()
    return teamSlotsToCombatTeam(slots, TOY_BY_ID)
  }

  const playerTeam = computed(() => resolvePlayerCombatTeam())

  const teamPower = computed(() => calcTeamPower(playerTeam.value))

  const canBattle = computed(() => playerTeam.value.length > 0)

  async function pickOutboundOpponent(): Promise<PvpOpponent | null> {
    const entries = await fetchPvpLeaderboardOpponents(game.pvpRating)
    const selfId = await getPlayerUniqueId()
    return pickRandomOpponent(entries, selfId)
  }

  function buildSnapshot(
    enemy: { definition: (typeof TOY_BY_ID)[string]; level: number }[],
    source: 'outbound' | 'inbound',
  ): BattleSnapshot {
    battleSource.value = source
    enemyTeam.value = enemy
    const snapshot = simulateBattleDetailed(playerTeam.value, enemyTeam.value)
    activeSnapshot.value = snapshot
    return snapshot
  }

  async function prepareOutboundBattle(): Promise<BattleSnapshot | null> {
    if (!canBattle.value || isPreparingBattle.value) return null

    isPreparingBattle.value = true
    try {
      const opponent = await pickOutboundOpponent()
      currentOpponent.value = opponent

      if (opponent) {
        const enemy = teamSlotsToCombatTeam(opponent.team, TOY_BY_ID)
        if (enemy.length > 0) {
          return buildSnapshot(enemy, 'outbound')
        }
      }

      const fallbackEnemy = generateEnemyTeam(teamPower.value, game.catalog)
      currentOpponent.value = null
      return buildSnapshot(fallbackEnemy, 'outbound')
    } finally {
      isPreparingBattle.value = false
    }
  }

  function prepareInboundBattle(attack: InboundAttack): BattleSnapshot | null {
    if (!canBattle.value) return null

    const enemy = teamSlotsToCombatTeam(attack.team, TOY_BY_ID)
    if (enemy.length === 0) return null

    currentOpponent.value = {
      uniqueId: attack.sessionId,
      name: attack.attackerName,
      rating: attack.rating,
      team: attack.team,
      power: attack.power,
    }

    return buildSnapshot(enemy, 'inbound')
  }

  async function syncAfterOutboundBattle(): Promise<void> {
    const team = game.getPvpTeamSlots()
    if (team.length === 0) return

    const power = game.calcPvpTeamPower(team)
    const rating = Math.max(1, game.pvpRating)

    await recordPvpAttackSession(rating, team, power)
    await publishPvpDefense(rating, team, power)
  }

  function finalizeBattleStats(snapshot: BattleSnapshot): void {
    lastBattle.value = snapshotToBattleResult(snapshot)
    game.recordPvpStats(snapshot.winner === 'player', snapshot.ratingDelta)
    activeSnapshot.value = null

    if (battleSource.value === 'outbound') {
      void syncAfterOutboundBattle()
    }
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
    currentOpponent.value = null
    battleSource.value = 'outbound'
  }

  async function startBattle(): Promise<BattleResult | null> {
    const snapshot = await prepareOutboundBattle()
    if (!snapshot) return null
    completeBattle(snapshot)
    return lastBattle.value
  }

  return {
    playerTeam,
    teamPower,
    canBattle,
    isPreparingBattle,
    lastBattle,
    enemyTeam,
    activeSnapshot,
    currentOpponent,
    battleSource,
    prepareOutboundBattle,
    prepareInboundBattle,
    finalizeBattleStats,
    claimBattleReward,
    completeBattle,
    clearBattleState,
    startBattle,
  }
}
