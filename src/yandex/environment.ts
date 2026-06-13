import { getLang, getYsdk } from '@/yandex/sdk'
import type { YsdkPromoReferrer } from '@/yandex/types'

/** ID игры из ysdk.environment.app.id */
export function getAppId(): string | null {
  return getYsdk()?.environment?.app?.id ?? null
}

/** payload из URL игры (?payload=...) */
export function getEnvironmentPayload(): string | null {
  const payload = getYsdk()?.environment?.payload
  return payload?.trim() ? payload : null
}

/** Переход из промоакции в каталоге. */
export function getPromoReferrer(): YsdkPromoReferrer | null {
  const referrer = getYsdk()?.environment?.referrer
  return referrer?.type === 'promo' ? referrer : null
}

/** Язык интерфейса платформы (ISO 639-1) — требование п. 2.14. */
export function getPlatformLang(): string {
  return getLang()
}

export function isMobileDevice(): boolean {
  return getYsdk()?.deviceInfo?.isMobile() ?? /Mobi|Android/i.test(navigator.userAgent)
}

export function isDesktopDevice(): boolean {
  return getYsdk()?.deviceInfo?.isDesktop() ?? !isMobileDevice()
}

export function isTvDevice(): boolean {
  return getYsdk()?.deviceInfo?.isTV() ?? false
}
