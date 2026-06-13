import buttonClickUrl from "../assets/audio/button-click.wav";
import notificationUrl from "../assets/audio/notification.wav";
import ringtoneUrl from "../assets/audio/rington.wav";
import sceneNextUrl from "../assets/audio/sceene_next.wav";
import scanningUrl from "../assets/audio/scanning.wav";
import {
  createLoopPlayer,
  initWebAudio,
  playOneShot,
  playOneShotSync,
  preloadAudioBuffer,
  unlockWebAudio,
} from "./web-audio.js";

/** UI-клики тише общих эффектов (сам файл button-click.wav громкий). */
const UI_CLICK_VOLUME_SCALE = 0.38;
const SCENE_NEXT_VOLUME_SCALE = 0.62;

let defaultSfxVolume = 80;
let defaultScannerVolume = 80;

/** @type {string|null} */
let lastNotificationText = null;
/** @type {string|null} */
let lastRingtoneText = null;

const scanningPlayer = createLoopPlayer(scanningUrl, "scanner");

function scaledVolume(percent, scale) {
  return Math.max(0, Math.min(100, Math.round(percent * scale)));
}

function playUiSound(url, volumePercent, scale = 1) {
  const vol = scaledVolume(volumePercent, scale);
  if (!playOneShotSync(url, "sfx", vol)) {
    playOneShot(url, "sfx", vol);
  }
}

/** Разблокировка AudioContext после первого взаимодействия. */
export function initUiSounds() {
  initWebAudio();
  preloadAudioBuffer(buttonClickUrl);
  preloadAudioBuffer(sceneNextUrl);
  preloadAudioBuffer(notificationUrl);
  preloadAudioBuffer(ringtoneUrl);
  preloadAudioBuffer(scanningUrl);
}

/**
 * @param {number} volumePercent
 */
export function setUiSfxVolume(volumePercent) {
  defaultSfxVolume = volumePercent;
}

/**
 * @param {number} [volumePercent]
 */
export function playButtonClick(volumePercent = defaultSfxVolume) {
  playUiSound(buttonClickUrl, volumePercent, UI_CLICK_VOLUME_SCALE);
}

/**
 * @param {object|null|undefined} line
 * @returns {boolean}
 */
export function isNotificationLine(line) {
  if (!line?.text) return false;
  return /уведомлен/i.test(String(line.text));
}

/**
 * @param {object|null|undefined} line
 * @param {number} [volumePercent]
 */
export function playNotificationForLine(line, volumePercent = defaultSfxVolume) {
  if (!isNotificationLine(line)) {
    lastNotificationText = null;
    return;
  }

  const text = String(line.text).trim();
  if (!text || text === lastNotificationText) return;

  lastNotificationText = text;
  playOneShot(notificationUrl, "sfx", volumePercent);
}

export function resetNotificationSound() {
  lastNotificationText = null;
}

/**
 * @param {object|null|undefined} line
 * @returns {boolean}
 */
export function isRingtoneLine(line) {
  if (!line?.text) return false;
  return /^Звонит\s/i.test(String(line.text).trim());
}

/**
 * @param {object|null|undefined} line
 * @param {number} [volumePercent]
 */
export function playRingtoneForLine(line, volumePercent = defaultSfxVolume) {
  if (!isRingtoneLine(line)) {
    lastRingtoneText = null;
    return;
  }

  const text = String(line.text).trim();
  if (!text || text === lastRingtoneText) return;

  lastRingtoneText = text;
  playOneShot(ringtoneUrl, "sfx", volumePercent);
}

export function resetRingtoneSound() {
  lastRingtoneText = null;
}

/** Переход к следующей реплике / сцене (клик по экрану, Space, Enter). */
export function playSceneNext(volumePercent = defaultSfxVolume) {
  playUiSound(sceneNextUrl, volumePercent, SCENE_NEXT_VOLUME_SCALE);
}

/**
 * @param {number} [volumePercent]
 */
export function startScanningSound(volumePercent = defaultScannerVolume) {
  defaultScannerVolume = volumePercent;
  scanningPlayer.setVolume(volumePercent);

  if (scanningPlayer.isPlaying()) {
    return;
  }

  void unlockWebAudio().then(() => {
    void scanningPlayer.start(volumePercent);
  });
}

export function stopScanningSound() {
  scanningPlayer.stop();
}

/**
 * @param {number} volumePercent
 */
export function setScanningSoundVolume(volumePercent) {
  defaultScannerVolume = volumePercent;
  scanningPlayer.setVolume(volumePercent);
}
