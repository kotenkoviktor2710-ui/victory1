import { showClickInterstitialThen } from '@/ads/ads'
import { getSdkPlayer } from '@/yandex/player'
import { gameplayPause, gameplayResume, getLang } from '@/yandex/sdk'

const DEV_SAVE_KEY = 'courier-novel-save'

function playerFallbackName(): string {
  return 'Игрок'
}

/**
 * Адаптер платформы для кода новеллы — совместим с прежним YandexSDK API.
 */
export class NovelPlatformSDK {
  leaderboardName = 'score'

  async init(): Promise<this> {
    await getSdkPlayer()
    return this
  }

  getLanguage(): string {
    return getLang()
  }

  ready(): void {
    /* LoadingAPI.ready() вызывается в markAppReady() шаблона */
  }

  gameplayStart(): void {
    gameplayResume()
  }

  gameplayStop(): void {
    gameplayPause()
  }

  async loadData(keys: string[] = []): Promise<Record<string, unknown>> {
    if (import.meta.env.DEV) {
      try {
        const raw = localStorage.getItem(DEV_SAVE_KEY)
        const data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
        if (!keys.length) return data
        const result: Record<string, unknown> = {}
        for (const key of keys) result[key] = data[key]
        return result
      } catch {
        return {}
      }
    }

    const player = await getSdkPlayer()
    if (!player?.getData) return {}

    try {
      return (await player.getData(keys)) ?? {}
    } catch (err) {
      console.warn('[NovelPlatformSDK] getData:', err)
      return {}
    }
  }

  async saveData(data: Record<string, unknown>, flush = true): Promise<void> {
    if (import.meta.env.DEV) {
      try {
        const raw = localStorage.getItem(DEV_SAVE_KEY)
        const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
        localStorage.setItem(DEV_SAVE_KEY, JSON.stringify({ ...current, ...data }))
      } catch {
        /* ignore */
      }
      return
    }

    const player = await getSdkPlayer()
    if (!player?.setData) return

    try {
      await player.setData(data, flush)
    } catch (err) {
      console.warn('[NovelPlatformSDK] setData:', err)
    }
  }

  showFullscreenAdv(options: { resumeGameplay?: boolean } = {}): Promise<boolean> {
    const { resumeGameplay = false } = options

    return new Promise((resolve) => {
      this.gameplayStop()

      showClickInterstitialThen(() => {
        if (resumeGameplay) this.gameplayStart()
        resolve(true)
      }, 'novel_action')
    })
  }
}

export const novelSdk = new NovelPlatformSDK()

export { playerFallbackName }
