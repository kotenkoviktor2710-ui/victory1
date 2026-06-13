import bgGameUrl from "../assets/audio/bg-game.mp3";
import {
  canPlayAudioNow,
  createLoopPlayer,
  initWebAudio,
  loadAudioBuffer,
  preloadAudioBuffer,
  setBusVolume,
  unlockWebAudio,
  unlockWebAudioSync,
} from "./web-audio.js";

let targetVolume = 70;
let unlockListenersActive = false;

const bgmPlayer = createLoopPlayer(bgGameUrl, "music");

function removeUnlockListeners() {
  if (!unlockListenersActive) return;
  unlockListenersActive = false;

  const handler = onUserGesture;
  for (const eventName of ["pointerdown", "touchstart", "keydown"]) {
    document.removeEventListener(eventName, handler, true);
  }
  window.removeEventListener("webaudio:unlocked", onWebAudioUnlocked);
}

function onWebAudioUnlocked() {
  void tryAutoplayBgm();
}

function onUserGesture() {
  if (playBgmSync(targetVolume)) {
    removeUnlockListeners();
  }
}

function bindUnlockOnInteraction() {
  if (unlockListenersActive) return;
  unlockListenersActive = true;

  for (const eventName of ["pointerdown", "touchstart", "keydown"]) {
    document.addEventListener(eventName, onUserGesture, true);
  }
  window.addEventListener("webaudio:unlocked", onWebAudioUnlocked);
}

/**
 * Синхронный старт в обработчике клика (user gesture).
 * @param {number} [volumePercent]
 * @returns {boolean}
 */
export function playBgmSync(volumePercent = targetVolume) {
  targetVolume = volumePercent;

  if (volumePercent <= 0) {
    bgmPlayer.stop();
    return false;
  }

  if (!canPlayAudioNow()) {
    return false;
  }

  if (bgmPlayer.isPlaying()) {
    bgmPlayer.setVolume(volumePercent);
    return true;
  }

  if (bgmPlayer.startSync(volumePercent)) {
    removeUnlockListeners();
    return true;
  }

  bindUnlockOnInteraction();
  return false;
}

/**
 * @returns {Promise<boolean>}
 */
async function tryAutoplayBgm() {
  if (!canPlayAudioNow() || targetVolume <= 0) {
    return false;
  }

  if (bgmPlayer.isPlaying()) {
    bgmPlayer.setVolume(targetVolume);
    return true;
  }

  const unlocked = await unlockWebAudio();
  if (!unlocked) {
    bindUnlockOnInteraction();
    return false;
  }

  const started = await bgmPlayer.start(targetVolume);
  if (started) {
    removeUnlockListeners();
  } else {
    bindUnlockOnInteraction();
  }
  return started;
}

export function initBgm() {
  initWebAudio();
  setBusVolume("music", 100);
  preloadAudioBuffer(bgGameUrl);
  bindUnlockOnInteraction();
  window.addEventListener("webaudio:resume", onWebAudioResume);
}

function onWebAudioResume() {
  if (targetVolume <= 0) return;
  if (bgmPlayer.isPlaying()) {
    bgmPlayer.setVolume(targetVolume);
    return;
  }
  void tryAutoplayBgm();
}

/**
 * @param {number} [volumePercent]
 */
export function ensureBgmPlaying(volumePercent = 70) {
  targetVolume = volumePercent;

  if (volumePercent <= 0) {
    bgmPlayer.stop();
    return;
  }

  void loadAudioBuffer(bgGameUrl).then(() => {
    void tryAutoplayBgm();
  });
}

/** @deprecated alias */
export function resumeBgmFromGesture(volumePercent = targetVolume) {
  return playBgmSync(volumePercent);
}

/**
 * @param {number} volumePercent
 */
export function setBgmVolume(volumePercent) {
  targetVolume = volumePercent;
  bgmPlayer.setVolume(volumePercent);

  if (volumePercent <= 0) {
    bgmPlayer.stop();
  } else if (!bgmPlayer.isPlaying() && canPlayAudioNow()) {
    void tryAutoplayBgm();
  }
}

export function stopBgm() {
  bgmPlayer.stop();
}
