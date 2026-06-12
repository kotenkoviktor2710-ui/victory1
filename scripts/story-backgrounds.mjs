/** Ключи фонов и соответствие файлам (нумерация из README_prompts_last_day_courier_fixed.md). */

export const BACKGROUND_CATALOG = [
  { key: "BG_01", imageUrl: "./images/1bg.png", label: "Квартира Артёма утром" },
  { key: "BG_02", imageUrl: "./images/2bg.png", label: "Двор у дома" },
  { key: "BG_03", imageUrl: "./images/3bg.png", label: "Кафе «Минута»" },
  { key: "BG_04", imageUrl: "./images/4bg.png", label: "Склад доставки" },
  { key: "BG_05", imageUrl: "./images/5bg.png", label: "Кабинет Орловой" },
  { key: "BG_06", imageUrl: "./images/6bg.png", label: "Городская улица / остановка" },
  { key: "BG_07", imageUrl: "./images/7bg.png", label: "Перекрёсток днём" },
  { key: "BG_08", imageUrl: "./images/8bg.png", label: "Перекрёсток вечером, 19:43" },
  { key: "BG_09", imageUrl: "./images/9bg.png", label: "Лобби «Синхрон»" },
  { key: "BG_10", imageUrl: "./images/10bg.png", label: "Офис инженеров" },
  { key: "BG_11", imageUrl: "./images/11bg.png", label: "Крыша здания" },
  { key: "BG_12", imageUrl: "./images/12bg.png", label: "Архивная комната" },
  { key: "BG_13", imageUrl: "./images/13bg.png", label: "Серверная «Синхрон»" },
  { key: "BG_14", imageUrl: "./images/14bg.png", label: "Пустой город" },
  { key: "BG_15", imageUrl: "./images/15bg.png", label: "Финальное собрание в кафе" },
  { key: "BG_16", imageUrl: "./images/16bg.png", label: "Эпилог — обычное утро" },
];

/** @type {Record<string, string>} */
export const SCENE_BACKGROUNDS = {
  scene_prologue: "BG_08",

  scene_ch01_apartment: "BG_01",
  scene_ch01_after_take: "BG_01",
  scene_ch01_after_open: "BG_01",
  scene_ch01_after_max: "BG_01",
  scene_ch01_after_hide: "BG_01",
  scene_ch01_after_throw: "BG_01",
  scene_ch01_yard: "BG_02",
  scene_ch01_yard_max: "BG_02",

  scene_ch02_cafe: "BG_03",
  scene_ch02_cafe_tell: "BG_03",
  scene_ch02_cafe_hide: "BG_03",
  scene_ch02_cafe_take: "BG_03",
  scene_ch02_cafe_cameras: "BG_03",

  scene_ch02_warehouse: "BG_04",
  scene_ch02_warehouse_docs: "BG_04",
  scene_ch02_warehouse_help: "BG_04",
  scene_ch02_warehouse_deliver: "BG_04",
  scene_ch02_warehouse_leave: "BG_04",

  scene_ch02_orlova: "BG_05",
  scene_ch02_orlova_evidence: "BG_05",
  scene_ch02_orlova_archive: "BG_05",
  scene_ch02_orlova_blame: "BG_05",
  scene_ch02_orlova_leave: "BG_05",

  scene_ch02_observe: "BG_06",
  scene_ch02_observe_record: "BG_06",
  scene_ch02_observe_help: "BG_06",
  scene_ch02_observe_follow: "BG_06",
  scene_ch02_observe_nika: "BG_06",

  scene_ch03_evening: "BG_07",
  scene_ch03_crossroad: "BG_08",
  scene_ch03_action_save: "BG_08",
  scene_ch03_action_deliver: "BG_08",
  scene_ch03_action_film: "BG_08",
  scene_ch03_action_obey: "BG_08",
  scene_ch03_action_chaos: "BG_08",
  scene_ch03_repeat: "BG_01",

  scene_ch04_apartment: "BG_01",
  scene_ch04_truth_max: "BG_01",
  scene_ch04_truth_nika: "BG_01",
  scene_ch04_truth_orlova: "BG_01",
  scene_ch04_truth_lera: "BG_01",
  scene_ch04_truth_nobody: "BG_01",
  scene_ch04_lera_meet: "BG_09",
  scene_ch04_lera_trust: "BG_09",
  scene_ch04_lera_questions: "BG_09",
  scene_ch04_lera_blame: "BG_09",
  scene_ch04_lera_pretend: "BG_09",
  scene_ch04_sync_office: "BG_10",
  scene_ch04_hub: "BG_09",

  scene_a1_search: "BG_06",
  scene_a1_loop: "BG_06",
  scene_a1_danger: "BG_06",
  scene_a1_avoid: "BG_06",
  scene_a2_sisters: "BG_11",
  scene_a2_leave: "BG_11",
  scene_a_orlova: "BG_08",
  scene_a_nika: "BG_08",
  scene_a_final: "BG_08",

  scene_b1_address: "BG_04",
  scene_b2_inside: "BG_01",
  scene_b_hide: "BG_01",
  scene_b_orlova: "BG_01",
  scene_b_destroy: "BG_01",
  scene_b_final: "BG_13",

  scene_c1_empty: "BG_14",
  scene_c_bad_end: "BG_14",
  scene_c_escape: "BG_03",

  scene_d1_route: "BG_06",
  scene_d_ask: "BG_06",
  scene_d_break: "BG_06",
  scene_d_lera: "BG_06",
  scene_d_final: "BG_07",

  scene_s1_city: "BG_06",
  scene_s1_lera: "BG_06",
  scene_s1_publish: "BG_06",
  scene_s1_archive: "BG_12",

  scene_s2_video: "BG_01",
  scene_s2_lera: "BG_01",
  scene_s2_orlova: "BG_01",
  scene_s2_alone: "BG_01",
  scene_s2_nika: "BG_01",

  scene_e1_council: "BG_15",
  scene_e2_crossroad: "BG_08",
  scene_e_end_emotional: "BG_08",
  scene_e_end_best: "BG_08",
  scene_e_end_philosophical: "BG_08",
  scene_e_end_technical: "BG_13",
  scene_e_end_neutral: "BG_13",

  scene_epilogue: "BG_16",
};

/** @param {Record<string, object>} scenes */
export function applySceneBackgrounds(scenes) {
  for (const [id, scene] of Object.entries(scenes)) {
    const key = SCENE_BACKGROUNDS[id] ?? "BG_01";
    scene.backgroundKey = key;
    if (scene.actBreak) {
      scene.actBreak.backgroundKey = key;
    }
  }
  return scenes;
}
