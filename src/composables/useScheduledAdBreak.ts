import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

import {
  adsPlaying,
  msUntilInterstitialReady,
  pauseAdAudio,
  resumeAdAudio,
  setAdBreakBlocking,
  shouldSuppressAdUnavailableAfterMiss,
  showScheduledGameplayInterstitialThen,
} from '@/ads/ads'
import { AD_BREAK_COUNTDOWN_SEC, SCHEDULED_AD_INTERVAL_MS } from '@/domain/constants'
import { getServerTime } from '@/yandex/sdk'
import {
  scheduleAfterServerMs,
  startServerTimeTicker,
  type ServerTimerHandle,
} from '@/yandex/serverTimeTimers'

function dispatchGameplayPause(): void {
  window.dispatchEvent(new CustomEvent('ads:pause'))
}

function dispatchGameplayResume(): void {
  window.dispatchEvent(new CustomEvent('ads:resume'))
}

/**
 * Плановая реклама каждые 2 мин: блокирующая модалка с 3-секундным отсчётом, затем interstitial.
 * Во время боя и скрытой вкладки переносит показ до возврата на поле.
 * Все задержки привязаны к ysdk.serverTime().
 */
export function useScheduledAdBreak(active: Ref<boolean>) {
  const countdown = ref<number | null>(null)
  const adUnavailable = ref(false)

  let nextBreakTimer: ServerTimerHandle | null = null
  let interstitialWaitTimer: ServerTimerHandle | null = null
  let stopCountdownTicker: (() => void) | null = null
  let pendingBreak = false
  let gameplayPausedForCountdown = false

  function clearNextBreakTimer(): void {
    nextBreakTimer?.cancel()
    nextBreakTimer = null
  }

  function clearInterstitialWaitTimer(): void {
    interstitialWaitTimer?.cancel()
    interstitialWaitTimer = null
  }

  function clearCountdownTimer(): void {
    stopCountdownTicker?.()
    stopCountdownTicker = null
  }

  function armNextBreak(delay = SCHEDULED_AD_INTERVAL_MS): void {
    clearNextBreakTimer()
    nextBreakTimer = scheduleAfterServerMs(delay, () => {
      nextBreakTimer = null
      tryTriggerBreak()
    })
  }

  function pauseGameplayForCountdown(): void {
    if (gameplayPausedForCountdown) return
    gameplayPausedForCountdown = true
    pauseAdAudio()
    dispatchGameplayPause()
  }

  function resumeGameplayAfterCountdown(): void {
    if (!gameplayPausedForCountdown) return
    gameplayPausedForCountdown = false
    resumeAdAudio()
    dispatchGameplayResume()
  }

  function finishBreakCycle(): void {
    armNextBreak()
  }

  function completeBreakCycle(): void {
    resumeGameplayAfterCountdown()
    finishBreakCycle()
  }

  function runAdAfterCountdown(): void {
    clearCountdownTimer()
    countdown.value = null
    setAdBreakBlocking(false)

    const onAdDone = (shown: boolean): void => {
      if (shown || shouldSuppressAdUnavailableAfterMiss()) {
        completeBreakCycle()
        return
      }

      adUnavailable.value = true
    }

    showScheduledGameplayInterstitialThen(onAdDone)
  }

  function dismissAdUnavailable(): void {
    if (!adUnavailable.value) return
    adUnavailable.value = false
    completeBreakCycle()
  }

  function scheduleWhenInterstitialReady(): void {
    const wait = msUntilInterstitialReady({ scheduled: true })
    if (wait > 0) {
      clearInterstitialWaitTimer()
      interstitialWaitTimer = scheduleAfterServerMs(wait, () => {
        interstitialWaitTimer = null
        scheduleWhenInterstitialReady()
      })
      return
    }

    startCountdown()
  }

  function startCountdown(): void {
    if (countdown.value !== null || adsPlaying()) return

    pendingBreak = false
    setAdBreakBlocking(true)
    pauseGameplayForCountdown()

    const endsAt = getServerTime() + AD_BREAK_COUNTDOWN_SEC * 1000

    const syncCountdown = (): void => {
      const left = Math.ceil((endsAt - getServerTime()) / 1000)
      if (left <= 0) {
        clearCountdownTimer()
        runAdAfterCountdown()
        return
      }
      countdown.value = left
    }

    syncCountdown()
    stopCountdownTicker = startServerTimeTicker(syncCountdown, 250)
  }

  function tryTriggerBreak(): void {
    if (countdown.value !== null) return
    if (adsPlaying()) {
      pendingBreak = true
      return
    }
    if (document.hidden || !active.value) {
      pendingBreak = true
      return
    }

    scheduleWhenInterstitialReady()
  }

  function onVisibilityChange(): void {
    if (!document.hidden && pendingBreak) {
      tryTriggerBreak()
    }
  }

  function onAdsResume(): void {
    if (pendingBreak) {
      tryTriggerBreak()
    }
  }

  function suspendBreakForOverlay(): void {
    let deferred = false

    if (countdown.value !== null) {
      clearCountdownTimer()
      countdown.value = null
      setAdBreakBlocking(false)
      resumeGameplayAfterCountdown()
      deferred = true
    }

    if (interstitialWaitTimer !== null) {
      clearInterstitialWaitTimer()
      deferred = true
    }

    if (deferred) {
      pendingBreak = true
    }
  }

  watch(active, (isActive) => {
    if (!isActive) {
      suspendBreakForOverlay()
      return
    }

    if (pendingBreak) {
      tryTriggerBreak()
    }
  })

  function triggerBreakTest(): void {
    if (countdown.value !== null) return
    if (adsPlaying()) return
    if (document.hidden || !active.value) {
      pendingBreak = true
      return
    }
    startCountdown()
  }

  function triggerNoAdModalTest(): void {
    adUnavailable.value = true
    pauseGameplayForCountdown()
  }

  onMounted(() => {
    armNextBreak()

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('ads:resume', onAdsResume)

    if (import.meta.env.DEV) {
      window.addEventListener('ads:break-test', triggerBreakTest)
      window.addEventListener('ads:no-ad-modal-test', triggerNoAdModalTest)
    }
  })

  onUnmounted(() => {
    clearNextBreakTimer()
    clearInterstitialWaitTimer()
    clearCountdownTimer()
    countdown.value = null
    adUnavailable.value = false
    setAdBreakBlocking(false)
    resumeGameplayAfterCountdown()

    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('ads:resume', onAdsResume)

    if (import.meta.env.DEV) {
      window.removeEventListener('ads:break-test', triggerBreakTest)
      window.removeEventListener('ads:no-ad-modal-test', triggerNoAdModalTest)
    }
  })

  return { countdown, adUnavailable, dismissAdUnavailable }
}
