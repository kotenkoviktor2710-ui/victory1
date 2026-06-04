import { isSoundEnabled, subscribe } from "./settings.js";

const CLICK_URL = "assets/audio/click.wav";
const MUSIC_URL = "assets/audio/g.mp3";
const MUSIC_VOLUME = 0.38;

let audioCtx = null;
let clickBuffer = null;
let musicBuffer = null;
let loadPromise = null;

let musicSource = null;
let musicGain = null;
let musicStarted = false;
let adMusicPaused = false;
let pageHidden = false;

function getAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

async function resumeContext() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
}

async function loadClickBuffer() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const res = await fetch(CLICK_URL);
  if (!res.ok) throw new Error(`Не удалось загрузить ${CLICK_URL}`);

  const data = await res.arrayBuffer();
  clickBuffer = await ctx.decodeAudioData(data);
}

async function loadMusicBuffer() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const res = await fetch(MUSIC_URL);
  if (!res.ok) throw new Error(`Не удалось загрузить ${MUSIC_URL}`);

  const data = await res.arrayBuffer();
  musicBuffer = await ctx.decodeAudioData(data);
}

function ensureMusicGain() {
  const ctx = getAudioContext();
  if (!ctx) return null;

  if (!musicGain) {
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(ctx.destination);
  }

  return musicGain;
}

function getMusicGainValue() {
  return isSoundEnabled() && !adMusicPaused && !pageHidden ? MUSIC_VOLUME : 0;
}

function applyMusicGain() {
  const gain = ensureMusicGain();
  const ctx = getAudioContext();
  if (!gain || !ctx) return;

  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(getMusicGainValue(), ctx.currentTime);
}

function startBackgroundMusic() {
  if (musicStarted || !musicBuffer || adMusicPaused || !isSoundEnabled()) return;

  const ctx = getAudioContext();
  const gain = ensureMusicGain();
  if (!ctx || !gain) return;

  musicSource = ctx.createBufferSource();
  musicSource.buffer = musicBuffer;
  musicSource.loop = true;
  musicSource.connect(gain);
  musicSource.start(0);
  musicStarted = true;
  applyMusicGain();
}

export function pauseBackgroundMusic() {
  adMusicPaused = true;
  applyMusicGain();
}

export function resumeBackgroundMusic() {
  adMusicPaused = false;
  applyMusicGain();

  if (!musicStarted && musicBuffer && isSoundEnabled()) {
    resumeContext().then(() => startBackgroundMusic());
  }
}

function syncBackgroundMusic() {
  if (adMusicPaused) {
    applyMusicGain();
    return;
  }

  if (!isSoundEnabled()) {
    applyMusicGain();
    return;
  }

  resumeContext().then(() => {
    if (!musicStarted) {
      startBackgroundMusic();
    } else {
      applyMusicGain();
    }
  });
}

export function initUiAudio() {
  if (!loadPromise) {
    loadPromise = Promise.all([loadClickBuffer(), loadMusicBuffer()])
      .then(() => {
        subscribe(syncBackgroundMusic);
      })
      .catch((err) => {
        console.warn("[ui-audio]", err);
        loadPromise = null;
      });
  }
  return loadPromise;
}

export function tryStartBackgroundMusic() {
  syncBackgroundMusic();
}

export function playClick() {
  if (!isSoundEnabled()) return;
  if (!clickBuffer) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const source = ctx.createBufferSource();
  source.buffer = clickBuffer;

  const gain = ctx.createGain();
  gain.gain.value = 0.85;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(0);
}

function isUiClickTarget(target) {
  if (!(target instanceof Element)) return false;

  const interactive = target.closest(
    "button, a[href], [role='button'], input[type='button'], input[type='submit']"
  );
  if (!interactive) return false;

  if (interactive.matches("button:disabled, [aria-disabled='true']")) {
    return false;
  }

  return true;
}

function unlockAudio() {
  resumeContext().then(() => syncBackgroundMusic());
  document.removeEventListener("pointerdown", unlockAudio, true);
  document.removeEventListener("keydown", unlockAudio, true);
}

export function initAudioVisibilityHandler() {
  const syncPageVisibility = () => {
    pageHidden = document.hidden;
    applyMusicGain();

    const ctx = getAudioContext();
    if (!ctx) return;

    if (pageHidden) {
      ctx.suspend().catch(() => {});
      return;
    }

    ctx.resume().catch(() => {});
    if (isSoundEnabled() && !adMusicPaused) {
      syncBackgroundMusic();
    }
  };

  document.addEventListener("visibilitychange", syncPageVisibility);
  syncPageVisibility();
}

export function bindUiClickSounds(rootEl = document.getElementById("app")) {
  if (!rootEl) return;

  document.addEventListener("pointerdown", unlockAudio, true);
  document.addEventListener("keydown", unlockAudio, true);

  rootEl.addEventListener(
    "click",
    (e) => {
      if (!isUiClickTarget(e.target)) return;
      resumeContext().then(() => playClick());
    },
    true
  );
}
