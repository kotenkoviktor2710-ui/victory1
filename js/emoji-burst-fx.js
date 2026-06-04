import { isEmojiEffectsEnabled } from "./settings.js";

const MIN_PARTICLES = 6;
const MAX_PARTICLES = 10;
const LAYER_ID = "emoji-burst-layer";
const SPAWN_BOTTOM_MIN = 0;
const SPAWN_BOTTOM_MAX = 6;
const preloadCache = new Set();

const MOTION_PROFILES = ["straight", "sweep", "sway", "quick"];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildBurstPool(urls, count) {
  const unique = shuffle(urls);
  const pool = [];

  for (let i = 0; i < count; i += 1) {
    pool.push(unique[i % unique.length]);
  }

  return shuffle(pool);
}

function preloadImage(url) {
  if (preloadCache.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "sync";
    const finish = () => {
      preloadCache.add(url);
      resolve();
    };
    img.onload = finish;
    img.onerror = finish;
    img.src = url;
  });
}

async function preloadImages(urls) {
  const unique = [...new Set(urls)];
  await Promise.all(unique.map((url) => preloadImage(url)));
}

function getBurstLayer() {
  const host = document.getElementById("screen-game");
  if (!host) return null;

  let layer = document.getElementById(LAYER_ID);
  if (!layer) {
    layer = document.createElement("div");
    layer.id = LAYER_ID;
    layer.className = "emoji-burst";
    layer.setAttribute("aria-hidden", "true");
    host.appendChild(layer);
  }

  return layer;
}

function pickProfile() {
  return MOTION_PROFILES[Math.floor(Math.random() * MOTION_PROFILES.length)];
}

function pickSpawnLeft(profile) {
  if (profile === "sweep") {
    return Math.random() < 0.5 ? 8 + Math.random() * 28 : 64 + Math.random() * 28;
  }

  if (profile === "sway") {
    return 22 + Math.random() * 56;
  }

  return 8 + Math.random() * 84;
}

function pickSizeTier() {
  const roll = Math.random();
  if (roll < 0.22) return 64 + Math.random() * 14;
  if (roll < 0.78) return 76 + Math.random() * 28;
  return 98 + Math.random() * 22;
}

function createMotionConfig(profile) {
  const driftSign = Math.random() < 0.5 ? -1 : 1;
  const driftBase = 70 + Math.random() * 55;

  switch (profile) {
    case "sweep":
      return {
        drift: driftSign * driftBase * 1.35,
        lift: -90 - Math.random() * 8,
        rotate: driftSign * (12 + Math.random() * 18),
        durationMul: 1 + Math.random() * 0.12,
        sway: 0,
      };
    case "sway":
      return {
        drift: driftSign * driftBase * 0.85,
        lift: -86 - Math.random() * 10,
        rotate: driftSign * (6 + Math.random() * 12),
        durationMul: 1.08 + Math.random() * 0.15,
        sway: driftSign * (18 + Math.random() * 22),
      };
    case "quick":
      return {
        drift: driftSign * driftBase * 0.55,
        lift: -76 - Math.random() * 8,
        rotate: driftSign * (4 + Math.random() * 10),
        durationMul: 0.78 + Math.random() * 0.12,
        sway: 0,
      };
    default:
      return {
        drift: driftSign * driftBase * 0.65,
        lift: -88 - Math.random() * 6,
        rotate: driftSign * (2 + Math.random() * 8),
        durationMul: 0.95 + Math.random() * 0.18,
        sway: 0,
      };
  }
}

function tf(x, y, rotateDeg, scale = 1) {
  return `translate3d(${x}px, ${y}vh, 0) rotate(${rotateDeg}deg) scale(${scale})`;
}

function buildEaseInKeyframes({ drift, lift, rotate, sway }) {
  const midSway = sway * 0.55;

  return [
    { transform: tf(0, 0, 0), opacity: 0 },
    { transform: tf(drift * 0.05, -1.8, rotate * 0.08), opacity: 0.75, offset: 0.05 },
    { transform: tf(drift * 0.12 + midSway * 0.15, -5, rotate * 0.18), opacity: 1, offset: 0.12 },
    { transform: tf(drift * 0.22 + midSway * 0.35, -11, rotate * 0.32), opacity: 1, offset: 0.22 },
    { transform: tf(drift * 0.35 + midSway * 0.55, -20, rotate * 0.46), opacity: 1, offset: 0.34 },
    { transform: tf(drift * 0.5 + midSway * 0.75, -32, rotate * 0.6), opacity: 1, offset: 0.46 },
    { transform: tf(drift * 0.65 + midSway * 0.9, -45, rotate * 0.74), opacity: 0.96, offset: 0.58 },
    { transform: tf(drift * 0.78 + midSway, -58, rotate * 0.86), opacity: 0.85, offset: 0.7 },
    { transform: tf(drift * 0.9, -72, rotate * 0.94), opacity: 0.5, offset: 0.84 },
    { transform: tf(drift, lift, rotate), opacity: 0, offset: 1 },
  ];
}

function runBurstAnimation(img, track, layer, motion, delayMs, durationMs) {
  const animation = img.animate(buildEaseInKeyframes(motion), {
    duration: durationMs,
    delay: delayMs,
    easing: "linear",
    fill: "both",
  });

  animation.finished
    .then(() => {
      track.remove();
      if (layer.childElementCount === 0) layer.remove();
    })
    .catch(() => {
      track.remove();
    });
}

function spawnParticle(layer, url, index, waveDelay = 0) {
  const profile = pickProfile();
  const motion = createMotionConfig(profile);

  const track = document.createElement("div");
  track.className = "emoji-burst__track";

  const img = document.createElement("img");
  img.className = "emoji-burst__item";
  img.src = url;
  img.alt = "";
  img.decoding = "sync";
  img.loading = "eager";
  img.width = 96;
  img.height = 96;

  const left = pickSpawnLeft(profile);
  const spawnBottom =
    SPAWN_BOTTOM_MIN + Math.random() * (SPAWN_BOTTOM_MAX - SPAWN_BOTTOM_MIN);
  const delayMs = (waveDelay + index * 0.04 + Math.random() * 0.06) * 1000;
  const durationMs = (1.75 + Math.random() * 0.35) * motion.durationMul * 1000;
  const size = pickSizeTier();
  const halfSize = size / 2;

  track.style.left = `${left}%`;
  track.style.bottom = `${spawnBottom}%`;
  track.style.width = `${size}px`;
  track.style.height = `${size}px`;
  track.style.marginLeft = `${-halfSize}px`;

  track.appendChild(img);
  layer.appendChild(track);

  requestAnimationFrame(() => {
    runBurstAnimation(img, track, layer, motion, delayMs, durationMs);
  });
}

function scheduleLayerCleanup(layer) {
  window.setTimeout(() => {
    if (layer && layer.childElementCount === 0) {
      layer.remove();
    }
  }, 3600);
}

/**
 * TikTok-style burst: emoji fly from bottom to top and fade out.
 * Duplicates urls if fewer than MIN_PARTICLES are available.
 */
export async function launchEmojiBurst(urls) {
  if (!urls?.length) return;
  if (!isEmojiEffectsEnabled()) return;

  const layer = getBurstLayer();
  if (!layer) return;

  const count =
    MIN_PARTICLES + Math.floor(Math.random() * (MAX_PARTICLES - MIN_PARTICLES + 1));
  const pool = buildBurstPool(urls, count);

  await preloadImages(pool);

  const waveSplit = Math.max(5, Math.ceil(count * 0.6));

  pool.forEach((url, index) => {
    const waveDelay = index >= waveSplit ? 0.12 + Math.random() * 0.06 : 0;
    spawnParticle(layer, url, index, waveDelay);
  });

  scheduleLayerCleanup(layer);
}

export function clearEmojiBurst() {
  document.getElementById(LAYER_ID)?.remove();
}
