const SCAN_SPEED = 18;
const RESET_SPEED = 32;
const REVEAL_THRESHOLD = 6.5;
const SCAN_LOOP_TOP = -4;
const SCAN_LOOP_BOTTOM = 104;
const PING_MS = 420;

let rafId = 0;
let lastFrame = 0;
/** @type {{ sceneKey: string, scanY: number, isResetting: boolean } | null} */
let persistedScan = null;

export function isAnomalyScanRunning() {
  return rafId !== 0;
}

/**
 * @param {HTMLElement} scanRoot
 * @param {number} y
 * @param {HTMLElement|null} head
 * @param {boolean} isResetting
 */
function updateScanVisual(scanRoot, y, head, isResetting) {
  const clamped = Math.max(0, Math.min(100, y));
  scanRoot.style.setProperty("--scan-y", `${clamped}%`);
  if (head) head.style.top = `${y}%`;
  scanRoot.classList.toggle("is-resetting", isResetting);
}

/**
 * @param {HTMLElement|null} novel
 * @param {string|null|undefined} sceneKey
 * @param {(itemId: string) => void} [onReveal]
 */
export function startAnomalyScan(novel, sceneKey, onReveal) {
  if (!novel || !sceneKey) return;

  const scanRoot = novel.querySelector(".anomaly-scan");
  const head = scanRoot?.querySelector(".anomaly-scan__head");
  if (!scanRoot || !head) return;

  if (rafId) {
    window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scanSpeed = reduced ? 34 : SCAN_SPEED;
  const resetSpeed = reduced ? 80 : RESET_SPEED;

  const resume = persistedScan?.sceneKey === sceneKey;
  let scanY = resume ? persistedScan.scanY : SCAN_LOOP_TOP;
  let isResetting = resume ? persistedScan.isResetting : false;

  scanRoot.classList.add("is-scanning");

  const markRevealed = (zone) => {
    if (isResetting || zone.classList.contains("scan-zone--revealed")) return;

    zone.classList.add("scan-zone--revealed", "scan-zone--hit");
    window.setTimeout(() => zone.classList.remove("scan-zone--hit"), PING_MS);

    const itemId = zone.dataset.scanItem;
    if (itemId) onReveal?.(itemId);
  };

  const persist = () => {
    persistedScan = { sceneKey, scanY, isResetting };
  };

  const frame = (now) => {
    const dt = Math.min(now - lastFrame, 48);
    lastFrame = now;

    if (isResetting) {
      scanY -= (resetSpeed * dt) / 1000;
      if (scanY <= SCAN_LOOP_TOP) {
        scanY = SCAN_LOOP_TOP;
        isResetting = false;
      }
    } else {
      scanY += (scanSpeed * dt) / 1000;
      if (scanY >= SCAN_LOOP_BOTTOM) {
        scanY = SCAN_LOOP_BOTTOM;
        isResetting = true;
      }
    }

    persist();
    updateScanVisual(scanRoot, scanY, head, isResetting);

    if (!isResetting) {
      const zones = novel.querySelectorAll(".scan-zone:not(.scan-zone--locked)");
      for (const zone of zones) {
        const zoneY = Number(zone.dataset.scanY);
        if (!Number.isFinite(zoneY)) continue;
        if (Math.abs(scanY - zoneY) <= REVEAL_THRESHOLD) {
          markRevealed(zone);
        }
      }
    }

    rafId = window.requestAnimationFrame(frame);
  };

  persist();
  lastFrame = performance.now();
  updateScanVisual(scanRoot, scanY, head, isResetting);
  rafId = window.requestAnimationFrame(frame);
}

export function stopAnomalyScan() {
  if (rafId) {
    window.cancelAnimationFrame(rafId);
    rafId = 0;
  }
  persistedScan = null;
}
