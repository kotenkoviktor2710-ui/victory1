import { getServerTime } from '@/yandex/sdk'

export interface ServerTimerHandle {
  cancel: () => void
}

/**
 * Вызвать callback, когда наступит targetMs по серверному времени Yandex SDK.
 * При возврате на вкладку пересчитывает оставшуюся задержку.
 */
export function scheduleAtServerTime(
  targetMs: number,
  callback: () => void,
): ServerTimerHandle {
  let timerId: ReturnType<typeof setTimeout> | null = null
  let cancelled = false

  const arm = (): void => {
    if (cancelled) return

    if (timerId !== null) {
      window.clearTimeout(timerId)
      timerId = null
    }

    const wait = targetMs - getServerTime()
    if (wait <= 0) {
      callback()
      return
    }

    timerId = window.setTimeout(() => {
      timerId = null
      arm()
    }, wait)
  }

  const onVisibility = (): void => {
    if (!document.hidden) arm()
  }

  document.addEventListener('visibilitychange', onVisibility)
  arm()

  return {
    cancel(): void {
      cancelled = true
      if (timerId !== null) window.clearTimeout(timerId)
      document.removeEventListener('visibilitychange', onVisibility)
    },
  }
}

/** Вызвать callback через delayMs по серверному времени. */
export function scheduleAfterServerMs(
  delayMs: number,
  callback: () => void,
): ServerTimerHandle {
  return scheduleAtServerTime(getServerTime() + Math.max(0, delayMs), callback)
}

/** Ключ календарного дня (UTC) по серверному времени — для ежедневных квестов. */
export function getServerDateKey(timeMs = getServerTime()): string {
  return new Date(timeMs).toISOString().slice(0, 10)
}

/** Периодический опрос serverTime() для UI-таймеров. */
export function startServerTimeTicker(
  onTick: (now: number) => void,
  intervalMs = 1000,
): () => void {
  onTick(getServerTime())
  const id = window.setInterval(() => onTick(getServerTime()), intervalMs)
  return () => window.clearInterval(id)
}
