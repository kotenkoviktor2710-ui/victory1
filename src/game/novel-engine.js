/** Движок визуальной новеллы — чистая логика сцен и реплик. */

/**
 * @typedef {import("./story-loader.js").StoryBundle} StoryBundle
 */

/**
 * @typedef {object} NovelState
 * @property {StoryBundle} story
 * @property {string} sceneId
 * @property {number} lineIndex
 * @property {"menu"|"playing"|"act_break"|"end_cinematic"|"ended"} phase
 */

/**
 * @param {StoryBundle} story
 */
export function createNovelState(story) {
  return {
    story,
    sceneId: story.initialSceneId,
    lineIndex: 0,
    phase: "menu",
  };
}

/** @param {NovelState} state @param {{ sceneId: string, lineIndex?: number }} checkpoint */
export function resumeStory(state, checkpoint) {
  return {
    ...state,
    sceneId: checkpoint.sceneId,
    lineIndex: checkpoint.lineIndex ?? 0,
    phase: "playing",
  };
}

/** @param {NovelState} state */
export function returnToMenu(state) {
  return {
    ...state,
    phase: "menu",
  };
}

/** @param {NovelState} state */
export function startStory(state) {
  return {
    ...state,
    sceneId: state.story.initialSceneId,
    lineIndex: 0,
    phase: "playing",
  };
}

/** @param {NovelState} state */
export function getCurrentScene(state) {
  return state.story.scenes[state.sceneId] ?? null;
}

/** @param {NovelState} state */
export function getCurrentLine(state) {
  const scene = getCurrentScene(state);
  if (!scene || state.phase !== "playing") return null;
  return scene.lines?.[state.lineIndex] ?? null;
}

export const PROTAGONIST_ID = "char_artem";
export const SYNC_CHARACTER_ID = "char_sync";

/** Спрайт протагониста на экране выбора. */
export function getChoicePresenterLayers() {
  return [{ id: PROTAGONIST_ID, slot: "left", dimmed: false }];
}
const HIDDEN_SPEAKER_IDS = new Set();

/** @param {string|null|undefined} speakerId */
function isVisibleSpeaker(speakerId) {
  return Boolean(speakerId && !HIDDEN_SPEAKER_IDS.has(speakerId));
}

/**
 * @param {object} scene
 * @param {string} speakerId
 * @param {number} lineIndex
 * @returns {"left"|"right"}
 */
function getCharacterSlot(scene, speakerId, lineIndex) {
  if (speakerId === PROTAGONIST_ID) {
    return "left";
  }

  const npcSpeakers = [];
  for (let i = 0; i <= lineIndex; i++) {
    const entry = scene.lines[i];
    if (entry?.kind === "dialogue" && isVisibleSpeaker(entry.speaker) && entry.speaker !== PROTAGONIST_ID) {
      if (!npcSpeakers.includes(entry.speaker)) {
        npcSpeakers.push(entry.speaker);
      }
    }
  }

  const npcIndex = npcSpeakers.indexOf(speakerId);
  return npcIndex % 2 === 0 ? "right" : "left";
}

/**
 * @param {object|null|undefined} scene
 * @param {object|null|undefined} line
 * @param {number} lineIndex
 */
function resolveCharacterLayers(scene, line, lineIndex) {
  if (scene?.characterLayers?.length) {
    return scene.characterLayers;
  }

  const speakerId = line?.speaker;
  if (!speakerId || line?.kind !== "dialogue") {
    return [];
  }

  if (speakerId === SYNC_CHARACTER_ID) {
    return [{ id: speakerId, slot: "right", dimmed: false }];
  }

  if (!isVisibleSpeaker(speakerId)) {
    return [];
  }

  return [
    {
      id: speakerId,
      slot: getCharacterSlot(scene, speakerId, lineIndex),
      dimmed: false,
    },
  ];
}

/** @param {NovelState} state */
export function getViewModel(state) {
  const scene = getCurrentScene(state);
  const line = getCurrentLine(state);

  return {
    phase: state.phase,
    sceneId: state.sceneId,
    lineIndex: state.lineIndex,
    scene,
    line,
    backgroundKey: scene?.backgroundKey ?? scene?.actBreak?.backgroundKey ?? "BG_01",
    characterLayers: resolveCharacterLayers(scene, line, state.lineIndex),
    actBreak: scene?.actBreak ?? null,
    choices: scene?.choices ?? [],
    canAdvance: canAdvance(state),
    isLastLine: isLastLine(state),
  };
}

/** @param {NovelState} state */
function canAdvance(state) {
  if (state.phase === "end_cinematic") return false;
  if (state.phase === "menu" || state.phase === "ended") return true;
  if (state.phase === "act_break") return true;

  const scene = getCurrentScene(state);
  if (!scene) return false;

  if (scene.lines?.length) return true;
  if (scene.actBreak?.enabled) return true;
  if (scene.choices?.length) return true;
  if (scene.autoNextSceneId) return true;

  return false;
}

/** @param {NovelState} state */
function isLastLine(state) {
  const scene = getCurrentScene(state);
  if (!scene?.lines?.length) return true;
  return state.lineIndex >= scene.lines.length - 1;
}

/**
 * @param {NovelState} state
 * @returns {{ state: NovelState, events: object[] }}
 */
export function advance(state) {
  if (state.phase === "menu") {
    return { state, events: [] };
  }

  if (state.phase === "ended" || state.phase === "end_cinematic") {
    return { state, events: [] };
  }

  if (state.phase === "act_break") {
    const scene = getCurrentScene(state);
    if (scene?.autoNextSceneId) {
      const nextSceneId = scene.autoNextSceneId;
      const nextScene = state.story.scenes[nextSceneId];
      const next = {
        ...state,
        sceneId: nextSceneId,
        lineIndex: 0,
        phase: "playing",
      };

      if (nextScene?.actBreak?.enabled && !nextScene.lines?.length) {
        return {
          state: { ...next, phase: "act_break" },
          events: [{ type: "scene_change", sceneId: nextSceneId }, { type: "act_break", actBreak: nextScene.actBreak }],
        };
      }

      return {
        state: next,
        events: [{ type: "scene_change", sceneId: nextSceneId }],
      };
    }

    return {
      state: { ...state, phase: "ended" },
      events: [{ type: "end" }],
    };
  }

  const scene = getCurrentScene(state);
  if (!scene) {
    return {
      state: { ...state, phase: "ended" },
      events: [{ type: "end" }],
    };
  }

  if (scene.lines?.length && state.lineIndex < scene.lines.length - 1) {
    const next = { ...state, lineIndex: state.lineIndex + 1 };
    return {
      state: next,
      events: [{ type: "line", lineIndex: next.lineIndex }],
    };
  }

  if (scene.choices?.length) {
    return { state, events: [{ type: "choices", choices: scene.choices }] };
  }

  if (scene.actBreak?.enabled && !scene.lines?.length) {
    return {
      state: { ...state, phase: "act_break" },
      events: [{ type: "act_break", actBreak: scene.actBreak }],
    };
  }

  if (scene.autoNextSceneId) {
    const nextSceneId = scene.autoNextSceneId;
    const nextScene = state.story.scenes[nextSceneId];
    const next = {
      ...state,
      sceneId: nextSceneId,
      lineIndex: 0,
    };

    if (nextScene?.actBreak?.enabled && !nextScene.lines?.length) {
      return {
        state: { ...next, phase: "act_break" },
        events: [{ type: "scene_change", sceneId: nextSceneId }, { type: "act_break", actBreak: nextScene.actBreak }],
      };
    }

    return {
      state: next,
      events: [{ type: "scene_change", sceneId: nextSceneId }],
    };
  }

  return {
    state: { ...state, phase: "ended" },
    events: [{ type: "end" }],
  };
}

const INTERNAL_CHOICE_LABEL_RE = /^(?:Ветка [A-Z]\d?|Скрытая S\d)\s*[—–-]\s*/iu;

/**
 * @param {string} text
 * @returns {string}
 */
export function formatChoicePathNoticeText(text) {
  return String(text).trim().replace(INTERNAL_CHOICE_LABEL_RE, "");
}

/**
 * @param {object|null|undefined} scene
 * @param {object|null|undefined} choice
 * @returns {{ title: string, text: string }|null}
 */
export function getChoicePathNotice(scene, choice) {
  if (!scene?.choices?.length || scene.choices.length < 2 || !choice?.text) {
    return null;
  }

  const text = formatChoicePathNoticeText(choice.text);
  if (!text) return null;

  if (scene.id === "scene_ch01_yard" || choice.nextSceneId?.startsWith("scene_ch02_")) {
    return { title: "Маршрут выбран", text };
  }

  if (scene.id === "scene_ch01_apartment") {
    return { title: "Решение принято", text };
  }

  return { title: "Путь выбран", text };
}

/** @param {NovelState} state @param {string} choiceId */
export function choose(state, choiceId) {
  const scene = getCurrentScene(state);
  const choice = scene?.choices?.find((item) => item.id === choiceId);
  if (!choice?.nextSceneId) {
    return { state, events: [{ type: "invalid_choice" }] };
  }

  const pathNotice = getChoicePathNotice(scene, choice);
  const next = {
    ...state,
    sceneId: choice.nextSceneId,
    lineIndex: 0,
    phase: "playing",
  };

  const events = [{ type: "scene_change", sceneId: choice.nextSceneId }];
  if (pathNotice) {
    events.push({ type: "path_notice", pathNotice });
  }

  return { state: next, events };
}

/** @param {NovelState} state */
export function getCheckpoint(state) {
  if (state.phase !== "playing") return null;
  return { sceneId: state.sceneId, lineIndex: state.lineIndex };
}
