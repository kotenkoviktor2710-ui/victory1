/** Синхронизирует CSS-переменные с visualViewport (iOS, мобильные браузеры). */
function updateViewportVars() {
  const vv = window.visualViewport;
  const height = vv?.height ?? window.innerHeight;
  const width = vv?.width ?? window.innerWidth;
  const top = vv?.offsetTop ?? 0;
  const left = vv?.offsetLeft ?? 0;
  const root = document.documentElement;

  root.style.setProperty("--app-height", `${Math.round(height)}px`);
  root.style.setProperty("--app-width", `${Math.round(width)}px`);
  root.style.setProperty("--app-offset-top", `${Math.round(top)}px`);
  root.style.setProperty("--app-offset-left", `${Math.round(left)}px`);
}

let viewportReady = false;

export function initViewport() {
  if (viewportReady) return;
  viewportReady = true;

  updateViewportVars();
  window.addEventListener("resize", updateViewportVars, { passive: true });
  window.visualViewport?.addEventListener("resize", updateViewportVars, { passive: true });
  window.visualViewport?.addEventListener("scroll", updateViewportVars, { passive: true });
  window.addEventListener("orientationchange", () => {
    window.setTimeout(updateViewportVars, 100);
  });
}

function isVerticallyScrollable(element) {
  const style = getComputedStyle(element);
  if (!/(auto|scroll|overlay)/.test(style.overflowY)) return false;
  return element.scrollHeight > element.clientHeight + 1;
}

function canScrollUpFromTarget(target) {
  let node = target instanceof Node ? target : null;

  while (node && node !== document.documentElement) {
    if (node instanceof Element && isVerticallyScrollable(node) && node.scrollTop > 0) {
      return true;
    }
    node = node.parentNode;
  }

  return false;
}

let gestureGuardReady = false;

/** Блокирует контекстное меню и pull-to-refresh, не ломая скролл внутри панелей. */
export function initGestureGuard() {
  if (gestureGuardReady) return;
  gestureGuardReady = true;

  document.addEventListener(
    "contextmenu",
    (event) => {
      event.preventDefault();
    },
    { capture: true }
  );

  document.addEventListener(
    "selectstart",
    (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, [contenteditable="true"]')) {
        return;
      }
      event.preventDefault();
    },
    { capture: true }
  );

  let touchStartY = 0;

  document.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length === 1) {
        touchStartY = event.touches[0].pageY;
      }
    },
    { capture: true, passive: true }
  );

  document.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length !== 1) return;

      const touchY = event.touches[0].pageY;
      const deltaY = touchY - touchStartY;
      touchStartY = touchY;

      if (deltaY <= 0) return;
      if (canScrollUpFromTarget(event.target)) return;

      event.preventDefault();
    },
    { capture: true, passive: false }
  );
}

initViewport();
initGestureGuard();
