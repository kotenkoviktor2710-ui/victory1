import cityUrl from "../assets/audio/city.mp3";
import { canPlayAudioNow, createLoopPlayer, preloadAudioBuffer } from "./web-audio.js";

/** @type {string|null} */
let lastCityLineKey = null;
let defaultSfxVolume = 80;

const cityPlayer = createLoopPlayer(cityUrl, "sfx");

/** Интерьеры — без уличного эмбиента (city.mp3). */
const CITY_OFF_BACKGROUNDS = new Set([
  "BG_01", // квартира Артёма
  "BG_03",
  "BG_04",
  "BG_09",
  "BG_10",
  "BG_12",
  "BG_13",
  "BG_14",
  "BG_15",
]);

const CITY_STOP_PATTERNS = [
  /прогноз — это тишина/i,
  /нет машин, людей, голосов/i,
];

const CITY_PLAY_PATTERNS = [
  /шум города/i,
  /город шумит/i,
  /машины стоят у светофора/i,
  /звук тормозов/i,
  /грузовик подъезжает/i,
  /светофор гаснет/i,
  /светофор начинает сбоить/i,
  /сбой светофора/i,
  /лаять на телефон/i,
  /бублик подбегает/i,
  /остановившиеся на 19:43/i,
  /^19:43\b/m,
  /перекрёсток\. 19:43/i,
  /обрывается на 19:43/i,
  /роняет кофе/i,
  /роняет стакан кофе/i,
  /автобус опаздывает/i,
  /сквозь хаос/i,
  /хаос только растёт/i,
];

preloadAudioBuffer(cityUrl);

function stopCitySound() {
  cityPlayer.stop();
}

/**
 * @param {object|null|undefined} line
 * @returns {"play"|"stop"|null}
 */
export function getStoryCityAction(line) {
  if (!line) return null;

  if (!line.text) return null;

  const text = String(line.text).trim();
  if (!text) return null;

  if (CITY_STOP_PATTERNS.some((pattern) => pattern.test(text))) {
    return "stop";
  }

  if (CITY_PLAY_PATTERNS.some((pattern) => pattern.test(text))) {
    return "play";
  }

  return null;
}

/**
 * @param {number} volumePercent
 */
export function setStoryCityVolume(volumePercent) {
  defaultSfxVolume = volumePercent;
  cityPlayer.setVolume(volumePercent);
}

/**
 * @param {string|null|undefined} backgroundKey
 * @returns {boolean}
 */
export function isCityAmbientBackground(backgroundKey) {
  if (!backgroundKey) return true;
  return !CITY_OFF_BACKGROUNDS.has(backgroundKey);
}

/**
 * @param {object|null|undefined} line
 * @param {number} [volumePercent]
 * @param {string|null|undefined} [backgroundKey]
 */
export function playStoryCityForLine(line, volumePercent = defaultSfxVolume, backgroundKey = null) {
  if (!isCityAmbientBackground(backgroundKey)) {
    stopCitySound();
    lastCityLineKey = null;
    return;
  }

  const action = getStoryCityAction(line);

  if (action === "stop") {
    stopCitySound();
    lastCityLineKey = null;
    return;
  }

  if (action !== "play") {
    stopCitySound();
    lastCityLineKey = null;
    return;
  }

  const lineKey = line?.text
    ? String(line.text).trim()
    : line?.effect === "white_flash"
      ? "__white_flash__"
      : null;

  if (!lineKey || lineKey === lastCityLineKey) return;

  lastCityLineKey = lineKey;

  if (!canPlayAudioNow()) return;

  void cityPlayer.start(volumePercent);
}

export function resetStoryCitySound() {
  stopCitySound();
  lastCityLineKey = null;
}

function onWebAudioResume() {
  if (!cityPlayer.isPlaying() || defaultSfxVolume <= 0) return;
  cityPlayer.setVolume(defaultSfxVolume);
}

if (typeof window !== "undefined") {
  window.addEventListener("webaudio:resume", onWebAudioResume);
}
