import { getSdkPlayer } from '@/yandex/player'
import { getYsdk } from '@/yandex/sdk'

/** Ключ сохранения в облаке игрока — замените на свой. */
export const DEFAULT_SAVE_KEY = 'app_save'

const DEV_LS_PREFIX = 'yandex-template-save:'

/** Яндекс SDK: не чаще ~20 запросов setData за 5 минут */
const SET_DATA_MIN_GAP_MS = 15_000

let playerBlob: Record<string, unknown> | null = null
let playerBlobPromise: Promise<Record<string, unknown>> | null = null
let pendingFlush = false
let writeTimer: ReturnType<typeof setTimeout> | null = null
let lastSetDataAt = 0
let writeInFlight = false

function shouldUseLocalStorage(): boolean {
  return import.meta.env.DEV
}

function toPlainRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

export async function ensurePlayer(): Promise<boolean> {
  return (await getSdkPlayer()) !== null
}

async function loadPlayerBlob(): Promise<Record<string, unknown>> {
  if (playerBlob) return playerBlob
  if (playerBlobPromise) return playerBlobPromise

  playerBlobPromise = (async () => {
    if (shouldUseLocalStorage()) {
      playerBlob = {}
      return playerBlob
    }

    const player = await getSdkPlayer()
    if (!player?.getData) {
      playerBlob = {}
      return playerBlob
    }

    try {
      playerBlob = (await player.getData()) ?? {}
    } catch {
      playerBlob = {}
    }

    return playerBlob
  })()

  return playerBlobPromise
}

function schedulePlayerWrite(flush: boolean): void {
  if (flush) pendingFlush = true

  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    writeTimer = null
    void flushPlayerData(pendingFlush)
  }, flush ? 0 : 3_000)
}

async function flushPlayerData(forceFlush = false): Promise<void> {
  if (shouldUseLocalStorage() || !playerBlob) return

  const player = await getSdkPlayer()
  if (!player?.setData) return

  const now = Date.now()
  const shouldFlush = forceFlush || pendingFlush
  if (!shouldFlush && now - lastSetDataAt < SET_DATA_MIN_GAP_MS) {
    schedulePlayerWrite(true)
    return
  }

  if (writeInFlight) {
    schedulePlayerWrite(shouldFlush)
    return
  }

  writeInFlight = true
  pendingFlush = false

  try {
    await player.setData(toPlainRecord(playerBlob), shouldFlush)
    lastSetDataAt = Date.now()
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[playerStorage] setData failed', err)
  } finally {
    writeInFlight = false
  }
}

export async function flushPlayerDataNow(): Promise<void> {
  if (writeTimer) {
    clearTimeout(writeTimer)
    writeTimer = null
  }
  await flushPlayerData(true)
}

export async function loadPlayerData<T>(key: string = DEFAULT_SAVE_KEY): Promise<T | null> {
  if (shouldUseLocalStorage()) {
    try {
      const raw = localStorage.getItem(DEV_LS_PREFIX + key)
      if (!raw) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  const blob = await loadPlayerBlob()
  const raw = blob[key]
  if (raw == null) return null
  return raw as T
}

export async function savePlayerData(
  data: unknown,
  key: string = DEFAULT_SAVE_KEY,
  flush = false,
): Promise<void> {
  if (shouldUseLocalStorage()) {
    try {
      localStorage.setItem(DEV_LS_PREFIX + key, JSON.stringify(data))
    } catch {
      /* ignore */
    }
    return
  }

  if (!getYsdk()?.getPlayer) return

  const blob = await loadPlayerBlob()
  blob[key] = toPlainRecord(
    data && typeof data === 'object' ? (data as Record<string, unknown>) : { value: data },
  )
  schedulePlayerWrite(flush)
}

/** Сброс кэша облачного blob после смены аккаунта. */
export function resetPlayerStorageCache(): void {
  playerBlob = null
  playerBlobPromise = null
}
