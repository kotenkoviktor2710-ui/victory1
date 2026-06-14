import type { LeaderEntry } from '@/yandex/leaderboard'

import { decodeDefenseExtra } from './defenseSnapshot'
import type { PvpOpponent } from './types'

export function leaderEntryToOpponent(entry: LeaderEntry): PvpOpponent | null {
  const defense = decodeDefenseExtra(entry.extraData)
  if (!defense) return null

  return {
    uniqueId: entry.uniqueId,
    name: entry.name,
    rating: entry.score,
    team: defense.team,
    power: defense.power,
  }
}

export function pickRandomOpponent(
  entries: LeaderEntry[],
  selfUniqueId: string | null,
): PvpOpponent | null {
  const pool = entries
    .filter((entry) => !selfUniqueId || entry.uniqueId !== selfUniqueId)
    .map(leaderEntryToOpponent)
    .filter((opponent): opponent is PvpOpponent => opponent !== null)

  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]!
}
