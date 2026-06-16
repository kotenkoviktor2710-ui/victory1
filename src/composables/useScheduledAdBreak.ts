import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

import {
  adsPlaying,
  setAdBreakBlocking,
  showScheduledGameplayInterstitialThen,
} from '@/ads/ads'
import { AD_BREAK_COUNTDOWN_SEC, SCHEDULED_AD_INTERVAL_MS } from '@/domain/constants'
import { gameplayPause, gameplayResume } from '@/yandex/sdk'

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
    gameplayPause()
  }

  function resumeGameplayAfterCountdown(): void {
    if (!gameplayPausedForCountdown) return
    gameplayPausedForCountdown = false
    gameplayResume()
  }

  function finishBreakCycle(): void {
    armNextBreak()
  }

  function runAdAfterCountdown(): void {
    clearCountdownTimer()
    countdown.value = null
    setAdBreakBlocking(false)

    showScheduledGameplayInterstitialThen(() => {
      resumeGameplayAfterCountdown()
      finishBreakCycle()
    })
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

    startCountdown()
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

  onMounted(() => {
    armNextBreak()

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('ads:resume', onAdsResume)

    if (import.meta.env.DEV) {
      window.addEventListener('ads:break-test', tryTriggerBreak)
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
      window.removeEventListener('ads:break-test', tryTriggerBreak)
    }
  })

  return { countdown }
}
