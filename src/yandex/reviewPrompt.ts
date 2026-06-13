import { runWhenSafeFromAds } from '@/ads/ads'
import { checkCanReview, openPlatformReview } from '@/yandex/sdk'

/**
 * Показать нативное окно оценки платформы, когда безопасно:
 * реклама не идёт, нет отсчёта перед рекламой, прошёл буфер после последнего показа.
 * Не чаще 1 раза за сессию (контролируется SDK).
 */
export function tryShowPlatformReviewWhenSafe(): void {
  runWhenSafeFromAds(() => {
    void tryShowPlatformReviewNow()
  })
}

/** Немедленная попытка показа (без ожидания окончания рекламы). */
export async function tryShowPlatformReviewNow(): Promise<boolean> {
  if (!(await checkCanReview())) return false
  return openPlatformReview()
}
