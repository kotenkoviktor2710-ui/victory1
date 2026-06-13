import { flushPlayerDataNow } from '@/yandex/playerStorage'

let bound = false

/** Сохранить прогресс при сворачивании / закрытии вкладки. */
export function bindProgressLifecycle(): void {
  if (bound) return
  bound = true

  const onHide = (): void => {
    void flushPlayerDataNow()
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHide()
  })

  window.addEventListener('pagehide', onHide)
  window.addEventListener('freeze', onHide as EventListener)
}
