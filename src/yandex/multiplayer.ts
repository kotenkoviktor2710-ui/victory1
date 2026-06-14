import { getYsdk } from '@/yandex/sdk'
import type {
  YsdkMultiplayerSession,
  YsdkMultiplayerSessionsInitOptions,
} from '@/yandex/types'

let recordModeReady = false

function getSessionsApi() {
  const sdk = getYsdk()
  return sdk?.multiplayer?.sessions ?? null
}

export async function initMultiplayerSessions(
  options: YsdkMultiplayerSessionsInitOptions,
): Promise<YsdkMultiplayerSession[]> {
  const sessions = getSessionsApi()
  if (!sessions?.init) {
    if (import.meta.env.DEV) return getDevSessions(options.count ?? 0)
    return []
  }

  try {
    const loaded = await sessions.init(options)
    return loaded ?? []
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[multiplayer] init failed', err)
    return []
  }
}

export async function ensureMultiplayerRecordMode(): Promise<boolean> {
  if (recordModeReady) return true
  const sessions = getSessionsApi()
  if (!sessions?.init) return import.meta.env.DEV

  try {
    await sessions.init({ count: 0 })
    recordModeReady = true
    return true
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[multiplayer] record init failed', err)
    return false
  }
}

export async function commitMultiplayerPayload(payload: Record<string, unknown>): Promise<void> {
  const ready = await ensureMultiplayerRecordMode()
  if (!ready) return

  const sessions = getSessionsApi()
  if (!sessions?.commit) return

  try {
    sessions.commit(payload)
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[multiplayer] commit failed', err)
  }
}

export async function pushMultiplayerSession(meta: {
  meta1?: number
  meta2?: number
  meta3?: number
}): Promise<void> {
  const ready = await ensureMultiplayerRecordMode()
  if (!ready) return

  const sessions = getSessionsApi()
  if (!sessions?.push) return

  try {
    await sessions.push(meta)
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[multiplayer] push failed', err)
  }
}

function getDevSessions(count: number): YsdkMultiplayerSession[] {
  if (count <= 0) return []
  const names = ['NoobMaster69', 'ToyHunter', 'MergeKing', 'PvP_Pro']
  return names.slice(0, Math.min(count, names.length)).map((name, index) => ({
    id: `dev-session-${index}`,
    meta: { meta1: 500 + index * 120, meta2: 800 + index * 50 },
    player: { name, avatar: '' },
    timeline: [
      {
        id: `dev-tx-${index}`,
        time: 0,
        payload: {
          type: 'pvp_attack',
          team: [
            { definitionId: 'huggy', level: 3 + index },
            { definitionId: 'catnap', level: 2 + index },
            { definitionId: 'boxy', level: 4 },
          ],
          power: 900 + index * 100,
          rating: 500 + index * 120,
        },
      },
    ],
  }))
}
