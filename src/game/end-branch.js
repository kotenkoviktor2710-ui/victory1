import { t } from "./i18n.js";

/** @type {Record<string, string>} */
const ENDING_SCENE_TO_FLOWCHART_KEY = {
  scene_e_end_emotional: "e-end-emotional",
  scene_e_end_technical: "e-end-tech",
  scene_e_end_best: "e-end-best",
  scene_e_end_philosophical: "e-end-phil",
  scene_e_end_neutral: "e-end-neutral",
};

const ENDING_SCENE_IDS = Object.keys(ENDING_SCENE_TO_FLOWCHART_KEY);

/** @type {string|null} */
let lastEndingBranchKey = null;

export function resetEndingBranch() {
  lastEndingBranchKey = null;
}

/**
 * @param {string} fromSceneId
 */
export function rememberEndingBranchFromScene(fromSceneId) {
  const key = ENDING_SCENE_TO_FLOWCHART_KEY[fromSceneId];
  if (key) {
    lastEndingBranchKey = key;
  }
}

/**
 * @param {string} prevSceneId
 * @param {Array<{ type: string, sceneId?: string }>} events
 */
export function captureEndingBranchFromAdvance(prevSceneId, events) {
  for (const event of events) {
    if (event.type === "scene_change" && event.sceneId === "scene_epilogue") {
      rememberEndingBranchFromScene(prevSceneId);
    }
  }
}

/**
 * @param {{ visitedScenes?: Set<string> }} [discovery]
 * @param {import("./story-loader.js").StoryBundle} [story]
 * @returns {string|null}
 */
function resolveEndingBranchKey(discovery, story) {
  if (lastEndingBranchKey) {
    return lastEndingBranchKey;
  }

  const visited = discovery?.visitedScenes;
  if (!visited) {
    return null;
  }

  let resolved = null;
  for (const sceneId of ENDING_SCENE_IDS) {
    if (visited.has(sceneId)) {
      resolved = ENDING_SCENE_TO_FLOWCHART_KEY[sceneId];
    }
  }

  return resolved;
}

/**
 * @param {string} branchKey
 * @param {import("./story-loader.js").StoryBundle} [story]
 * @returns {string|null}
 */
function getBranchLabel(branchKey, story) {
  const uiKey = `flowchart.nodes.${branchKey}`;
  const label = t(uiKey);
  if (label && label !== uiKey) {
    return label;
  }

  const sceneId = ENDING_SCENE_IDS.find((id) => ENDING_SCENE_TO_FLOWCHART_KEY[id] === branchKey);
  const sceneTitle = sceneId ? story?.scenes?.[sceneId]?.title?.trim() : null;
  return sceneTitle || null;
}

/**
 * @param {{ visitedScenes?: Set<string> }} [discovery]
 * @param {import("./story-loader.js").StoryBundle} [story]
 * @returns {string}
 */
export function getEndScreenTitle(discovery, story) {
  const branchKey = resolveEndingBranchKey(discovery, story);
  if (branchKey) {
    const branch = getBranchLabel(branchKey, story);
    if (branch) {
      return t("end.titleBranch", { branch });
    }
  }

  return t("end.title");
}
