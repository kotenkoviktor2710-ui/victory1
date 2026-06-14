import { computed, onUnmounted, ref } from 'vue'

import type { BattleAction, BattleSnapshot, CombatUnit } from '@/domain/formulas/combat'

export interface BattleDamageFloat {
  id: number
  unitId: string
  amount: number
  isCrit: boolean
}

export interface BattleProjectile {
  id: number
  attackerId: string
  targetId: string
  isCrit: boolean
}

const WINDUP_MS = 420
const FLIGHT_MS = 560
const IMPACT_MS = 480
const COOLDOWN_MS = 280
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

function getActionCooldown(actionCount: number): number {
  if (actionCount > 60) return Math.round(COOLDOWN_MS * 0.55)
  if (actionCount > 35) return Math.round(COOLDOWN_MS * 0.75)
  return COOLDOWN_MS
}

export function useBattlePlayback(snapshot: BattleSnapshot) {
  const unitHealth = ref(
    cloneUnitHealth([...snapshot.playerUnits, ...snapshot.enemyUnits]),
  )
  const activeAttackerId = ref<string | null>(null)
  const activeTargetId = ref<string | null>(null)
  const hitTargetId = ref<string | null>(null)
  const flyingProjectile = ref<BattleProjectile | null>(null)
  const damageFloats = ref<BattleDamageFloat[]>([])
  const phase = ref<'playing' | 'done'>('playing')

  let floatId = 0
  let projectileId = 0
  let cancelled = false
  let playbackPromise: Promise<void> | null = null

  const playbackActions = computed(() => snapshot.actions)

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

  async function playAction(action: BattleAction, cooldownMs: number): Promise<void> {
    if (cancelled) return
    if (!isAlive(action.attackerId) || !isAlive(action.targetId)) return

    activeAttackerId.value = action.attackerId
    activeTargetId.value = action.targetId
    await delay(WINDUP_MS)
    if (cancelled) return

    projectileId += 1
    flyingProjectile.value = {
      id: projectileId,
      attackerId: action.attackerId,
      targetId: action.targetId,
      isCrit: action.isCrit,
    }
    await delay(FLIGHT_MS)
    if (cancelled) return

    flyingProjectile.value = null
    applyAction(action)
    hitTargetId.value = action.targetId
    spawnDamageFloat(action)
    await delay(IMPACT_MS)

    activeAttackerId.value = null
    activeTargetId.value = null
    hitTargetId.value = null
    await delay(cooldownMs)
  }

  async function playActions(): Promise<void> {
    const actions = playbackActions.value
    const cooldownMs = getActionCooldown(actions.length)

    for (const action of actions) {
      await playAction(action, cooldownMs)
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
    flyingProjectile.value = null
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
    activeAttackerId,
    activeTargetId,
    hitTargetId,
    flyingProjectile,
    damageFloats,
    phase,
    healthPercent,
    isAlive,
    start,
    cancel,
    playbackPromise,
  }
}
