const AudioCtx = window.AudioContext || window.webkitAudioContext;

/** @typedef {"music"|"sfx"|"sync"|"scanner"} AudioBus */

/** @type {AudioContext|null} */
let ctx = null;
/** @type {GainNode|null} */
let masterGain = null;
/** @type {Record<AudioBus, GainNode|null>} */
const busGains = {
  music: null,
  sfx: null,
  sync: null,
  scanner: null,
};

/** @type {Map<string, AudioBuffer>} */
const bufferCache = new Map();
/** @type {Map<string, Promise<AudioBuffer>>} */
const bufferLoading = new Map();

let suspendDepth = 0;
let suspendedByVisibility = false;
let listenersBound = false;
let unlockListenersActive = false;

export function clampVolume(percent) {
  return Math.max(0, Math.min(1, Number(percent) / 100));
}

function getContext() {
  if (!ctx && AudioCtx) {
    ctx = new AudioCtx();
    masterGain = ctx.createGain();
    for (const bus of /** @type {AudioBus[]} */ (["music", "sfx", "sync", "scanner"])) {
      const gain = ctx.createGain();
      gain.gain.value = 1;
      gain.connect(masterGain);
      busGains[bus] = gain;
    }
    masterGain.connect(ctx.destination);
    masterGain.gain.value = 1;
  }
  return ctx;
}

/**
 * @param {AudioBus} bus
 * @returns {GainNode|null}
 */
export function getBusGain(bus) {
  getContext();
  return busGains[bus] ?? null;
}

/**
 * @param {AudioBus} bus
 * @param {number} volumePercent
 */
export function setBusVolume(bus, volumePercent) {
  const gain = getBusGain(bus);
  if (gain) {
    gain.gain.value = clampVolume(volumePercent);
  }
}

function resetBusLevels() {
  for (const bus of /** @type {AudioBus[]} */ (["music", "sfx", "sync", "scanner"])) {
    setBusVolume(bus, 100);
  }
}

function suspendContext() {
  if (ctx?.state === "running") {
    void ctx.suspend();
  }
}

async function resumeContextAsync() {
  if (!ctx || ctx.state !== "suspended") return;
  try {
    await ctx.resume();
  } catch {
    /* ignore */
  }
}

function dispatchAudioResume() {
  window.dispatchEvent(new CustomEvent("webaudio:resume"));
}

async function resumePlaybackPipeline() {
  resetBusLevels();
  if (masterGain) {
    masterGain.gain.value = 1;
  }
  await resumeContextAsync();
  dispatchAudioResume();
}

function onExternalPause() {
  suspendDepth += 1;
  if (suspendDepth === 1) {
    suspendContext();
  }
}

function onExternalResume() {
  if (suspendDepth === 0) return;
  suspendDepth -= 1;
  if (suspendDepth === 0 && !document.hidden) {
    void resumePlaybackPipeline();
  }
}

function removeUnlockListeners() {
  if (!unlockListenersActive) return;
  unlockListenersActive = false;

  const handler = onUserGesture;
  for (const eventName of ["pointerdown", "touchstart", "keydown"]) {
    document.removeEventListener(eventName, handler, true);
  }
}

function onUserGesture() {
  void unlockWebAudio().then((unlocked) => {
    if (unlocked) {
      removeUnlockListeners();
      window.dispatchEvent(new CustomEvent("webaudio:unlocked"));
    }
  });
}

function bindUnlockOnInteraction() {
  if (unlockListenersActive) return;
  unlockListenersActive = true;

  for (const eventName of ["pointerdown", "touchstart", "keydown"]) {
    document.addEventListener(eventName, onUserGesture, true);
  }
}

function bindListeners() {
  if (listenersBound) return;
  listenersBound = true;

  for (const eventName of ["ads:pause", "platform:pause"]) {
    window.addEventListener(eventName, onExternalPause);
  }
  for (const eventName of ["ads:resume", "platform:resume"]) {
    window.addEventListener(eventName, onExternalResume);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      suspendedByVisibility = true;
      suspendContext();
      return;
    }
    suspendedByVisibility = false;
    if (suspendDepth === 0) {
      void resumePlaybackPipeline();
    }
  });
}

/** Единый AudioContext + пауза при рекламе / сворачивании вкладки (п. 1.3, 4.7). */
export function initWebAudio() {
  getContext();
  resetBusLevels();
  bindListeners();
  bindUnlockOnInteraction();
}

/**
 * @returns {Promise<boolean>}
 */
export async function unlockWebAudio() {
  const context = getContext();
  if (!context) return false;

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return false;
    }
  }

  return context.state === "running";
}

/** Разблокировка в обработчике жеста (без await). */
export function unlockWebAudioSync() {
  const context = getContext();
  if (!context || context.state !== "suspended") return;
  void context.resume();
}

/**
 * @param {string} url
 * @returns {Promise<AudioBuffer|null>}
 */
export async function loadAudioBuffer(url) {
  if (bufferCache.has(url)) {
    return bufferCache.get(url) ?? null;
  }

  if (bufferLoading.has(url)) {
    return bufferLoading.get(url) ?? null;
  }

  const promise = (async () => {
    const context = getContext();
    if (!context) return null;

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await context.decodeAudioData(arrayBuffer);
    bufferCache.set(url, buffer);
    bufferLoading.delete(url);
    return buffer;
  })();

  bufferLoading.set(url, promise);
  return promise;
}

export function preloadAudioBuffer(url) {
  void loadAudioBuffer(url);
}

export function isAudioBufferReady(url) {
  return bufferCache.has(url);
}

export function canPlayAudioNow() {
  return suspendDepth === 0 && !suspendedByVisibility;
}

/**
 * Синхронный one-shot в обработчике клика (без задержки async).
 * @param {string} url
 * @param {AudioBus} [bus]
 * @param {number} [volumePercent]
 * @returns {boolean}
 */
export function playOneShotSync(url, bus = "sfx", volumePercent = 80) {
  unlockWebAudioSync();
  if (!canPlayAudioNow()) return false;

  const context = getContext();
  const busGain = getBusGain(bus);
  const buffer = bufferCache.get(url);
  if (!context || !busGain || !buffer) return false;

  const playGain = context.createGain();
  playGain.gain.value = clampVolume(volumePercent);
  playGain.connect(busGain);

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(playGain);
  source.onended = () => {
    playGain.disconnect();
  };

  try {
    source.start(0);
    return true;
  } catch (error) {
    playGain.disconnect();
    if (import.meta.env.DEV) {
      console.warn("[web-audio] one-shot sync failed", error);
    }
    return false;
  }
}

/**
 * @param {string} url
 * @param {AudioBus} [bus]
 * @param {number} [volumePercent]
 */
export function playOneShot(url, bus = "sfx", volumePercent = 80) {
  if (playOneShotSync(url, bus, volumePercent)) {
    return;
  }

  void (async () => {
    if (!(await unlockWebAudio()) || !canPlayAudioNow()) return;

    const buffer = await loadAudioBuffer(url);
    if (!buffer) return;

    playOneShotSync(url, bus, volumePercent);
  })();
}

/**
 * @param {string} url
 * @param {AudioBus} bus
 * @param {number} volumePercent
 * @returns {Promise<(() => void)|null>}
 */
export async function playOneShotStoppable(url, bus = "sync", volumePercent = 80) {
  if (!(await unlockWebAudio()) || !canPlayAudioNow()) return null;

  const buffer = await loadAudioBuffer(url);
  const context = getContext();
  const busGain = getBusGain(bus);
  if (!buffer || !context || !busGain) return null;

  const playGain = context.createGain();
  playGain.gain.value = clampVolume(volumePercent);
  playGain.connect(busGain);

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(playGain);

  const stop = () => {
    try {
      source.stop();
    } catch {
      /* already stopped */
    }
    playGain.disconnect();
  };

  source.onended = () => {
    playGain.disconnect();
  };

  try {
    source.start(0);
  } catch {
    stop();
    return null;
  }

  return stop;
}

/**
 * @param {string} url
 * @param {AudioBus} [bus]
 */
export function createLoopPlayer(url, bus = "sfx") {
  /** @type {AudioBufferSourceNode|null} */
  let source = null;
  /** @type {GainNode|null} */
  let playerGain = null;
  let playing = false;
  let volumePercent = 80;

  function getPlayerGain() {
    const busGain = getBusGain(bus);
    const context = getContext();
    if (!busGain || !context) return null;

    if (!playerGain) {
      playerGain = context.createGain();
      playerGain.gain.value = clampVolume(volumePercent);
      playerGain.connect(busGain);
    }

    return playerGain;
  }

  function detachSource() {
    if (source) {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
      source.disconnect();
      source = null;
    }
    playing = false;
  }

  function beginFromBuffer(buffer, vol) {
    const context = getContext();
    const gain = getPlayerGain();
    if (!context || !gain || !buffer) return false;

    volumePercent = vol;
    gain.gain.value = clampVolume(vol);

    detachSource();

    source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);

    try {
      source.start(0);
      playing = true;
      return true;
    } catch {
      detachSource();
      return false;
    }
  }

  return {
    /**
     * @param {number} [vol]
     * @returns {Promise<boolean>}
     */
    async start(vol = volumePercent) {
      volumePercent = vol;
      if (!canPlayAudioNow()) return false;
      if (!(await unlockWebAudio())) {
        bindUnlockOnInteraction();
        return false;
      }

      if (playing) {
        this.setVolume(vol);
        return true;
      }

      const buffer = await loadAudioBuffer(url);
      if (!buffer) return false;
      return beginFromBuffer(buffer, vol);
    },

    /**
     * @param {number} [vol]
     * @returns {boolean}
     */
    startSync(vol = volumePercent) {
      volumePercent = vol;
      if (!canPlayAudioNow()) return false;

      unlockWebAudioSync();

      if (playing) {
        this.setVolume(vol);
        return true;
      }

      const buffer = bufferCache.get(url);
      if (!buffer) return false;
      return beginFromBuffer(buffer, vol);
    },

    stop: detachSource,
    isPlaying: () => playing,

    /**
     * @param {number} percent
     */
    setVolume(percent) {
      volumePercent = percent;
      const gain = getPlayerGain();
      if (gain) {
        gain.gain.value = clampVolume(percent);
      }
    },
  };
}
