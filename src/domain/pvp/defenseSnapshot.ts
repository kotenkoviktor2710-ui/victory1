import type { ToyDefinition } from '@/domain/types/toy'

import type { PvpDefenseExtra, PvpTeamSlot } from './types'

export function encodeDefenseExtra(
  team: PvpTeamSlot[],
  power: number,
  updatedAt: number,
): string {
  const payload: PvpDefenseExtra = {
    v: 1,
    team,
    power,
    updatedAt,
  }
  return JSON.stringify(payload)
}

export function decodeDefenseExtra(raw: string | undefined): PvpDefenseExtra | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw) as Partial<PvpDefenseExtra>
    if (parsed.v !== 1 || !Array.isArray(parsed.team) || parsed.team.length === 0) return null
    const team = parsed.team
      .filter(
        (slot): slot is PvpTeamSlot =>
          typeof slot?.definitionId === 'string' && typeof slot?.level === 'number',
      )
      .slice(0, 5)
    if (team.length === 0) return null
    return {
      v: 1,
      team,
      power: typeof parsed.power === 'number' ? parsed.power : 0,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    }
  } catch {
    return null
  }
}

export function teamSlotsToCombatTeam(
  slots: PvpTeamSlot[],
  catalogById: Record<string, ToyDefinition>,
): { definition: ToyDefinition; level: number }[] {
  return slots
    .map((slot) => {
      const definition = catalogById[slot.definitionId]
      if (!definition) return null
      return { definition, level: Math.max(1, slot.level) }
    })
    .filter((member): member is { definition: ToyDefinition; level: number } => member !== null)
}
