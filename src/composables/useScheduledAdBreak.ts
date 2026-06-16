import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

import {
  adsPlaying,
  msUntilInterstitialReady,
  pauseAdAudio,
  resumeAdAudio,
  setAdBreakBlocking,
  showInterstitialThen,
  showScheduledGameplayInterstitialThen,
} from '@/ads/ads'
import { AD_BREAK_COUNTDOWN_SEC, SCHEDULED_AD_INTERVAL_MS } from '@/domain/constants'

function dispatchGameplayPause(): void {
  window.dispatchEvent(new CustomEvent('ads:pause'))
}

function dispatchGameplayResume(): void {
  window.dispatchEvent(new CustomEvent('ads:resume'))
}

/**
 * Плановая реклама каждые 2 мин: блокирующая модалка с 3-секундным отсчётом, затем interstitial.
 * Во время боя и скрытой вкладки переносит показ до возврата на поле.
 */
export function useScheduledAdBreak(active: Ref<boolean>) {
  const countdown = ref<number | null>(null)

  let nextBreakTimerId: ReturnType<typeof setTimeout> | null = null
  let countdownTimerId: ReturnType<typeof setInterval> | null = null
  let pendingBreak = false
  let gameplayPausedForCountdown = false

  function clearNextBreakTimer(): void {
    if (nextBreakTimerId !== null) {
      window.clearTimeout(nextBreakTimerId)
      nextBreakTimerId = null
    }
  }

  function clearCountdownTimer(): void {
    if (countdownTimerId !== null) {
      window.clearInterval(countdownTimerId)
      countdownTimerId = null
    }
  }

  function armNextBreak(delay = SCHEDULED_AD_INTERVAL_MS): void {
    clearNextBreakTimer()
    nextBreakTimerId = window.setTimeout(() => {
      nextBreakTimerId = null
      tryTriggerBreak()
    }, delay)
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

  function runAdAfterCountdown(): void {
    clearCountdownTimer()
    countdown.value = null
    setAdBreakBlocking(false)

    const onAdDone = (): void => {
      resumeGameplayAfterCountdown()
      finishBreakCycle()
    }

    if (import.meta.env.DEV) {
      // Локально без SDK — сразу показываем stub, не ждём минутный кулдаун.
      showInterstitialThen(onAdDone, 'scheduled_gameplay', { forceAttempt: true })
      return
    }

    showScheduledGameplayInterstitialThen(onAdDone)
  }

  function scheduleWhenInterstitialReady(): void {
    const wait = msUntilInterstitialReady({ scheduled: true })
    if (wait > 0) {
      clearNextBreakTimer()
      nextBreakTimerId = window.setTimeout(() => {
        nextBreakTimerId = null
        scheduleWhenInterstitialReady()
      }, wait)
      return
    }

    startCountdown()
  }

  function startCountdown(): void {
    if (countdown.value !== null || adsPlaying()) return

    pendingBreak = false
    setAdBreakBlocking(true)
    pauseGameplayForCountdown()
    countdown.value = AD_BREAK_COUNTDOWN_SEC

    countdownTimerId = window.setInterval(() => {
      if (countdown.value === null) return
      if (countdown.value <= 1) {
        runAdAfterCountdown()
        return
      }
      countdown.value -= 1
    }, 1000)
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

  watch(active, (isActive) => {
    if (isActive && pendingBreak) {
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

  onMounted(() => {
    armNextBreak()

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('ads:resume', onAdsResume)

    if (import.meta.env.DEV) {
      window.addEventListener('ads:break-test', triggerBreakTest)
    }
  })

  onUnmounted(() => {
    clearNextBreakTimer()
    clearCountdownTimer()
    countdown.value = null
    setAdBreakBlocking(false)
    resumeGameplayAfterCountdown()

    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('ads:resume', onAdsResume)

    if (import.meta.env.DEV) {
      window.removeEventListener('ads:break-test', triggerBreakTest)
    }
  })

  return { countdown }
}
