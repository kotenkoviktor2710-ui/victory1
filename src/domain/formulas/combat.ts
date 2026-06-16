import { getToyImageByLevel } from '@/domain/data/toyImages'
import { MAX_TOY_LEVEL, MIN_TOY_LEVEL, type ToyDefinition } from '../types/toy'
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
  waveIndex: number
  side: 'player' | 'enemy'
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
  let waveIndex = 0

  while (
    round < maxRounds &&
    playerUnits.some((u) => u.health > 0) &&
    enemyUnits.some((u) => u.health > 0)
  ) {
    const livingPlayers = playerUnits.filter((u) => u.health > 0)
    const playerTargets = enemyUnits.filter((u) => u.health > 0)
    if (playerTargets.length === 0) break
    const playerTarget = playerTargets[0]!

    for (let i = 0; i < livingPlayers.length; i += 1) {
      const attacker = livingPlayers[i]!
      const { damage, isCrit } = rollDamage(attacker)
      playerTarget.health = Math.max(0, playerTarget.health - damage)

      actions.push({
        attackerId: attacker.id,
        targetId: playerTarget.id,
        damage,
        isCrit,
        waveIndex,
        side: 'player',
      })
    }

    waveIndex += 1
    if (!enemyUnits.some((u) => u.health > 0)) break

    const livingEnemies = enemyUnits.filter((u) => u.health > 0)
    const enemyTargets = playerUnits.filter((u) => u.health > 0)
    if (enemyTargets.length === 0) break
    const enemyTarget = enemyTargets[0]!

    for (let i = 0; i < livingEnemies.length; i += 1) {
      const attacker = livingEnemies[i]!
      const { damage, isCrit } = rollDamage(attacker)
      enemyTarget.health = Math.max(0, enemyTarget.health - damage)

      actions.push({
        attackerId: attacker.id,
        targetId: enemyTarget.id,
        damage,
        isCrit,
        waveIndex,
        side: 'enemy',
      })
    }

    waveIndex += 1
    round += 1
  }

  const playerAlive = playerUnits.some((u) => u.health > 0)
  const winner = playerAlive ? 'player' : 'enemy'
  const rewards = buildBattleRewards(winner, playerTeam.length)

  return {
    winner,
    playerUnits,
    enemyUnits,
    playerRoster: playerTeam.map((t, i) => ({
      unitId: playerUnits[i]!.id,
      definitionId: t.definition.id,
      level: t.level,
    })),
    enemyRoster: enemyTeam.map((t, i) => ({
      unitId: enemyUnits[i]!.id,
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

export interface GenerateEnemyTeamOptions {
  playerTeam?: { definition: ToyDefinition; level: number }[]
  teamSize?: number
}

const BOT_OPPONENT_NAMES = ['Робот', 'Синтет', 'Имитатор', 'Двойник', 'Защитник'] as const

function clampToyLevel(level: number): number {
  return Math.max(MIN_TOY_LEVEL, Math.min(MAX_TOY_LEVEL, Math.round(level)))
}

function resolveReferenceLevel(playerTeam: { level: number }[]): number {
  if (playerTeam.length === 0) return 10
  const avg = playerTeam.reduce((sum, toy) => sum + toy.level, 0) / playerTeam.length
  const peak = Math.max(...playerTeam.map((toy) => toy.level))
  return Math.round(avg * 0.6 + peak * 0.4)
}

function pickStrongToyPool(catalog: ToyDefinition[]): ToyDefinition[] {
  const sorted = [...catalog].sort(
    (a, b) => b.baseAttack + b.baseHealth - (a.baseAttack + a.baseHealth),
  )
  const poolSize = Math.max(4, Math.ceil(sorted.length * 0.65))
  return sorted.slice(0, poolSize)
}

function tuneTeamToTargetPower(
  team: { definition: ToyDefinition; level: number }[],
  targetPower: number,
): void {
  const minPower = targetPower * 0.92
  const maxPower = targetPower * 1.08
  let currentPower = calcTeamPower(team)

  for (let attempt = 0; attempt < 48; attempt += 1) {
    if (currentPower >= minPower && currentPower <= maxPower) return

    const idx = Math.floor(Math.random() * team.length)
    const member = team[idx]!
    if (currentPower < minPower && member.level < MAX_TOY_LEVEL) {
      member.level += 1
    } else if (currentPower > maxPower && member.level > MIN_TOY_LEVEL) {
      member.level -= 1
    } else {
      continue
    }
    currentPower = calcTeamPower(team)
  }
}

export function generateEnemyTeam(
  playerPower: number,
  catalog: ToyDefinition[],
  options: GenerateEnemyTeamOptions = {},
): { definition: ToyDefinition; level: number }[] {
  if (catalog.length === 0) return []

  const playerTeam = options.playerTeam ?? []
  const teamSize = options.teamSize ?? 5
  const referenceLevel = resolveReferenceLevel(playerTeam)
  const levelSpread = Math.max(2, Math.round(referenceLevel * 0.12))
  const targetPower = Math.max(1, playerPower * (0.9 + Math.random() * 0.2))
  const toyPool = pickStrongToyPool(catalog)

  const team: { definition: ToyDefinition; level: number }[] = []
  for (let slot = 0; slot < teamSize; slot += 1) {
    const levelOffset = Math.floor(Math.random() * (levelSpread * 2 + 1)) - levelSpread
    const definition = toyPool[Math.floor(Math.random() * toyPool.length)]!
    team.push({
      definition,
      level: clampToyLevel(referenceLevel + levelOffset),
    })
  }

  tuneTeamToTargetPower(team, targetPower)

  return team.length > 0 ? team : [{ definition: catalog[0]!, level: clampToyLevel(referenceLevel) }]
}

export function pickBotOpponentName(): string {
  return BOT_OPPONENT_NAMES[Math.floor(Math.random() * BOT_OPPONENT_NAMES.length)]!
}

/** Соперник из лидерборда слишком слабый — лучше сгенерировать бота. */
export function isOpponentTooWeak(opponentPower: number, playerPower: number): boolean {
  if (playerPower <= 0) return false
  return opponentPower < playerPower * 0.65
}
