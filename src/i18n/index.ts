import { computed } from 'vue'

import { applyLocale, getActiveLocale, normalizeLocale, resolvePlatformLocale } from '@/i18n/locale'
import { messages, type MessageKey } from '@/i18n/messages'

export { applyLocale, getActiveLocale, normalizeLocale, resolvePlatformLocale }
export type { MessageKey, LocaleCode } from '@/i18n/messages'

type MessageParams = Record<string, string | number>

function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

/** Перевод по ключу; fallback ru → ключ. */
export function t(key: MessageKey, params?: MessageParams): string {
  const locale = getActiveLocale()
  const dict = messages[locale] ?? messages.ru
  const template = dict[key] ?? messages.ru[key] ?? key
  return interpolate(template, params)
}

export function useI18n() {
  const locale = computed(() => getActiveLocale())

  return {
    locale,
    t: (key: MessageKey, params?: MessageParams) => t(key, params),
  }
}
