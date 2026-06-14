import { computed, onUnmounted, ref } from 'vue'

import type { BattleAction, BattleSnapshot, CombatUnit } from '@/domain/formulas/combat'

export interface BattleDamageFloat {
  id: number
  unitId: string
  amount: number
  isCrit: boolean
}

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

export function useBattlePlayback(snapshot: BattleSnapshot) {
  const unitHealth = ref(
    cloneUnitHealth([...snapshot.playerUnits, ...snapshot.enemyUnits]),
  )
  const activeAttackerId = ref<string | null>(null)
  const activeTargetId = ref<string | null>(null)
  const hitTargetId = ref<string | null>(null)
  const damageFloats = ref<BattleDamageFloat[]>([])
  const phase = ref<'playing' | 'done'>('playing')

  let floatId = 0
  let cancelled = false
  let playbackPromise: Promise<void> | null = null

  const actionDelay = computed(() => {
    const count = snapshot.actions.length
    if (count > 80) return 180
    if (count > 40) return 320
    return 520
  })

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
    }, 780)
  }

  async function playActions(): Promise<void> {
    for (const action of snapshot.actions) {
      if (cancelled) return

      activeAttackerId.value = action.attackerId
      activeTargetId.value = action.targetId
      await delay(Math.round(actionDelay.value * 0.42))

      if (cancelled) return

      applyAction(action)
      hitTargetId.value = action.targetId
      spawnDamageFloat(action)
      await delay(Math.round(actionDelay.value * 0.58))

      activeAttackerId.value = null
      activeTargetId.value = null
      hitTargetId.value = null
    }

    if (!cancelled) phase.value = 'done'
  }

  function start(): void {
    cancelled = false
    phase.value = 'playing'
    playbackPromise = playActions()
  }

  function cancel(): void {
    cancelled = true
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
    damageFloats,
    phase,
    healthPercent,
    isAlive,
    start,
    cancel,
    playbackPromise,
  }
}
