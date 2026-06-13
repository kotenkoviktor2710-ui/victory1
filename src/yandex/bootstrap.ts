import { fetchRemoteFlags } from '@/yandex/remoteConfig'
import { processPendingPurchases } from '@/yandex/payments'
import { bindPlatformEvents } from '@/yandex/platformEvents'
import { resetPlayerCache, setupSafeStorage } from '@/yandex/player'
import { resetPlayerStorageCache } from '@/yandex/playerStorage'
import type { PurchaseGrantHandler } from '@/yandex/types'

export interface YandexBootstrapOptions {
  /** Локальные флаги на случай недоступности Remote Config. */
  defaultFlags?: Record<string, string>
  /** Обработчик необработанных и новых consumable-покупок. */
  onPurchaseGrant?: PurchaseGrantHandler
  /** После закрытия диалога выбора аккаунта. */
  onAccountSelectionClosed?: () => void | Promise<void>
}

export interface YandexBootstrapResult {
  flags: Record<string, string>
  pendingPurchasesProcessed: number
}

/**
 * Общий post-init: флаги, необработанные покупки, события платформы.
 * Вызывать после initYandex(), до LoadingAPI.ready().
 */
export async function runYandexBootstrap(
  options: YandexBootstrapOptions = {},
): Promise<YandexBootstrapResult> {
  bindPlatformEvents({
    onAccountSelectionClosed: async () => {
      resetPlayerCache()
      resetPlayerStorageCache()
      await options.onAccountSelectionClosed?.()
    },
  })

  await setupSafeStorage()

  const flags = await fetchRemoteFlags(options.defaultFlags ?? {})

  let pendingPurchasesProcessed = 0
  if (options.onPurchaseGrant) {
    pendingPurchasesProcessed = await processPendingPurchases(options.onPurchaseGrant)
  }

  return { flags, pendingPurchasesProcessed }
}
