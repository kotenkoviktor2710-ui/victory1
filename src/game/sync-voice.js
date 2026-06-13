import { SYNC_CHARACTER_ID } from "./novel-engine.js";
import { playOneShotStoppable, preloadAudioBuffer } from "./web-audio.js";

const voiceModules = import.meta.glob("../assets/audio/voice/sync_*.mp3", {
  eager: true,
  import: "default",
});

/** @type {Record<string, string>} */
const voiceByBaseName = {};

for (const [path, url] of Object.entries(voiceModules)) {
  const match = path.match(/(sync_[^/]+)\.mp3$/);
  if (match) {
    voiceByBaseName[match[1]] = url;
    preloadAudioBuffer(url);
  }
}

/** Текст реплики → имя файла без расширения (см. sync-replies.md). */
const SYNC_VOICE_BY_TEXT = {
  "Маршрут нестабилен. Необходимо повторить день.": "sync_01_prologue_route_unstable",
  "Доброе утро, Артём Воронов.": "sync_02_good_morning",
  "Маршрут подтверждён. Получатель ожидает.": "sync_03_apartment_route_confirmed",
  "Вы опаздываете на семь минут.": "sync_04_apartment_late_7min",
  "Вы отклонились от маршрута.": "sync_05_throw_route_deviation",
  "Попытка неудачна. Повтор дня запущен.": "sync_06_repeat_attempt_failed",
  "Маршрут нестабилен. Выберите приоритет.": "sync_07_hub_choose_priority",
  "Повтор запущен.": "sync_08_a_final_loop_restart",
  "Доставка принята. Данные сохранены. Повтор запущен.": "sync_09_b_final_delivery_saved",
  "Город стал безопаснее.": "sync_10_c_empty_city_safer",
  "Пустота не нарушает маршрут.": "sync_11_c_empty_void_ok",
  "Нестабильность устранена. День сохранён.": "sync_12_c_bad_stability_fixed",
  "Люди создавали риск.": "sync_13_c_bad_people_risk",
  "Следуйте инструкциям. Отклонение не требуется.": "sync_14_d_route_follow_instructions",
  "Радость не является обязательной для стабильности.": "sync_15_d_route_joy_optional",
  "День сохранён.": "sync_16_d_final_day_saved",
  "Риск превышает допустимый уровень. Рекомендуется полный контроль маршрутов.":
    "sync_17_e_crossroad_risk_level",
  "Ваш отказ повышает вероятность происшествия.": "sync_18_e_crossroad_refusal_risk",
  "Люди непредсказуемы.": "sync_19_e_crossroad_people_unpredictable",
  "Люди изменили исход.": "sync_20_e_emotional_outcome_changed",
  "Новый сценарий принят.": "sync_21_e_technical_scenario_accepted",
  "Люди изменили исход без принуждения.": "sync_22_e_best_outcome_voluntary",
  "День завершён?": "sync_23_e_best_day_complete",
  "Сценарий не найден. Новый сценарий принят.": "sync_24_e_philosophical_new_scenario",
};

/** @type {(() => void)|null} */
let stopCurrentVoice = null;
/** @type {string|null} */
let currentText = null;
let defaultSyncVolume = 80;

export function initSyncVoice() {
  /* Пауза/резюм — через единый AudioContext в web-audio.js */
}

export function stopSyncVoice() {
  if (stopCurrentVoice) {
    stopCurrentVoice();
    stopCurrentVoice = null;
  }
  currentText = null;
}

/**
 * @param {object|null|undefined} line
 * @param {number} [volumePercent]
 */
export function playSyncVoiceForLine(line, volumePercent = 80) {
  if (!line || line.kind !== "dialogue" || line.speaker !== SYNC_CHARACTER_ID) {
    stopSyncVoice();
    return;
  }

  const text = String(line.text ?? "").trim();
  if (!text || text === currentText) {
    setSyncVoiceVolume(volumePercent);
    return;
  }

  const baseName = SYNC_VOICE_BY_TEXT[text];
  const url = baseName ? voiceByBaseName[baseName] : null;
  if (!url) {
    stopSyncVoice();
    return;
  }

  stopSyncVoice();
  currentText = text;
  defaultSyncVolume = volumePercent;

  void playOneShotStoppable(url, "sync", volumePercent).then((stop) => {
    if (!stop) {
      if (currentText === text) {
        currentText = null;
      }
      return;
    }

    stopCurrentVoice = () => {
      stop();
      if (currentText === text) {
        currentText = null;
        stopCurrentVoice = null;
      }
    };
  });
}

export function setSyncVoiceVolume(volumePercent) {
  defaultSyncVolume = volumePercent;
}
