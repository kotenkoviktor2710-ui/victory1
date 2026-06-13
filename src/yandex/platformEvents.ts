import { gameplayPause, gameplayResume, getYsdk } from '@/yandex/sdk'
import type { SdkEventName } from '@/yandex/types'

let pauseBound = false

export interface PlatformEventsOptions {
  onAccountSelectionClosed?: () => void | Promise<void>
  onHistoryBack?: () => void
}

/** game_api_pause / game_api_resume — вызывается при старте SDK. */
export function bindPlatformPauseEvents(): void {
  if (pauseBound) return
  pauseBound = true

  const sdk = getYsdk()
  if (!sdk?.on) return

  const onPause = (): void => {
    gameplayPause()
    window.dispatchEvent(new CustomEvent('platform:pause'))
  }
  const onResume = (): void => {
    gameplayResume()
    window.dispatchEvent(new CustomEvent('platform:resume'))
  }

  sdk.on('game_api_pause', onPause)
  sdk.on('game_api_resume', onResume)
}

/** Дополнительные события — вызывать из runYandexBootstrap. */
export function bindPlatformEvents(options: PlatformEventsOptions = {}): void {
  bindPlatformPauseEvents()

  const sdk = getYsdk()
  if (!sdk?.on) return

  if (options.onHistoryBack && sdk.EVENTS?.HISTORY_BACK) {
    sdk.on(sdk.EVENTS.HISTORY_BACK, options.onHistoryBack)
  }

  if (options.onAccountSelectionClosed) {
    const accountClosed =
      sdk.EVENTS?.ACCOUNT_SELECTION_DIALOG_CLOSED ?? 'ACCOUNT_SELECTION_DIALOG_CLOSED'
    sdk.on(accountClosed as SdkEventName, () => {
      void options.onAccountSelectionClosed?.()
    })
  }
}

export function dispatchSdkExit(): void {
  const sdk = getYsdk()
  const exitEvent = sdk?.EVENTS?.EXIT ?? 'EXIT'
  void sdk?.dispatchEvent?.(exitEvent)
}
