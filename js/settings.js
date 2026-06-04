const STORAGE_KEY = "brawl_quiz_settings";

const DEFAULTS = {
  soundEnabled: true,
  emojiEffectsEnabled: true,
  hintsEnabled: true,
};

let settings = { ...DEFAULTS };
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(getSettings()));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...settings };

    const parsed = JSON.parse(raw);
    settings = {
      soundEnabled: parsed.soundEnabled !== false,
      emojiEffectsEnabled: parsed.emojiEffectsEnabled !== false,
      hintsEnabled: parsed.hintsEnabled !== false,
    };
  } catch {
    settings = { ...DEFAULTS };
  }

  return getSettings();
}

export function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn("[settings] save:", err);
  }
}

export function getSettings() {
  return { ...settings };
}

export function setSetting(key, value) {
  if (!(key in DEFAULTS)) return getSettings();

  settings[key] = Boolean(value);
  saveSettings();
  notify();
  return getSettings();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isSoundEnabled() {
  return settings.soundEnabled;
}

export function isEmojiEffectsEnabled() {
  return settings.emojiEffectsEnabled;
}

export function areHintsEnabled() {
  return settings.hintsEnabled;
}
