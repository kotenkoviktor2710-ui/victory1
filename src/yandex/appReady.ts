import { getYsdk, gameplayInit, syncDocumentLang } from '@/yandex/sdk'

let readyCalled = false

/** Сигнал платформе: игра загружена, игрок может начать. Вызывать после прогресса и UI. */
export function markAppReady(): void {
  if (readyCalled) return
  readyCalled = true

  syncDocumentLang()

  try {
    getYsdk()?.features?.LoadingAPI?.ready()
  } catch {
    /* ignore */
  }

  gameplayInit()
}

export function isAppReady(): boolean {
  return readyCalled
}
