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

initViewport();
