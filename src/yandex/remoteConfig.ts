import { getYsdk } from '@/yandex/sdk'
import type { YsdkFlagsParams } from '@/yandex/types'

/**
 * Remote Config с локальным fallback (обязателен по документации).
 * @see https://yandex.ru/dev/games/doc/ru/sdk/sdk-config
 */
export async function fetchRemoteFlags(
  defaultFlags: Record<string, string> = {},
  clientFeatures?: YsdkFlagsParams['clientFeatures'],
): Promise<Record<string, string>> {
  const sdk = getYsdk()
  if (!sdk?.getFlags) return { ...defaultFlags }

  try {
    const flags = await sdk.getFlags({
      defaultFlags,
      clientFeatures,
    })
    return { ...defaultFlags, ...flags }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[remoteConfig] getFlags failed', err)
    return { ...defaultFlags }
  }
}
