import { encodeDefenseExtra } from '@/domain/pvp/defenseSnapshot'
import type { InboundAttack, PvpAttackPayload, PvpTeamSlot } from '@/domain/pvp/types'
import { fetchLeaderboardEntries, submitLeaderboardScore, type LeaderEntry } from '@/yandex/leaderboard'
import {
  commitMultiplayerPayload,
  initMultiplayerSessions,
  pushMultiplayerSession,
} from '@/yandex/multiplayer'
import { getPlayerUniqueId } from '@/yandex/player'
import { getServerTime } from '@/yandex/sdk'

const RATING_WINDOW = 800

function parseAttackPayload(payload: unknown): PvpAttackPayload | null {
  if (!payload || typeof payload !== 'object') return null
  const raw = payload as Partial<PvpAttackPayload>
  if (raw.type !== 'pvp_attack' || !Array.isArray(raw.team) || raw.team.length === 0) return null

  const team = raw.team
    .filter(
      (slot): slot is PvpTeamSlot =>
        typeof slot?.definitionId === 'string' && typeof slot?.level === 'number',
    )
    .slice(0, 5)

  if (team.length === 0) return null

  return {
    type: 'pvp_attack',
    team,
    power: typeof raw.power === 'number' ? raw.power : 0,
    rating: typeof raw.rating === 'number' ? raw.rating : 0,
  }
}

function sessionToInboundAttack(session: {
  id: string
  player?: { name?: string; avatar?: string }
  timeline?: Array<{ payload?: unknown }>
}): InboundAttack | null {
  const lastPayload = session.timeline?.[session.timeline.length - 1]?.payload
  const attack = parseAttackPayload(lastPayload)
  if (!attack) return null

  return {
    sessionId: session.id,
    attackerName: session.player?.name?.trim() || 'Игрок',
    attackerAvatar: session.player?.avatar,
    team: attack.team,
    power: attack.power,
    rating: attack.rating,
  }
}

export async function publishPvpDefense(
  rating: number,
  team: PvpTeamSlot[],
  power: number,
): Promise<void> {
  if (team.length === 0 || rating <= 0) return
  const extraData = encodeDefenseExtra(team, power, getServerTime())
  await submitLeaderboardScore(rating, extraData)
}

export async function recordPvpAttackSession(
  rating: number,
  team: PvpTeamSlot[],
  power: number,
): Promise<void> {
  if (team.length === 0) return

  const payload: PvpAttackPayload = {
    type: 'pvp_attack',
    team,
    power,
    rating,
  }

  await commitMultiplayerPayload(payload as unknown as Record<string, unknown>)
  await pushMultiplayerSession({
    meta1: Math.max(0, Math.floor(rating)),
    meta2: Math.max(0, Math.floor(power)),
  })
}

export async function fetchPvpLeaderboardOpponents(localRating: number): Promise<LeaderEntry[]> {
  try {
    return await fetchLeaderboardEntries(localRating)
  } catch {
    return []
  }
}

export async function fetchInboundAttacks(
  rating: number,
  seenSessionIds: string[],
): Promise<InboundAttack[]> {
  const minRating = Math.max(0, rating - RATING_WINDOW)
  const maxRating = rating + RATING_WINDOW

  const sessions = await initMultiplayerSessions({
    count: 5,
    isEventBased: false,
    meta: {
      meta1: { min: minRating, max: maxRating },
    },
  })

  const seen = new Set(seenSessionIds)

  return sessions
    .filter((session) => session.id && !seen.has(session.id))
    .map(sessionToInboundAttack)
    .filter((attack): attack is InboundAttack => attack !== null)
}

export async function pickInboundAttack(
  rating: number,
  seenSessionIds: string[],
): Promise<InboundAttack | null> {
  const selfId = await getPlayerUniqueId()
  const attacks = await fetchInboundAttacks(rating, seenSessionIds)
  const pool = attacks.filter((attack) => attack.sessionId !== selfId)
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]!
}
