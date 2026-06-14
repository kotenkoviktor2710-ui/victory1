import { getYsdk, isSdkMethodAvailable } from '@/yandex/sdk'
import { getSdkPlayer } from '@/yandex/player'
import type { YsdkLeaderboardEntry } from '@/yandex/types'

/** Техническое имя таблицы в консоли — замените на своё. */
export const LEADERBOARD_NAME = 'attackliderboard'

export interface LeaderEntry {
  rank: number
  name: string
  score: number
  uniqueId: string
  extraData?: string
  isCurrentPlayer: boolean
}

function mapEntry(
  entry: YsdkLeaderboardEntry,
  userRank: number | undefined,
): LeaderEntry {
  return {
    rank: entry.rank,
    name: entry.player?.publicName?.trim() || 'Игрок',
    score: entry.score,
    uniqueId: entry.player?.uniqueID ?? `rank-${entry.rank}`,
    extraData: entry.extraData,
    isCurrentPlayer: userRank != null && entry.rank === userRank,
  }
}

function getDevMockEntries(localBest = 0): LeaderEntry[] {
  const rows: Omit<LeaderEntry, 'rank'>[] = [
    {
      name: 'NoobMaster69',
      score: 1200,
      uniqueId: 'dev-opponent-1',
      extraData: JSON.stringify({
        v: 1,
        team: [
          { definitionId: 'huggy', level: 5 },
          { definitionId: 'catnap', level: 4 },
          { definitionId: 'boxy', level: 3 },
        ],
        power: 1400,
        updatedAt: Date.now(),
      }),
      isCurrentPlayer: false,
    },
    {
      name: 'Вы',
      score: localBest,
      uniqueId: 'dev-self',
      isCurrentPlayer: true,
    },
    {
      name: 'ToyHunter',
      score: 800,
      uniqueId: 'dev-opponent-2',
      extraData: JSON.stringify({
        v: 1,
        team: [
          { definitionId: 'dogday', level: 3 },
          { definitionId: 'bunzo', level: 4 },
        ],
        power: 900,
        updatedAt: Date.now(),
      }),
      isCurrentPlayer: false,
    },
  ]

  return rows
    .sort((a, b) => b.score - a.score)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }))
}

/**
 * Отправить счёт в лидерборд.
 * @see https://yandex.ru/dev/games/doc/ru/sdk/sdk-leaderboard
 */
export async function submitLeaderboardScore(score: number, extraData?: string): Promise<void> {
  const normalized = Math.floor(score)
  if (normalized <= 0) return

  const sdk = getYsdk()
  if (!sdk) {
    if (import.meta.env.DEV) {
      console.info('[leaderboard] dev stub setScore', LEADERBOARD_NAME, normalized)
    }
    return
  }

  if (!(await isSdkMethodAvailable('leaderboards.setScore'))) {
    if (import.meta.env.DEV) console.info('[leaderboard] setScore unavailable (auth required?)')
    return
  }

  await getSdkPlayer()

  try {
    if (sdk.leaderboards?.setScore) {
      await sdk.leaderboards.setScore(LEADERBOARD_NAME, normalized, extraData)
      return
    }

    if (sdk.getLeaderboards) {
      const lb = await sdk.getLeaderboards()
      await lb.setLeaderboardScore(LEADERBOARD_NAME, normalized)
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[leaderboard] setScore failed', err)
  }
}

export async function fetchLeaderboardEntries(localBest = 0): Promise<LeaderEntry[]> {
  const sdk = getYsdk()
  if (!sdk) {
    if (import.meta.env.DEV) return getDevMockEntries(localBest)
    return []
  }

  await getSdkPlayer()

  try {
    let userRank: number | undefined
    let entries: YsdkLeaderboardEntry[] = []

    if (sdk.leaderboards?.getEntries) {
      const result = await sdk.leaderboards.getEntries(LEADERBOARD_NAME, {
        quantityTop: 10,
        includeUser: true,
        quantityAround: 3,
      })
      userRank = result.userRank
      entries = result.entries ?? []
    } else if (sdk.getLeaderboards) {
      const lb = await sdk.getLeaderboards()
      const result = await lb.getLeaderboardEntries(LEADERBOARD_NAME, {
        quantityTop: 10,
        includeUser: true,
        quantityAround: 3,
      })
      userRank = result.userRank
      entries = result.entries ?? []
    }

    const mapped = entries.map((entry) => mapEntry(entry, userRank))
    if (localBest <= 0) return mapped

    return mapped.map((entry) =>
      entry.isCurrentPlayer && localBest > entry.score ? { ...entry, score: localBest } : entry,
    )
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[leaderboard] getEntries failed', err)
    throw err
  }
}
