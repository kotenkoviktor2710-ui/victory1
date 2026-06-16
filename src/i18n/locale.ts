import { shallowRef } from 'vue'

import type { LocaleCode } from '@/i18n/messages'
import { messages } from '@/i18n/messages'
import type { Ysdk } from '@/yandex/types'

const DEFAULT_LOCALE: LocaleCode = 'ru'

const activeLocale = shallowRef<LocaleCode>(DEFAULT_LOCALE)

/** ISO 639-1 из `ru_RU`, `en-US` и т.п.; неизвестные языки → ru. */
export function normalizeLocale(code: string): LocaleCode {
  const base = code.trim().split(/[-_]/)[0]?.toLowerCase()
  if (base && base in messages) return base as LocaleCode
  return DEFAULT_LOCALE
}

/**
 * Язык интерфейса платформы: `ysdk.environment.i18n.lang`.
 * В dev без SDK — `navigator.language`, иначе ru.
 */
export function resolvePlatformLocale(sdk: Ysdk | null): LocaleCode {
  const fromSdk = sdk?.environment?.i18n?.lang
  if (fromSdk?.trim()) return normalizeLocale(fromSdk)

  if (typeof navigator !== 'undefined' && navigator.language) {
    return normalizeLocale(navigator.language)
  }

  return DEFAULT_LOCALE
}

export function getActiveLocale(): LocaleCode {
  return activeLocale.value
}

export function applyLocale(code: string): LocaleCode {
  const locale = normalizeLocale(code)
  activeLocale.value = locale
  document.documentElement.lang = locale
  return locale
}
