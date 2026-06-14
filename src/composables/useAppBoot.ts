import { markAppReady } from '@/yandex/appReady'
import { runYandexBootstrap } from '@/yandex/bootstrap'
import { initYandex } from '@/yandex/sdk'

const MIN_BOOT_MS = 800

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export async function runAppBoot(onProgress?: (value: number) => void): Promise<void> {
  const bootStart = performance.now()
  let actualProgress = 0.1
  let tickerId = 0

  const publish = () => {
    const elapsed = performance.now() - bootStart
    const timeRatio = Math.min(1, elapsed / MIN_BOOT_MS)
    const timeFloor = 0.1 + timeRatio * 0.8
    const shown = Math.min(1, Math.max(actualProgress, timeFloor * 0.92))
    onProgress?.(shown)
  }

  tickerId = window.setInterval(publish, 40)
  publish()

  actualProgress = 0.15
  await initYandex()
  await runYandexBootstrap()
  actualProgress = 0.85
  publish()

  const elapsed = performance.now() - bootStart
  if (elapsed < MIN_BOOT_MS) {
    await wait(MIN_BOOT_MS - elapsed)
  }

  actualProgress = 1
  publish()
  onProgress?.(1)

  window.clearInterval(tickerId)
  markAppReady()
}
