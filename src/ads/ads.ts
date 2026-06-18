// Ads orchestration: cooldowns, dev stubs, pause / mute lifecycle.
// Game loop pause + audio mute are dispatched via window CustomEvents so
// non-Vue code (this module) doesn't need to import the game/store.

import { ref, readonly } from 'vue'
import {
  getServerTime,
  getSessionStartMs,
  getYsdk,
  type YsdkFullscreenCallbacks,
  type YsdkRewardedCallbacks,
} from '@/yandex/sdk'
import { scheduleAfterServerMs } from '@/yandex/serverTimeTimers'

const FIRST_AD_GAP = 60_000 // no interstitial in first minute (Yandex requirement)
const INTERSTITIAL_MIN_GAP = 90_000 // our cooldown — 30s stricter than SDK
const INTER_TO_REWARD_GAP = 30_000 // don't pile ads back-to-back

export interface InterstitialOptions {
  /** Явный клик игрока (новая игра, рестарт) — не блокировать FIRST_AD_GAP */
  userInitiated?: boolean
  /** Плановая реклама в геймплее (каждые 2 мин) */
  scheduled?: boolean
  /** Всегда вызывать SDK, без клиентских кулдаунов (рестарт и т.п.) */
  forceAttempt?: boolean
}

let lastInterstitialAt = 0
let lastAnyAdAt = 0
let startupAdShown = false
const adPlaying = ref(false)
let adBreakBlocking = false

/** Блокировка UI во время отсчёта перед плановой рекламой. */
export function setAdBreakBlocking(blocked: boolean): void {
  adBreakBlocking = blocked
}

export function isAdBreakBlocking(): boolean {
  return adBreakBlocking
}

function overlaySafeFromAds(): boolean {
  return !adPlaying.value && !adBreakBlocking
}

let adWatchdogId: ReturnType<typeof setTimeout> | null = null

function clearAdWatchdog(): void {
  if (adWatchdogId !== null) {
    window.clearTimeout(adWatchdogId)
    adWatchdogId = null
  }
}

/** Пауза всего звука (ref-count: отсчёт + реклама). */
export function pauseAdAudio(): void {
  window.dispatchEvent(new CustomEvent('ads:audio-pause'))
}

/** Возобновление звука после парной pauseAdAudio(). */
export function resumeAdAudio(): void {
  window.dispatchEvent(new CustomEvent('ads:audio-resume'))
}

function emitPause() {
  adPlaying.value = true
  pauseAdAudio()
  window.dispatchEvent(new CustomEvent('ads:pause'))
}
function emitResume() {
  adPlaying.value = false
  clearAdWatchdog()
  resumeAdAudio()
  window.dispatchEvent(new CustomEvent('ads:resume'))
}

/** Если SDK не вызвал onClose/onError — не блокировать игру навсегда. */
function armAdWatchdog(onTimeout: () => void): void {
  clearAdWatchdog()
  adWatchdogId = window.setTimeout(() => {
    adWatchdogId = null
    if (import.meta.env.DEV) console.warn('[ads] watchdog: forcing ad resume')
    onTimeout()
  }, 90_000)
}

export const adPlayingRef = readonly(adPlaying)

export function adsPlaying(): boolean {
  return adPlaying.value
}

/** Минимальная пауза после любой рекламы перед UI (оценка, подсказки). */
const UI_AFTER_AD_GAP = 5_000

export function msSinceLastAd(): number {
  if (lastAnyAdAt === 0) return Number.POSITIVE_INFINITY
  return getServerTime() - lastAnyAdAt
}

/** Сколько мс ждать до следующего interstitial по общим кулдаунам. */
export function msUntilInterstitialReady(options?: InterstitialOptions): number {
  if (adPlaying.value) return 500

  const userInitiated = options?.userInitiated === true
  if (userInitiated) return 0

  const now = getServerTime()
  let wait = 0

  const untilFirstAd = FIRST_AD_GAP - (now - getSessionStartMs())
  if (untilFirstAd > 0) wait = Math.max(wait, untilFirstAd)

  if (lastInterstitialAt > 0) {
    const untilInterstitial = INTERSTITIAL_MIN_GAP - (now - lastInterstitialAt)
    if (untilInterstitial > 0) wait = Math.max(wait, untilInterstitial)
  }

  if (lastAnyAdAt > 0) {
    const untilAnyAd = INTER_TO_REWARD_GAP - (now - lastAnyAdAt)
    if (untilAnyAd > 0) wait = Math.max(wait, untilAnyAd)
  }

  return wait
}

/**
 * Выполнить callback, когда реклама не идёт и прошёл буфер после последнего показа.
 */
export function runWhenSafeFromAds(fn: () => void): void {
  const attempt = () => {
    if (!overlaySafeFromAds()) {
      if (adsPlaying()) {
        window.addEventListener(
          'ads:resume',
          () => scheduleAfterServerMs(UI_AFTER_AD_GAP, attempt),
          { once: true },
        )
      } else {
        scheduleAfterServerMs(500, attempt)
      }
      return
    }
    const elapsed = msSinceLastAd()
    if (elapsed < UI_AFTER_AD_GAP) {
      scheduleAfterServerMs(UI_AFTER_AD_GAP - elapsed, attempt)
      return
    }
    fn()
  }
  attempt()
}

export function canShowInterstitial(options?: InterstitialOptions): boolean {
  if (adPlaying.value) return false

  const userInitiated = options?.userInitiated === true
  if (import.meta.env.DEV && userInitiated) return true
  if (userInitiated) return true

  return msUntilInterstitialReady(options) <= 0
}

function markInterstitialShown(): void {
  lastInterstitialAt = getServerTime()
  lastAnyAdAt = lastInterstitialAt
}

function createFullscreenCallbacks(onDone: () => void) {
  let pauseEmitted = false
  let tracked = false

  const trackShow = (): void => {
    if (tracked) return
    tracked = true
    markInterstitialShown()
  }

  const pauseOnce = () => {
    if (pauseEmitted) return
    pauseEmitted = true
    emitPause()
  }
  const resumeOnce = () => {
    if (pauseEmitted) emitResume()
  }
  const finish = () => {
    resumeOnce()
    try {
      onDone()
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ads] interstitial onDone failed', err)
    }
  }

  return {
    onOpen: () => {
      trackShow()
      pauseOnce()
    },
    onClose: (wasShown = false) => {
      if (wasShown) trackShow()
      finish()
    },
    onError: () => finish(),
    onOffline: () => finish(),
  }
}

/**
 * Полноэкранная реклама при первом открытии игры в сессии.
 * Не ждёт минутный кулдаун — показывается сразу после загрузки.
 */
export function showStartupInterstitial(onDone?: () => void): void {
  const finish = () => {
    try {
      onDone?.()
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ads] startup onDone failed', err)
    }
  }

  if (startupAdShown || adPlaying.value) {
    finish()
    return
  }

  startupAdShown = true
  markInterstitialShown()

  const ysdk = getYsdk()
  if (!ysdk) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[ads] startup interstitial (dev stub)')
    }
    finish()
    return
  }

  showFullscreenAdvSafe(createFullscreenCallbacks(finish), finish)
}

/**
 * Try to show a fullscreen interstitial. No-op if cooldown is not satisfied
 * or the SDK is unavailable. Always safe to call.
 */
export function showInterstitial(_reason?: string, options?: InterstitialOptions): void {
  showInterstitialThen(() => {}, _reason, options)
}

/**
 * Показать полноэкранную рекламу, затем выполнить callback.
 * forceAttempt / userInitiated — всегда вызывают SDK (частоту решает платформа).
 */
export function showInterstitialThen(
  onDone: () => void,
  reason?: string,
  options?: InterstitialOptions,
): void {
  const forceAttempt = options?.forceAttempt === true || options?.userInitiated === true
  if (forceAttempt) {
    showForcedInterstitialThen(onDone, reason)
    return
  }

  const finish = () => {
    try {
      onDone()
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ads] interstitial onDone failed', err)
    }
  }

  if (adPlaying.value) {
    window.addEventListener(
      'ads:resume',
      () => showInterstitialThen(onDone, reason, options),
      { once: true },
    )
    return
  }

  if (!canShowInterstitial(options)) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[ads] interstitial skipped (cooldown)', reason)
    }
    finish()
    return
  }

  invokeFullscreenInterstitial(finish, reason)
}

/** Всегда вызывает SDK по клику игрока: без клиентских кулдаунов и без записи в таймеры. */
function showForcedInterstitialThen(onDone: () => void, reason?: string): void {
  const finish = () => {
    try {
      onDone()
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ads] forced interstitial onDone failed', err)
    }
  }

  if (adPlaying.value) {
    window.addEventListener(
      'ads:resume',
      () => showForcedInterstitialThen(onDone, reason),
      { once: true },
    )
    return
  }

  let pauseEmitted = false
  const pauseOnce = (): void => {
    if (pauseEmitted) return
    pauseEmitted = true
    emitPause()
  }
  const resumeOnce = (): void => {
    if (pauseEmitted) emitResume()
  }
  const done = (): void => {
    resumeOnce()
    finish()
  }

  const ysdk = getYsdk()
  if (!ysdk) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[ads] forced interstitial (dev stub)', reason)
      pauseOnce()
      window.setTimeout(() => {
        done()
      }, 1200)
      return
    }
    finish()
    return
  }

  pauseOnce()
  showFullscreenAdvSafe(
    {
      onOpen: pauseOnce,
      onClose: () => done(),
      onError: () => done(),
      onOffline: () => done(),
    },
    done,
  )
}

/** Полноэкранная реклама по клику — без клиентских кулдаунов (частоту решает SDK). */
export function showClickInterstitialThen(onDone: () => void, reason?: string): void {
  showForcedInterstitialThen(onDone, reason)
}

/** Реклама перед рестартом — каждый клик, без клиентского кулдауна. */
export function showRestartInterstitialThen(onDone: () => void): void {
  showClickInterstitialThen(onDone, 'restart')
}

/** Реклама перед получением награды — каждый клик, без клиентского кулдауна. */
export function showRewardClaimInterstitialThen(
  onDone: () => void,
  reason: 'quest_reward' | 'daily_reward' = 'quest_reward',
): void {
  showClickInterstitialThen(onDone, reason)
}

/** Плановая реклама в геймплее — через общий кулдаун, с ожиданием готовности. */
export function showScheduledGameplayInterstitialThen(onDone: (shown: boolean) => void): void {
  const attempt = (): void => {
    if (adPlaying.value) {
      window.addEventListener('ads:resume', attempt, { once: true })
      return
    }

    const wait = msUntilInterstitialReady({ scheduled: true })
    if (wait > 0) {
      scheduleAfterServerMs(wait, attempt)
      return
    }

    showInterstitialThenWithResult(onDone, 'scheduled_gameplay', { scheduled: true })
  }

  attempt()
}

/** Не показывать «реклама недоступна» сразу после другого показа (rewarded/interstitial). */
export function shouldSuppressAdUnavailableAfterMiss(): boolean {
  if (msUntilInterstitialReady({ scheduled: true }) > 0) return true
  if (msSinceLastAd() < INTERSTITIAL_MIN_GAP) return true
  return false
}

/** Interstitial с результатом: была ли реклама реально показана. */
export function showInterstitialThenWithResult(
  onDone: (shown: boolean) => void,
  reason?: string,
  options?: InterstitialOptions,
): void {
  const forceAttempt = options?.forceAttempt === true || options?.userInitiated === true
  if (forceAttempt) {
    showForcedInterstitialThenWithResult(onDone, reason)
    return
  }

  const finish = (shown: boolean) => {
    try {
      onDone(shown)
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ads] interstitial onDone failed', err)
    }
  }

  if (adPlaying.value) {
    window.addEventListener(
      'ads:resume',
      () => showInterstitialThenWithResult(onDone, reason, options),
      { once: true },
    )
    return
  }

  if (!canShowInterstitial(options)) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[ads] interstitial skipped (cooldown)', reason)
    }
    finish(false)
    return
  }

  invokeFullscreenInterstitialWithResult(onDone, reason)
}

function invokeFullscreenInterstitial(finish: () => void, reason?: string): void {
  invokeFullscreenInterstitialWithResult(() => finish(), reason)
}

function invokeFullscreenInterstitialWithResult(onDone: (shown: boolean) => void, reason?: string): void {
  const ysdk = getYsdk()
  if (!ysdk) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[ads] interstitial (dev stub)', reason)
      emitPause()
      window.setTimeout(() => {
        markInterstitialShown()
        emitResume()
        onDone(true)
      }, 1200)
      return
    }
    onDone(false)
    return
  }

  showFullscreenAdvSafe(createFullscreenCallbacksWithResult(onDone), () => onDone(false))
}

function showForcedInterstitialThenWithResult(onDone: (shown: boolean) => void, reason?: string): void {
  const finish = (shown: boolean) => {
    try {
      onDone(shown)
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ads] forced interstitial onDone failed', err)
    }
  }

  if (adPlaying.value) {
    window.addEventListener(
      'ads:resume',
      () => showForcedInterstitialThenWithResult(onDone, reason),
      { once: true },
    )
    return
  }

  let pauseEmitted = false
  const pauseOnce = (): void => {
    if (pauseEmitted) return
    pauseEmitted = true
    emitPause()
  }
  const resumeOnce = (): void => {
    if (pauseEmitted) emitResume()
  }
  const done = (shown: boolean): void => {
    resumeOnce()
    finish(shown)
  }

  const ysdk = getYsdk()
  if (!ysdk) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[ads] forced interstitial (dev stub)', reason)
      pauseOnce()
      window.setTimeout(() => {
        done(true)
      }, 1200)
      return
    }
    finish(false)
    return
  }

  pauseOnce()
  showFullscreenAdvSafe(
    {
      onOpen: pauseOnce,
      onClose: (wasShown = false) => done(wasShown),
      onError: () => done(false),
      onOffline: () => done(false),
    },
    () => done(false),
  )
}

function createFullscreenCallbacksWithResult(onDone: (shown: boolean) => void) {
  let pauseEmitted = false
  let tracked = false

  const trackShow = (): void => {
    if (tracked) return
    tracked = true
    markInterstitialShown()
  }

  const pauseOnce = () => {
    if (pauseEmitted) return
    pauseEmitted = true
    emitPause()
  }
  const resumeOnce = () => {
    if (pauseEmitted) emitResume()
  }
  const finish = (shown: boolean) => {
    resumeOnce()
    try {
      onDone(shown)
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[ads] interstitial onDone failed', err)
    }
  }

  return {
    onOpen: () => {
      trackShow()
      pauseOnce()
    },
    onClose: (wasShown = false) => {
      if (wasShown) trackShow()
      finish(wasShown)
    },
    onError: () => finish(false),
    onOffline: () => finish(false),
  }
}

function showFullscreenAdvSafe(callbacks: YsdkFullscreenCallbacks, onFail: () => void): void {
  const ysdk = getYsdk()
  if (!ysdk?.adv?.showFullscreenAdv) {
    onFail()
    return
  }

  let finished = false
  const finishAd = (run?: () => void): void => {
    if (finished) return
    finished = true
    clearAdWatchdog()
    run?.()
  }

  const wrapped: YsdkFullscreenCallbacks = {
    onOpen: () => callbacks.onOpen?.(),
    onClose: (wasShown) => {
      finishAd(() => callbacks.onClose?.(wasShown))
    },
    onError: (err) => {
      if (import.meta.env.DEV) console.warn('[ads] fullscreen onError', err)
      finishAd(() => callbacks.onError?.(err))
    },
    onOffline: () => {
      finishAd(() => callbacks.onOffline?.())
    },
  }

  armAdWatchdog(() => {
    emitResume()
    onFail()
  })

  try {
    ysdk.adv.showFullscreenAdv({ callbacks: wrapped })
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[ads] showFullscreenAdv failed', err)
    finishAd(onFail)
  }
}

function showRewardedVideoSafe(callbacks: YsdkRewardedCallbacks, onFail: () => void): void {
  const ysdk = getYsdk()
  if (!ysdk?.adv?.showRewardedVideo) {
    onFail()
    return
  }

  let finished = false
  const finishAd = (run?: () => void): void => {
    if (finished) return
    finished = true
    clearAdWatchdog()
    run?.()
  }

  const wrapped: YsdkRewardedCallbacks = {
    onOpen: () => callbacks.onOpen?.(),
    onRewarded: () => callbacks.onRewarded?.(),
    onClose: () => {
      finishAd(() => callbacks.onClose?.())
    },
    onError: (err) => {
      if (import.meta.env.DEV) console.warn('[ads] rewarded onError', err)
      finishAd(() => callbacks.onError?.(err))
    },
  }

  armAdWatchdog(() => {
    emitResume()
    onFail()
  })

  try {
    ysdk.adv.showRewardedVideo({ callbacks: wrapped })
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[ads] showRewardedVideo failed', err)
    finishAd(onFail)
  }
}

export interface RewardedOptions {
  /** Выдать награду, если реклама недоступна или не была досмотрена. */
  grantOnFailure?: boolean
}

function grantRewarded(onReward: () => void, watched: boolean): void {
  onReward()
  if (watched) {
    window.dispatchEvent(new CustomEvent('ads:rewarded'))
  }
}

/**
 * Show a rewarded video. Reward is delivered ONLY if onRewarded fires.
 * In dev (no SDK), reward is granted immediately for testing.
 */
export function showRewarded(onReward: () => void, options?: RewardedOptions): void {
  const grantOnFailure = options?.grantOnFailure ?? false

  if (adPlaying.value) {
    window.addEventListener('ads:resume', () => showRewarded(onReward, options), { once: true })
    return
  }

  const ysdk = getYsdk()
  if (!ysdk) {
    if (import.meta.env.DEV || grantOnFailure) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info('[ads] rewarded (dev stub) — granting immediately')
      }
      grantRewarded(onReward, import.meta.env.DEV)
    }
    return
  }

  let granted = false
  let pauseEmitted = false
  const pauseOnce = () => {
    if (pauseEmitted) return
    pauseEmitted = true
    emitPause()
  }
  const resumeOnce = () => {
    if (pauseEmitted) emitResume()
  }
  const finish = () => {
    resumeOnce()
  }
  const tryGrant = (watched: boolean): void => {
    if (watched || grantOnFailure) {
      grantRewarded(onReward, watched)
    }
  }

  pauseOnce()
  showRewardedVideoSafe(
    {
      onOpen: pauseOnce,
      onRewarded: () => {
        granted = true
      },
      onClose: () => {
        lastAnyAdAt = getServerTime()
        finish()
        tryGrant(granted)
      },
      onError: () => {
        finish()
        tryGrant(false)
      },
    },
    () => {
      finish()
      tryGrant(false)
    },
  )
}
