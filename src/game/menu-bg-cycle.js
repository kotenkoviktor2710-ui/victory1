/** Цикл фонов главного меню: постоянные помехи + смена кадра каждые 3 с. */

const MENU_BG_FRAMES = [
  "./images/8bg.png",
  "./images/3bg.png",
  "./images/6bg.png",
  "./images/9bg.png",
];

const CROSSFADE_MS = 700;
const HOLD_MS = 6000;
const TRANSITION_MS = 150;
const SWAP_AT = 0.55;
const AMBIENT_NOISE_OPACITY = 0.042;
const AMBIENT_SCANLINE_OPACITY = 0.028;

/** @type {number} */
let cycleToken = 0;
/** @type {number[]} */
let timers = [];
/** @type {number} */
let rafId = 0;

/** @type {number|null} */
let burstStart = null;
/** @type {boolean} */
let burstSwapped = false;
/** @type {(() => void)|null} */
let burstOnSwap = null;
/** @type {(() => void)|null} */
let burstOnDone = null;

function clearTimers() {
  timers.forEach((id) => window.clearTimeout(id));
  timers = [];
}

function schedule(fn, ms) {
  const id = window.setTimeout(fn, ms);
  timers.push(id);
  return id;
}

function escapeCssUrl(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function applyLayerBg(layer, url) {
  layer.style.backgroundImage = `url('${escapeCssUrl(url)}')`;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function preloadFrames() {
  MENU_BG_FRAMES.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

/**
 * @param {HTMLCanvasElement} canvas
 */
function resizeMenuCanvas(canvas) {
  const host = canvas.parentElement;
  if (!host) return null;

  const rect = host.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

/** @param {number} t 0..1 */
function easeInCubic(t) {
  return t * t * t;
}

/** @param {number} t 0..1 */
function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

/**
 * @param {number} t 0..1
 */
function burstEnvelope(t) {
  const riseEnd = 0.55;
  const peakEnd = 0.68;

  if (t < riseEnd) {
    return easeInCubic(t / riseEnd);
  }

  if (t < peakEnd) {
    return 1;
  }

  return easeOutCubic((1 - t) / (1 - peakEnd));
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 */
function drawTvNoise(ctx, width, height) {
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const bright = Math.random() < 0.34;
    const value = bright ? Math.floor(118 + Math.random() * 52) : Math.floor(Math.random() * 34);

    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value + Math.floor((Math.random() - 0.5) * 10);
    data[i + 3] = bright ? 210 : 140;
  }

  ctx.putImageData(imageData, 0, 0);
}

function resetBurst() {
  burstStart = null;
  burstSwapped = false;
  burstOnSwap = null;
  burstOnDone = null;
}

/**
 * @param {object} params
 * @param {number} params.token
 * @param {HTMLElement|null} params.stack
 * @param {HTMLCanvasElement|null} params.noiseCanvas
 * @param {HTMLElement|null} params.scanlines
 */
function startNoiseLoop({ token, stack, noiseCanvas, scanlines }) {
  if (!noiseCanvas) return;

  noiseCanvas.classList.add("is-active", "is-ambient");
  if (scanlines) scanlines.classList.add("is-active", "is-ambient");

  const draw = (now) => {
    if (token !== cycleToken) return;

    const surface = resizeMenuCanvas(noiseCanvas);
    if (!surface) {
      rafId = window.requestAnimationFrame(draw);
      return;
    }

    const { ctx, width, height } = surface;
    let burstIntensity = 0;

    if (burstStart !== null) {
      const progress = Math.min(1, (now - burstStart) / TRANSITION_MS);
      burstIntensity = burstEnvelope(progress);

      if (!burstSwapped && burstOnSwap && (burstIntensity >= 0.92 || progress >= SWAP_AT)) {
        burstSwapped = true;
        burstOnSwap();
      }

      if (progress >= 1) {
        const onDone = burstOnDone;
        resetBurst();
        stack?.classList.remove("main-menu__bg-stack--glitch-slide");
        onDone?.();
      }
    }

    drawTvNoise(ctx, width, height);

    const noiseOpacity = Math.min(0.72, AMBIENT_NOISE_OPACITY + burstIntensity * 0.58);
    noiseCanvas.style.opacity = String(noiseOpacity);

    if (scanlines) {
      scanlines.style.opacity = String(AMBIENT_SCANLINE_OPACITY + burstIntensity * 0.18);
    }

    rafId = window.requestAnimationFrame(draw);
  };

  rafId = window.requestAnimationFrame(draw);
}

/**
 * @param {HTMLElement|null} stack
 * @param {() => void} onSwap
 * @param {() => void} onDone
 */
function startBurst(stack, onSwap, onDone) {
  if (burstStart !== null) return;

  burstStart = performance.now();
  burstSwapped = false;
  burstOnSwap = onSwap;
  burstOnDone = onDone;
  stack?.classList.add("main-menu__bg-stack--glitch-slide");
}

export function stopMenuBgCycle() {
  cycleToken += 1;
  clearTimers();
  resetBurst();

  if (rafId) {
    window.cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

/**
 * @param {HTMLElement|null|undefined} root
 */
export function startMenuBgCycle(root) {
  if (!root) return;

  stopMenuBgCycle();
  preloadFrames();

  const token = cycleToken;
  const stack = root.querySelector(".main-menu__bg-stack");
  const layerA = root.querySelector(".main-menu__bg--a");
  const layerB = root.querySelector(".main-menu__bg--b");
  const noiseCanvas = root.querySelector(".main-menu__noise-canvas");
  const scanlines = root.querySelector(".main-menu__glitch-scanlines");

  if (!stack || !layerA || !layerB) return;

  const reducedMotion = prefersReducedMotion();
  let frameIndex = 0;
  let activeLayer = "a";

  applyLayerBg(layerA, MENU_BG_FRAMES[0]);
  layerA.classList.add("is-visible");
  layerB.classList.remove("is-visible", "is-entering", "is-leaving");
  layerB.style.backgroundImage = "";

  const isActive = () => token === cycleToken && document.contains(root);

  if (!reducedMotion) {
    startNoiseLoop({ token, stack, noiseCanvas, scanlines });
  }

  /** Мгновенная смена под полным шумом — без crossfade после затухания помех. */
  const swapBackgroundInstant = (nextIndex) => {
    const nextUrl = MENU_BG_FRAMES[nextIndex];
    const outgoing = activeLayer === "a" ? layerA : layerB;
    const incoming = activeLayer === "a" ? layerB : layerA;

    applyLayerBg(incoming, nextUrl);
    outgoing.classList.remove("is-visible", "is-entering", "is-leaving");
    incoming.classList.remove("is-entering", "is-leaving");
    incoming.classList.add("is-visible");

    activeLayer = activeLayer === "a" ? "b" : "a";
    frameIndex = nextIndex;
  };

  const swapBackground = (nextIndex) => {
    const nextUrl = MENU_BG_FRAMES[nextIndex];
    const outgoing = activeLayer === "a" ? layerA : layerB;
    const incoming = activeLayer === "a" ? layerB : layerA;

    applyLayerBg(incoming, nextUrl);
    incoming.classList.remove("is-visible", "is-entering", "is-leaving");
    outgoing.classList.remove("is-entering", "is-leaving");
    outgoing.classList.add("is-visible");

    void incoming.offsetWidth;

    outgoing.classList.add("is-leaving");
    incoming.classList.add("is-entering");

    const finish = () => {
      if (!isActive()) return;
      outgoing.classList.remove("is-visible", "is-leaving");
      incoming.classList.remove("is-entering");
      incoming.classList.add("is-visible");
    };

    const onEnterEnd = (event) => {
      if (event.target !== incoming) return;
      if (event.animationName !== "novel-bg-enter") return;
      incoming.removeEventListener("animationend", onEnterEnd);
      finish();
    };

    incoming.addEventListener("animationend", onEnterEnd);
    schedule(finish, CROSSFADE_MS + 80);

    activeLayer = activeLayer === "a" ? "b" : "a";
    frameIndex = nextIndex;
  };

  const playSlideGlitch = (onDone) => {
    if (!isActive()) {
      onDone();
      return;
    }

    if (reducedMotion) {
      swapBackground((frameIndex + 1) % MENU_BG_FRAMES.length);
      onDone();
      return;
    }

    const nextIndex = (frameIndex + 1) % MENU_BG_FRAMES.length;

    startBurst(
      stack,
      () => {
        if (!isActive()) return;
        swapBackgroundInstant(nextIndex);
      },
      onDone,
    );
  };

  const runCycleStep = () => {
    if (!isActive()) return;

    playSlideGlitch(() => {
      if (!isActive()) return;
      schedule(runCycleStep, HOLD_MS);
    });
  };

  schedule(runCycleStep, HOLD_MS);
}
