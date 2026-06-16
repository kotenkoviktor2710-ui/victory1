// Thin wrapper around the Yandex Games SDK.
// In dev (or any page without window.YaGames) returns null and we fall back
// to dev stubs in the ads module.

import { applyLocale, getActiveLocale, resolvePlatformLocale } from '@/i18n'
import { bindPlatformPauseEvents } from '@/yandex/platformEvents'
import type {
  Ysdk,
  YsdkFullscreenCallbacks,
  YsdkRewardedCallbacks,
} from '@/yandex/types'

export type {
  Ysdk,
  YsdkAdv,
  YsdkAuth,
  YsdkDeviceInfo,
  YsdkEnvironment,
  YsdkFeedback,
  YsdkFlagsParams,
  YsdkFullscreenCallbacks,
  YsdkLeaderboardEntry,
  YsdkLeaderboards,
  YsdkPayments,
  YsdkPlayer,
  YsdkProduct,
  YsdkPromoReferrer,
  YsdkPurchase,
  YsdkRewardedCallbacks,
  PurchaseGrantHandler,
  SdkEventName,
} from '@/yandex/types'

let ysdk: Ysdk | null = null
let initPromise: Promise<Ysdk | null> | null = null
let sessionStartMs: number | null = null

/** Серверное время Yandex SDK (`ysdk.serverTime()`); в dev без SDK — локальное время. */
export function getServerTime(): number {
  try {
    return ysdk?.serverTime() ?? Date.now()
  } catch {
    return Date.now()
  }
}

/** Момент старта сессии по серверному времени (для кулдаунов рекламы). */
export function getSessionStartMs(): number {
  if (sessionStartMs === null) {
    sessionStartMs = getServerTime()
  }
  return sessionStartMs
}

/**
 * Wait for `window.YaGames` to become available. The SDK <script> tag is
 * synchronous in index.html, so it should be ready by the time this runs,
 * but we poll briefly to be resilient against slow networks / CDN hiccups.
 */
function waitForYaGames(timeoutMs = 5000): Promise<unknown | null> {
  if ((window as Window & { YaGames?: unknown }).YaGames) {
    return Promise.resolve((window as Window & { YaGames?: unknown }).YaGames)
  }
  return new Promise((resolve) => {
    const start = Date.now()
    const id = window.setInterval(() => {
      if ((window as Window & { YaGames?: unknown }).YaGames) {
        clearInterval(id)
        resolve((window as Window & { YaGames?: unknown }).YaGames)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(id)
        resolve(null)
      }
    }, 50)
  })
}

export function initYandex(): Promise<Ysdk | null> {
  if (initPromise) return initPromise

  const p: Promise<Ysdk | null> = waitForYaGames().then((YaGames: unknown) => {
    const games = YaGames as { init?: () => Promise<Ysdk> } | null
    if (!games || typeof games.init !== 'function') {
      const locale = applyLocale(resolvePlatformLocale(null))
      if (import.meta.env.DEV) {
        console.info('[yandex sdk] YaGames not present — running without SDK (dev mode ok)', {
          locale,
        })
      }
      return null
    }
    return games
      .init()
      .then((sdk: Ysdk) => {
        ysdk = sdk
        sessionStartMs = getServerTime()
        const locale = applyLocale(resolvePlatformLocale(sdk))
        bindPlatformPauseEvents()
        if (import.meta.env.DEV) {
          console.info('[yandex sdk] initialized', { locale, env: sdk.environment })
        }
        return sdk
      })
      .catch((err: unknown) => {
        applyLocale(resolvePlatformLocale(null))
        if (import.meta.env.DEV) console.warn('[yandex sdk] init failed', err)
        return null
      })
  })

  initPromise = p
  return p
}

export function getYsdk(): Ysdk | null {
  return ysdk
}

export function isYsdkReady(): boolean {
  return ysdk !== null
}

/** Проверка доступности метода SDK (например leaderboards.setScore). */
export async function isSdkMethodAvailable(method: string): Promise<boolean> {
  const sdk = getYsdk()
  if (!sdk?.isAvailableMethod) return import.meta.env.DEV
  try {
    return await sdk.isAvailableMethod(method)
  } catch {
    return false
  }
}

/** Язык интерфейса из ysdk.environment.i18n.lang (ISO 639-1). */
export function getLang(): string {
  return getActiveLocale()
}

/** Синхронизирует `<html lang>` с языком платформы. */
export function syncDocumentLang(): void {
  document.documentElement.lang = getActiveLocale()
}

let gameplayInitDone = false
let gameplayPauseDepth = 0
let gameplayLastSent: 'start' | 'stop' | null = null

function syncGameplay(): void {
  if (!gameplayInitDone) return
  const want: 'start' | 'stop' = gameplayPauseDepth === 0 ? 'start' : 'stop'
  if (want === gameplayLastSent) return
  gameplayLastSent = want
  try {
    if (want === 'start') ysdk?.features?.GameplayAPI?.start()
    else ysdk?.features?.GameplayAPI?.stop()
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[yandex sdk] GameplayAPI.' + want + '() failed', err)
    }
  }
}

/** Вызвать ОДИН раз, когда игра готова к геймплею (после LoadingAPI.ready). */
export function gameplayInit(): void {
  if (gameplayInitDone) return
  gameplayInitDone = true
  syncGameplay()
}

/** Reference-counted pause (модалка, реклама, вкладка). */
export function gameplayPause(): void {
  gameplayPauseDepth++
  syncGameplay()
}

/** Reference-counted resume. */
export function gameplayResume(): void {
  if (gameplayPauseDepth === 0) return
  gameplayPauseDepth--
  syncGameplay()
}

/** Текущая глубина паузы (0 = геймплей активен). */
export function getGameplayPauseDepth(): number {
  return gameplayPauseDepth
}

let reviewRequested = false

export async function checkCanReview(): Promise<boolean> {
  if (reviewRequested) return false
  const sdk = getYsdk()
  if (!sdk?.feedback) return import.meta.env.DEV
  try {
    const { value } = await sdk.feedback.canReview()
    return value
  } catch {
    return false
  }
}

export async function openPlatformReview(): Promise<boolean> {
  if (reviewRequested) return false
  const sdk = getYsdk()
  if (!sdk?.feedback) {
    if (import.meta.env.DEV) {
      reviewRequested = true
      console.info('[yandex sdk] review (dev stub)')
      return true
    }
    return false
  }
  try {
    const { value, reason } = await sdk.feedback.canReview()
    if (!value) {
      if (import.meta.env.DEV) console.info('[yandex sdk] review unavailable:', reason)
      return false
    }
    reviewRequested = true
    const { feedbackSent } = await sdk.feedback.requestReview()
    if (import.meta.env.DEV) console.info('[yandex sdk] review sent:', feedbackSent)
    return feedbackSent
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[yandex sdk] requestReview failed', err)
    reviewRequested = false
    return false
  }
}

/** @deprecated Используйте tryShowPlatformReviewWhenSafe из @/yandex/reviewPrompt */
export async function tryRequestReview(): Promise<void> {
  const { tryShowPlatformReviewWhenSafe } = await import('@/yandex/reviewPrompt')
  tryShowPlatformReviewWhenSafe()
}
