/**
 * Блокирует pull-to-refresh, контекстное меню браузера и нативные alert/confirm/prompt.
 * Скролл внутри панелей игры не ломается (п. 1.10).
 */

let uiGuardBound = false
let ptrGuardBound = false

function isVerticallyScrollable(element: Element): boolean {
  const style = getComputedStyle(element)
  if (!/(auto|scroll|overlay)/.test(style.overflowY)) return false
  return element.scrollHeight > element.clientHeight + 1
}

function canScrollUpFromTarget(target: EventTarget | null): boolean {
  let node = target instanceof Node ? target : null

  while (node && node !== document.documentElement) {
    if (node instanceof Element && isVerticallyScrollable(node) && node.scrollTop > 0) {
      return true
    }
    node = node.parentNode
  }

  return false
}

function bindContextMenuGuard(): void {
  const blockContextMenu = (event: Event): void => {
    event.preventDefault()
  }

  const blockSelectStart = (event: Event): void => {
    const target = event.target
    if (target instanceof Element && target.closest('input, textarea, [contenteditable="true"]')) {
      return
    }
    event.preventDefault()
  }

  for (const root of [document, window] as const) {
    root.addEventListener('contextmenu', blockContextMenu, { capture: true })
    root.addEventListener('selectstart', blockSelectStart, { capture: true })
  }

  window.addEventListener('dragstart', (event) => event.preventDefault(), { capture: true })
  window.addEventListener('gesturestart', (event) => event.preventDefault(), { capture: true })
}

function bindNativeDialogGuard(): void {
  window.alert = (message?: string): void => {
    if (import.meta.env.DEV) console.warn('[browser-ui-guard] alert blocked:', message)
  }

  window.confirm = (message?: string): boolean => {
    if (import.meta.env.DEV) console.warn('[browser-ui-guard] confirm blocked:', message)
    return false
  }

  window.prompt = (message?: string, _default?: string): string | null => {
    if (import.meta.env.DEV) console.warn('[browser-ui-guard] prompt blocked:', message)
    return null
  }

  try {
    Object.defineProperty(window, 'onbeforeunload', {
      configurable: true,
      enumerable: true,
      get: () => null,
      set: () => {
        if (import.meta.env.DEV) console.warn('[browser-ui-guard] onbeforeunload assignment blocked')
      },
    })
  } catch {
    /* ignore */
  }

  const nativeAddEventListener = window.addEventListener.bind(window)
  window.addEventListener = ((
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => {
    if (type === 'beforeunload') {
      if (import.meta.env.DEV) console.warn('[browser-ui-guard] beforeunload listener blocked')
      return
    }
    nativeAddEventListener(type, listener, options)
  }) as typeof window.addEventListener
}

function bindPullToRefreshGuard(): void {
  if (ptrGuardBound || !('ontouchstart' in window)) return
  ptrGuardBound = true

  let touchStartY = 0

  document.addEventListener(
    'touchstart',
    (event) => {
      const touch = event.touches[0]
      if (event.touches.length === 1 && touch) {
        touchStartY = touch.pageY
      }
    },
    { capture: true, passive: true },
  )

  document.addEventListener(
    'touchmove',
    (event) => {
      if (event.touches.length > 1) {
        event.preventDefault()
        return
      }

      const touch = event.touches[0]
      if (event.touches.length !== 1 || !touch) return

      const touchY = touch.pageY
      const deltaY = touchY - touchStartY
      touchStartY = touchY

      if (deltaY <= 0) return
      if (canScrollUpFromTarget(event.target)) return

      event.preventDefault()
    },
    { capture: true, passive: false },
  )
}

/** Единая точка: контекстное меню, нативные диалоги, pull-to-refresh. */
export function bindBrowserUiGuard(): void {
  if (typeof window === 'undefined' || uiGuardBound) return
  uiGuardBound = true

  bindContextMenuGuard()
  bindNativeDialogGuard()
  bindPullToRefreshGuard()
}

/** @deprecated Используйте bindBrowserUiGuard */
export function bindPreventPullToRefresh(): void {
  bindBrowserUiGuard()
}
