/** Орб «Синхрона» — круговая диаграмма с переливающимися кольцами. */

/** @type {number} */
let generation = 0;
/** @type {Map<HTMLElement, number>} */
const activeLoops = new Map();

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 * @param {number} time
 */
function drawCircularDiagram(ctx, cx, cy, radius, time) {
  const t = time * 0.001;

  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  bg.addColorStop(0, "#161c24");
  bg.addColorStop(0.55, "#0c1016");
  bg.addColorStop(1, "#06080c");
  ctx.fillStyle = bg;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  const ringCount = 14;
  for (let i = 1; i <= ringCount; i += 1) {
    const r = (radius * i) / (ringCount + 1);
    const wave = Math.sin(t * 2.8 - i * 0.62) * 0.5 + 0.5;
    const ripple = Math.sin(t * 1.6 + i * 0.4) * 0.5 + 0.5;
    const alpha = 0.06 + wave * 0.28 + ripple * 0.1;
    const isAccent = i % 4 === 0;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = isAccent
      ? `rgba(232, 93, 42, ${alpha * 1.1})`
      : `rgba(170, 210, 228, ${alpha})`;
    ctx.lineWidth = isAccent ? 1.4 : 0.8;
    ctx.stroke();
  }

  const arcLayers = 5;
  for (let layer = 0; layer < arcLayers; layer += 1) {
    const baseR = radius * (0.28 + layer * 0.14);
    const segments = 3 + layer;
    const spin = t * (0.6 + layer * 0.18) * (layer % 2 === 0 ? 1 : -1);

    for (let s = 0; s < segments; s += 1) {
      const start = spin + (s / segments) * Math.PI * 2;
      const sweep = Math.PI * (0.12 + 0.06 * Math.sin(t * 2 + layer + s));
      const shimmer = 0.18 + Math.sin(t * 3.5 + layer * 0.9 + s * 1.4) * 0.22;

      ctx.beginPath();
      ctx.arc(cx, cy, baseR, start, start + sweep);
      ctx.strokeStyle =
        layer % 2 === 0
          ? `rgba(200, 235, 248, ${shimmer})`
          : `rgba(232, 120, 72, ${shimmer * 0.85})`;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
  }

  const spokes = 12;
  for (let i = 0; i < spokes; i += 1) {
    const angle = (i / spokes) * Math.PI * 2 + t * 0.25;
    const inner = radius * 0.1;
    const outer = radius * 0.94;
    const spokeAlpha = 0.05 + Math.abs(Math.sin(t * 2.2 + i * 0.8)) * 0.14;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.strokeStyle = `rgba(130, 175, 200, ${spokeAlpha})`;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  const pulse = 0.55 + Math.sin(t * 3.2) * 0.45;
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.32);
  core.addColorStop(0, `rgba(220, 245, 255, ${0.75 * pulse})`);
  core.addColorStop(0.4, `rgba(150, 200, 230, ${0.22 * pulse})`);
  core.addColorStop(0.75, "rgba(232, 93, 42, 0.05)");
  core.addColorStop(1, "transparent");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.32, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(240, 250, 255, ${0.5 + pulse * 0.5})`;
  ctx.fill();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {number} time
 */
function drawFluidOrb(ctx, width, height, time) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 6;

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  drawCircularDiagram(ctx, cx, cy, radius, time);
  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {number} time
 */
function drawGlitchNoise(ctx, width, height, time) {
  const t = time * 0.001;
  ctx.clearRect(0, 0, width, height);

  if (Math.random() < 0.94) return;

  const y = Math.random() * height;
  const h = 1 + Math.random() * 2;
  ctx.fillStyle = `rgba(232, 93, 42, ${0.06 + Math.random() * 0.08})`;
  ctx.fillRect((Math.random() - 0.5) * 4, y, width, h);

  if (Math.sin(t * 12) > 0.88) {
    ctx.fillStyle = "rgba(180, 220, 240, 0.04)";
    ctx.fillRect(0, 0, width, height);
  }
}

/**
 * @param {HTMLElement} host
 * @param {number} gen
 */
function startOrb(host, gen) {
  const shell = host.querySelector(".sync-orb__shell");
  const fluidCanvas = host.querySelector(".sync-orb__fluid");
  const noiseCanvas = host.querySelector(".sync-orb__noise");
  if (!(fluidCanvas instanceof HTMLCanvasElement) || !(shell instanceof HTMLElement)) return;

  const draw = (now) => {
    if (gen !== generation) {
      activeLoops.delete(host);
      return;
    }

    const rect = shell.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.max(1, Math.floor(Math.min(rect.width, rect.height)));
    const width = size;
    const height = size;

    const resize = (canvas) => {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return ctx;
    };

    const fluidCtx = resize(fluidCanvas);
    if (fluidCtx) {
      drawFluidOrb(fluidCtx, width, height, now);
    }

    if (noiseCanvas instanceof HTMLCanvasElement) {
      const noiseCtx = resize(noiseCanvas);
      if (noiseCtx) {
        drawGlitchNoise(noiseCtx, width, height, now);
      }
    }

    activeLoops.set(host, window.requestAnimationFrame(draw));
  };

  activeLoops.set(host, window.requestAnimationFrame(draw));
}

export function stopSyncSilhouettes() {
  generation += 1;
  activeLoops.forEach((id) => window.cancelAnimationFrame(id));
  activeLoops.clear();
}

/**
 * @param {ParentNode|null|undefined} root
 */
export function refreshSyncSilhouettes(root) {
  stopSyncSilhouettes();
  const gen = generation;

  root?.querySelectorAll(".sync-orb").forEach((host) => {
    if (host instanceof HTMLElement) {
      startOrb(host, gen);
    }
  });
}
