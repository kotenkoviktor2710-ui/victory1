import { getYsdk, initYandex } from '@/yandex/sdk'
import type { YsdkPlayer } from '@/yandex/types'

let cachedPlayer: YsdkPlayer | null = null
let playerPromise: Promise<YsdkPlayer | null> | null = null

export async function getSdkPlayer(): Promise<YsdkPlayer | null> {
  if (cachedPlayer) return cachedPlayer
  if (playerPromise) return playerPromise

  playerPromise = (async () => {
    await initYandex()
    const sdk = getYsdk()
    if (!sdk?.getPlayer) return null
    try {
      cachedPlayer = await sdk.getPlayer({ scopes: false })
      return cachedPlayer
    } catch {
      return null
    }
  })()

  return playerPromise
}

export async function isPlayerAuthorized(): Promise<boolean> {
  const player = await getSdkPlayer()
  return Boolean(player?.isAuthorized?.())
}

export async function openAuthDialog(): Promise<boolean> {
  const sdk = getYsdk()
  if (!sdk?.auth?.openAuthDialog) return false
  try {
    await sdk.auth.openAuthDialog()
    cachedPlayer = null
    playerPromise = null
    await getSdkPlayer()
    return true
  } catch {
    return false
  }
}

export async function getPlayerUniqueId(): Promise<string | null> {
  const player = await getSdkPlayer()
  return player?.getUniqueID() ?? null
}

export async function getPlayerPublicName(): Promise<string> {
  const player = await getSdkPlayer()
  return player?.getName()?.trim() || 'Игрок'
}

export async function loadPlayerStats(keys?: string[]): Promise<Record<string, number>> {
  const player = await getSdkPlayer()
  if (!player?.getStats) return {}
  try {
    return (await player.getStats(keys)) ?? {}
  } catch {
    return {}
  }
}

export async function savePlayerStats(stats: Record<string, number>): Promise<void> {
  const player = await getSdkPlayer()
  if (!player?.setStats) return
  await player.setStats(stats)
}

export async function incrementPlayerStats(
  increments: Record<string, number>,
): Promise<Record<string, number>> {
  const player = await getSdkPlayer()
  if (!player?.incrementStats) return {}
  try {
    return (await player.incrementStats(increments)) ?? {}
  } catch {
    return {}
  }
}

/** Сброс кэша после смены аккаунта. */
export function resetPlayerCache(): void {
  cachedPlayer = null
  playerPromise = null
}

/**
 * safeStorage для своего домена на iOS (потеря localStorage).
 * @see https://yandex.ru/dev/games/doc/ru/sdk/sdk-player
 */
export async function setupSafeStorage(): Promise<boolean> {
  const sdk = getYsdk()
  if (!sdk?.getStorage) return false
  try {
    const safeStorage = await sdk.getStorage()
    Object.defineProperty(window, 'localStorage', { get: () => safeStorage })
    return true
  } catch {
    return false
  }
}
