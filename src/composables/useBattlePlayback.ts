import { computed, onUnmounted, ref } from 'vue'

import { pickBattleHitWord } from '@/domain/battleFx'
import type { BattleAction, BattleSnapshot, CombatUnit } from '@/domain/formulas/combat'

export interface BattleDamageFloat {
  id: number
  unitId: string
  amount: number
  isCrit: boolean
}

export interface BattleHitWord {
  id: number
  unitId: string
  word: string
  isCrit: boolean
}

export interface BattleProjectile {
  id: number
  attackerId: string
  targetId: string
  isCrit: boolean
}

const WINDUP_MS = 360
const FLIGHT_MS = 560
const IMPACT_MS = 420
const TEAM_MEMBER_GAP_MS = 140
const WAVE_COOLDOWN_MS = 320
const FINISH_PAUSE_MS = 900

function cloneUnitHealth(units: CombatUnit[]): Record<string, { health: number; maxHealth: number }> {
  const map: Record<string, { health: number; maxHealth: number }> = {}
  for (const unit of units) {
    map[unit.id] = { health: unit.maxHealth, maxHealth: unit.maxHealth }
  }
  return map
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function groupActionsByWave(actions: BattleAction[]): BattleAction[][] {
  const waves: BattleAction[][] = []

  for (const action of actions) {
    const lastWave = waves[waves.length - 1]
    if (!lastWave || lastWave[0]?.waveIndex !== action.waveIndex) {
      waves.push([action])
      continue
    }
    lastWave.push(action)
  }

  return waves
}

function getWaveCooldown(waveCount: number): number {
  if (waveCount > 30) return Math.round(WAVE_COOLDOWN_MS * 0.55)
  if (waveCount > 18) return Math.round(WAVE_COOLDOWN_MS * 0.75)
  return WAVE_COOLDOWN_MS
}

export function useBattlePlayback(snapshot: BattleSnapshot) {
  const unitHealth = ref(
    cloneUnitHealth([...snapshot.playerUnits, ...snapshot.enemyUnits]),
  )
  const activeAttackerIds = ref<string[]>([])
  const activeTargetIds = ref<string[]>([])
  const hitTargetIds = ref<string[]>([])
  const flyingProjectiles = ref<BattleProjectile[]>([])
  const damageFloats = ref<BattleDamageFloat[]>([])
  const hitWords = ref<BattleHitWord[]>([])
  const phase = ref<'playing' | 'done'>('playing')

  let floatId = 0
  let hitWordId = 0
  let projectileId = 0
  let cancelled = false
  let playbackPromise: Promise<void> | null = null

  const playbackWaves = computed(() => groupActionsByWave(snapshot.actions))

  function applyAction(action: BattleAction): void {
    const target = unitHealth.value[action.targetId]
    if (!target) return
    target.health = Math.max(0, target.health - action.damage)
  }

  function spawnDamageFloat(action: BattleAction): void {
    floatId += 1
    const id = floatId
    damageFloats.value.push({
      id,
      unitId: action.targetId,
      amount: action.damage,
      isCrit: action.isCrit,
    })
    window.setTimeout(() => {
      damageFloats.value = damageFloats.value.filter((entry) => entry.id !== id)
    }, 900)
  }

  function spawnHitWord(action: BattleAction): void {
    hitWordId += 1
    const id = hitWordId
    hitWords.value.push({
      id,
      unitId: action.targetId,
      word: pickBattleHitWord(),
      isCrit: action.isCrit,
    })
    window.setTimeout(() => {
      hitWords.value = hitWords.value.filter((entry) => entry.id !== id)
    }, 900)
  }

  async function playSingleAction(action: BattleAction): Promise<void> {
    if (cancelled) return
    if (!isAlive(action.attackerId) || !isAlive(action.targetId)) return

    activeAttackerIds.value = [action.attackerId]
    activeTargetIds.value = [action.targetId]
    await delay(WINDUP_MS)
    if (cancelled) return

    projectileId += 1
    flyingProjectiles.value = [{
      id: projectileId,
      attackerId: action.attackerId,
      targetId: action.targetId,
      isCrit: action.isCrit,
    }]
    await delay(FLIGHT_MS)
    if (cancelled) return

    flyingProjectiles.value = []
    applyAction(action)
    spawnDamageFloat(action)
    spawnHitWord(action)
    hitTargetIds.value = [action.targetId]
    await delay(IMPACT_MS)

    activeAttackerIds.value = []
    activeTargetIds.value = []
    hitTargetIds.value = []
  }

  async function playWave(actions: BattleAction[], cooldownMs: number): Promise<void> {
    if (cancelled) return

    const valid = actions.filter(
      (action) => isAlive(action.attackerId) && isAlive(action.targetId),
    )
    if (valid.length === 0) return

    for (let index = 0; index < valid.length; index += 1) {
      await playSingleAction(valid[index]!)
      if (cancelled) return
      if (index < valid.length - 1) {
        await delay(TEAM_MEMBER_GAP_MS)
      }
    }

    await delay(cooldownMs)
  }

  async function playActions(): Promise<void> {
    const waves = playbackWaves.value
    const cooldownMs = getWaveCooldown(waves.length)

    for (const wave of waves) {
      await playWave(wave, cooldownMs)
    }

    if (!cancelled) {
      await delay(FINISH_PAUSE_MS)
      phase.value = 'done'
    }
  }

  function start(): void {
    cancelled = false
    phase.value = 'playing'
    playbackPromise = playActions()
  }

  function cancel(): void {
    cancelled = true
    flyingProjectiles.value = []
    phase.value = 'done'
  }

  function healthPercent(unitId: string): number {
    const unit = unitHealth.value[unitId]
    if (!unit || unit.maxHealth <= 0) return 0
    return Math.max(0, Math.min(100, (unit.health / unit.maxHealth) * 100))
  }

  function isAlive(unitId: string): boolean {
    return (unitHealth.value[unitId]?.health ?? 0) > 0
  }

  onUnmounted(() => {
    cancel()
  })

  return {
    unitHealth,
    activeAttackerIds,
    activeTargetIds,
    hitTargetIds,
    flyingProjectiles,
    damageFloats,
    hitWords,
    phase,
    healthPercent,
    isAlive,
    start,
    cancel,
    playbackPromise,
  }
}
