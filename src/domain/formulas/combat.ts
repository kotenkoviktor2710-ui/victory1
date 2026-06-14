import { getToyImageByLevel } from '@/domain/data/toyImages'
import type { ToyDefinition } from '../types/toy'
import { getToyStats } from './economy'

export interface CombatUnit {
  id: string
  name: string
  image: string
  attack: number
  health: number
  maxHealth: number
  speed: number
  critChance: number
  critDamage: number
}

export interface CombatLogEntry {
  attackerName: string
  targetName: string
  damage: number
  isCrit: boolean
}

export interface BattleAction {
  attackerId: string
  targetId: string
  damage: number
  isCrit: boolean
}

export interface BattleRosterEntry {
  unitId: string
  definitionId: string
  level: number
}

export interface BattleSnapshot {
  winner: 'player' | 'enemy'
  playerUnits: CombatUnit[]
  enemyUnits: CombatUnit[]
  playerRoster: BattleRosterEntry[]
  enemyRoster: BattleRosterEntry[]
  actions: BattleAction[]
  coinReward: number
  ratingDelta: number
}

export interface BattleResult {
  winner: 'player' | 'enemy'
  log: CombatLogEntry[]
  coinReward: number
  ratingDelta: number
}

function toCombatUnit(definition: ToyDefinition, level: number, suffix: string): CombatUnit {
  const stats = getToyStats(definition, level)
  return {
    id: `${definition.id}-${suffix}`,
    name: definition.name,
    image: getToyImageByLevel(level),
    attack: stats.attack,
    health: stats.health,
    maxHealth: stats.health,
    speed: stats.speed,
    critChance: stats.critChance,
    critDamage: stats.critDamage,
  }
}

function rollDamage(attacker: CombatUnit): { damage: number; isCrit: boolean } {
  let damage = attacker.attack
  const isCrit = Math.random() < attacker.critChance
  if (isCrit) damage = Math.round(damage * attacker.critDamage)
  return { damage, isCrit }
}

export function calcTeamPower(definitions: { definition: ToyDefinition; level: number }[]): number {
  return definitions.reduce((sum, t) => {
    const stats = getToyStats(t.definition, t.level)
    return sum + stats.attack + stats.health
  }, 0)
}

function buildBattleRewards(
  winner: 'player' | 'enemy',
  playerTeamSize: number,
): { coinReward: number; ratingDelta: number } {
  return {
    coinReward: winner === 'player' ? 150 + playerTeamSize * 30 : 25,
    ratingDelta: winner === 'player' ? 25 : -10,
  }
}

function actionToLogEntry(
  playerUnits: CombatUnit[],
  enemyUnits: CombatUnit[],
  action: BattleAction,
): CombatLogEntry {
  const attacker = [...playerUnits, ...enemyUnits].find((unit) => unit.id === action.attackerId)
  const target = [...playerUnits, ...enemyUnits].find((unit) => unit.id === action.targetId)
  return {
    attackerName: attacker?.name ?? action.attackerId,
    targetName: target?.name ?? action.targetId,
    damage: action.damage,
    isCrit: action.isCrit,
  }
}

export function simulateBattleDetailed(
  playerTeam: { definition: ToyDefinition; level: number }[],
  enemyTeam: { definition: ToyDefinition; level: number }[],
): BattleSnapshot {
  const actions: BattleAction[] = []
  const playerUnits = playerTeam.map((t, i) => toCombatUnit(t.definition, t.level, `p${i}`))
  const enemyUnits = enemyTeam.map((t, i) => toCombatUnit(t.definition, t.level, `e${i}`))

  let round = 0
  const maxRounds = 200

  while (
    round < maxRounds &&
    playerUnits.some((u) => u.health > 0) &&
    enemyUnits.some((u) => u.health > 0)
  ) {
    const living = [
      ...playerUnits.filter((u) => u.health > 0).map((u) => ({ side: 'player' as const, unit: u })),
      ...enemyUnits.filter((u) => u.health > 0).map((u) => ({ side: 'enemy' as const, unit: u })),
    ].sort((a, b) => b.unit.speed - a.unit.speed)

    for (const actor of living) {
      if (actor.unit.health <= 0) continue

      const targets =
        actor.side === 'player'
          ? enemyUnits.filter((u) => u.health > 0)
          : playerUnits.filter((u) => u.health > 0)

      if (targets.length === 0) break

      const target = targets[0]!
      const { damage, isCrit } = rollDamage(actor.unit)
      target.health = Math.max(0, target.health - damage)

      actions.push({
        attackerId: actor.unit.id,
        targetId: target.id,
        damage,
        isCrit,
      })

      if (!playerUnits.some((u) => u.health > 0) || !enemyUnits.some((u) => u.health > 0)) break
    }

    round++
  }

  const playerAlive = playerUnits.some((u) => u.health > 0)
  const winner = playerAlive ? 'player' : 'enemy'
  const rewards = buildBattleRewards(winner, playerTeam.length)

  return {
    winner,
    playerUnits,
    enemyUnits,
    playerRoster: playerTeam.map((t, i) => ({
      unitId: `p${i}`,
      definitionId: t.definition.id,
      level: t.level,
    })),
    enemyRoster: enemyTeam.map((t, i) => ({
      unitId: `e${i}`,
      definitionId: t.definition.id,
      level: t.level,
    })),
    actions,
    ...rewards,
  }
}

export function snapshotToBattleResult(snapshot: BattleSnapshot): BattleResult {
  return {
    winner: snapshot.winner,
    log: snapshot.actions.slice(-8).map((action) =>
      actionToLogEntry(snapshot.playerUnits, snapshot.enemyUnits, action),
    ),
    coinReward: snapshot.coinReward,
    ratingDelta: snapshot.ratingDelta,
  }
}

export function simulateBattle(
  playerTeam: { definition: ToyDefinition; level: number }[],
  enemyTeam: { definition: ToyDefinition; level: number }[],
): BattleResult {
  return snapshotToBattleResult(simulateBattleDetailed(playerTeam, enemyTeam))
}

export function generateEnemyTeam(
  playerPower: number,
  catalog: ToyDefinition[],
): { definition: ToyDefinition; level: number }[] {
  const targetPower = playerPower * (0.85 + Math.random() * 0.3)
  const teamSize = 3 + Math.floor(Math.random() * 3)
  const team: { definition: ToyDefinition; level: number }[] = []
  let currentPower = 0

  while (team.length < teamSize && currentPower < targetPower) {
    const def = catalog[Math.floor(Math.random() * catalog.length)]!
    const level = 1 + Math.floor(Math.random() * 5)
    team.push({ definition: def, level })
    const stats = getToyStats(def, level)
    currentPower += stats.attack + stats.health
  }

  return team.length > 0 ? team : [{ definition: catalog[0]!, level: 1 }]
}
