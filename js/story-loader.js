/** Загрузка и нормализация сюжета из manifest.json + файлов веток. */

const MANIFEST_URL = "./story/manifest.json";

const FALLBACK_BACKGROUND = "./images/1bg.png";

const BACKGROUND_MAP = {
  BG_01: "./images/1bg.png",
  BG_02: "./images/2bg.png",
  BG_03: "./images/3bg.png",
  BG_04: "./images/4bg.png",
  BG_05: "./images/5bg.png",
  BG_06: "./images/6bg.png",
  BG_07: "./images/7bg.png",
  BG_08: "./images/8bg.png",
  BG_09: "./images/9bg.png",
  BG_10: "./images/10bg.png",
  BG_11: "./images/11bg.png",
  BG_12: "./images/12bg.png",
  BG_13: "./images/13bg.png",
  BG_14: "./images/14bg.png",
  BG_15: "./images/15bg.png",
  BG_16: "./images/16bg.png",
};

/**
 * @typedef {object} StoryBundle
 * @property {string} title
 * @property {string} initialSceneId
 * @property {Record<string, object>} scenes
 * @property {Record<string, { id: string, label: string, image: string|null }>} characters
 * @property {Record<string, string>} backgrounds
 * @property {Record<string, number>} variables
 */

/** @returns {Promise<StoryBundle>} */
export async function loadStory() {
  const manifestResponse = await fetch(MANIFEST_URL);
  if (!manifestResponse.ok) {
    throw new Error(`Не удалось загрузить манифест сюжета (${manifestResponse.status})`);
  }

  const manifest = await manifestResponse.json();
  const sceneFiles = manifest.files ?? [];

  const parts = await Promise.all(
    sceneFiles.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Не удалось загрузить ${url} (${response.status})`);
      }
      return response.json();
    }),
  );

  const mergedScenes = {};
  for (const part of parts) {
    Object.assign(mergedScenes, part.scenes ?? {});
  }

  return normalizeStory({
    ...manifest,
    scenes: mergedScenes,
  });
}

/** @param {object} raw */
function normalizeStory(raw) {
  const catalog = raw.storyAssetCatalog ?? {};
  const characters = {};

  for (const item of catalog.characters ?? []) {
    characters[item.id] = {
      id: item.id,
      label: item.label ?? item.id,
      image: typeof item.imageUrl === "string" && item.imageUrl ? item.imageUrl : null,
    };
  }

  const backgrounds = {};
  for (const item of catalog.backgrounds ?? []) {
    if (!item.key) continue;

    const imageUrl = typeof item.imageUrl === "string" && item.imageUrl ? item.imageUrl : null;
    backgrounds[item.key] = imageUrl ?? BACKGROUND_MAP[item.key] ?? FALLBACK_BACKGROUND;
  }

  if (!backgrounds.BG_01) {
    backgrounds.BG_01 = FALLBACK_BACKGROUND;
  }

  return {
    title: raw.storyTitle?.trim() || "Новая история",
    initialSceneId: raw.initialSceneId,
    scenes: raw.scenes ?? {},
    characters,
    backgrounds,
    variables: raw.defaultVariables ?? {},
  };
}

/** @param {StoryBundle} story @param {string} key */
export function resolveBackground(story, key) {
  return story.backgrounds[key] ?? FALLBACK_BACKGROUND;
}

/** @param {StoryBundle} story @param {string|null|undefined} speakerId */
export function resolveSpeaker(story, speakerId) {
  if (!speakerId) return null;
  return story.characters[speakerId] ?? { id: speakerId, label: speakerId, image: null };
}
