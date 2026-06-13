import {
  bindStoryFlowchartPan,
  fitStoryFlowchartViewport,
  getItemSearchItems,
  isItemSearchLine,
  renderEndScreen,
  renderMainMenu,
  patchNovelScreen,
  renderNovelScreen,
  showPathNotice,
} from "./ui.js";
import { initI18n, t, getUiValue } from "./i18n.js";
import { novelSdk } from "./novelPlatform.ts";
import { AdManager } from "./ad-manager.js";
import {
  advance,
  choose,
  createNovelState,
  getCheckpoint,
  getChoicePresenterLayers,
  getCurrentLine,
  getCurrentScene,
  getViewModel,
  resumeStory,
  returnToMenu,
  startStory,
} from "./novel-engine.js";
import { playEndSequence, preloadEndVideo } from "./end-sequence.js";
import {
  captureEndingBranchFromAdvance,
  getEndScreenTitle,
  resetEndingBranch,
} from "./end-branch.js";
import { playSoftWhiteFlash } from "./screen-effects.js";
import { loadStory, resolveBackground } from "./story-loader.js";
import {
  getGlobalFlowchartProgress,
  normalizeDiscovery,
  recordDiscovery,
  serializeDiscovery,
} from "./story-flowchart.js";
import {
  clearStoryFlowchartLayoutCache,
  getFlowchartLayoutDirection,
  layoutStoryFlowchart,
} from "./story-flowchart-layout.js";
import { startAnomalyScan, stopAnomalyScan } from "./anomaly-scan.js";
import { startMenuBgCycle, stopMenuBgCycle } from "./menu-bg-cycle.js";
import { refreshSyncSilhouettes, stopSyncSilhouettes } from "./sync-silhouette.js";
import {
  initSyncVoice,
  playSyncVoiceForLine,
  setSyncVoiceVolume,
  stopSyncVoice,
} from "./sync-voice.js";
import { ensureBgmPlaying, initBgm, playBgmSync, setBgmVolume, stopBgm } from "./bgm.js";
import {
  initUiSounds,
  playButtonClick,
  playNotificationForLine,
  playRingtoneForLine,
  playSceneNext,
  resetNotificationSound,
  resetRingtoneSound,
  setScanningSoundVolume,
  setUiSfxVolume,
} from "./ui-sounds.js";
import {
  playStoryCityForLine,
  resetStoryCitySound,
  setStoryCityVolume,
} from "./story-sounds.js";
import "./viewport.js";

const SAVE_KEY = "novel_progress";
const DISCOVERY_KEY = "story_discovery";
const SETTINGS_KEY = "novel_settings";
const DEFAULT_SETTINGS = { music: 70, sfx: 80, sync: 80, scanner: 80 };

const sdk = novelSdk;

function getAdContext() {
  return {
    phase: novelState?.phase ?? null,
    gameOverlay: Boolean(gameOverlay),
    menuOverlay: Boolean(menuOverlay),
    choicesVisible,
    textAnimating,
    scanHelpOpen,
    overlayClosing,
  };
}

const adManager = new AdManager(sdk, {
  intervalMs: 120_000,
  warningMs: 3_000,
  getContext: getAdContext,
});

/** @type {HTMLElement|null} */
let app = null;

/** @type {import("./novel-engine.js").NovelState|null} */
let novelState = null;
/** @type {{ sceneId: string, lineIndex: number }|null} */
let savedCheckpoint = null;
/** @type {"settings"|"story"|null} */
let menuOverlay = null;
/** @type {{ visitedScenes: Set<string>, visitedChoices: Set<string> }} */
let storyDiscovery = normalizeDiscovery(null);
/** @type {import("./story-flowchart-layout.js").StoryFlowchartLayout|null} */
let storyFlowchartLayout = null;
/** @type {import("./story-flowchart-layout.js").FlowchartLayoutDirection|null} */
let storyFlowchartLayoutDirection = null;
/** @type {"menu"|"settings"|null} */
let gameOverlay = null;
/** @type {boolean} */
let choicesVisible = false;
/** @type {{ music: number, sfx: number, sync: number, scanner: number }} */
let settings = { ...DEFAULT_SETTINGS };
/** @type {boolean} */
let overlayClosing = false;
/** @type {boolean} */
let scanHelpOpen = false;
let textAnimating = false;
/** @type {Map<string, Set<string>>} */
const searchFoundByKey = new Map();
/** @type {Map<string, Set<string>>} */
const searchRevealedByKey = new Map();

const OVERLAY_LEAVE_MS = 300;
const TEXTBOX_ANIM_MS = 260;

let currentBgUrl = null;
let currentBgKey = null;
let activeBgLayer = "a";
let previousCharacterLayers = [];

const BG_CROSSFADE_MS = 600;

export async function bootstrapNovel(container) {
  app = container;

  await sdk.init();

  if (!getUiValue("game.title")) {
    await initI18n();
  }

  initSyncVoice();
  initUiSounds();
  initBgm();
  preloadEndVideo();

  document.title = t("game.title");

  clearStoryFlowchartLayoutCache();
  storyFlowchartLayout = null;
  storyFlowchartLayoutDirection = null;

  const story = await loadStory();
  const saved = await sdk.loadData([SAVE_KEY, DISCOVERY_KEY, SETTINGS_KEY]);

  novelState = createNovelState(story);
  savedCheckpoint = normalizeCheckpoint(saved?.[SAVE_KEY], story);
  storyDiscovery = normalizeDiscovery(saved?.[DISCOVERY_KEY]);
  settings = normalizeSettings(saved?.[SETTINGS_KEY]);

  if (savedCheckpoint) {
    recordDiscovery(storyDiscovery, savedCheckpoint.sceneId, null);
  }

  render();
  bindInput();
  bindStoryFlowchartResize();
  void ensureStoryFlowchartLayout();
  adManager.start();
  applyAudioSettings();
  ensureBgmPlaying(settings.music);
}

function applyAudioSettings() {
  setBgmVolume(settings.music);
  setUiSfxVolume(settings.sfx);
  setStoryCityVolume(settings.sfx);
  setSyncVoiceVolume(settings.sync);
  setScanningSoundVolume(settings.scanner);
}

function reportBootstrapError(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[bootstrap]", message, error);
}

function ensureStoryFlowchartLayout() {
  const direction = getFlowchartLayoutDirection();
  if (storyFlowchartLayout && storyFlowchartLayoutDirection === direction) {
    return Promise.resolve(storyFlowchartLayout);
  }

  return layoutStoryFlowchart()
    .then((layout) => {
      storyFlowchartLayout = layout;
      storyFlowchartLayoutDirection = layout.direction;
      if (menuOverlay === "story") render();
      return layout;
    })
    .catch((error) => {
      console.error("[flowchart] Не удалось построить карту сюжета:", error);
      return null;
    });
}

function normalizeCheckpoint(raw, story) {
  if (!raw?.sceneId || !story?.scenes[raw.sceneId]) return null;
  return {
    sceneId: raw.sceneId,
    lineIndex: Math.max(0, Number(raw.lineIndex) || 0),
  };
}

function normalizeSettings(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SETTINGS };

  const sfx = clampPercent(raw.sfx, DEFAULT_SETTINGS.sfx);

  return {
    music: clampPercent(raw.music, DEFAULT_SETTINGS.music),
    sfx,
    sync: clampPercent(raw.sync, sfx),
    scanner: clampPercent(raw.scanner, sfx),
  };
}

function clampPercent(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(100, Math.max(0, Math.round(num)));
}

function setLoaderText(_text) {
  /* лоадер — Vue LoadingScreen */
}

function updateLoaderBranding() {
  /* брендинг — Vue LoadingScreen */
}

function bindStoryFlowchartResize() {
  window.addEventListener("resize", () => {
    if (menuOverlay !== "story") return;

    const direction = getFlowchartLayoutDirection();
    if (storyFlowchartLayout && storyFlowchartLayoutDirection !== direction) {
      storyFlowchartLayout = null;
      storyFlowchartLayoutDirection = null;
      clearStoryFlowchartLayoutCache();
      void ensureStoryFlowchartLayout();
      return;
    }

    if (storyFlowchartLayout) {
      fitStoryFlowchartViewport();
      bindStoryFlowchartPan();
    }
  });
}

async function runEndCinematic() {
  if (!novelState || !app) return;

  stopSyncVoice();
  resetNotificationSound();
  resetRingtoneSound();
  resetStoryCitySound();
  stopAnomalyScan();
  stopSyncSilhouettes();
  stopBgm();
  await saveProgress();
  await playEndSequence(app);
  novelState = { ...novelState, phase: "ended" };
  sdk.gameplayStop();
  render();
}

function bindInput() {
  window.addEventListener("keydown", (event) => {
    if (!novelState || novelState.phase !== "playing") return;
    if (gameOverlay || choicesVisible || adManager.isBlocking()) return;
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      onAdvance();
    }
  });

  window.addEventListener("platform:pause", () => {
    saveProgress();
    adManager.pause();
  });

  window.addEventListener("platform:resume", () => {
    adManager.resume();
  });

  window.addEventListener("ads:pause", () => {
    adManager.pause();
  });

  window.addEventListener("ads:resume", () => {
    adManager.resume();
  });
}

function bindUiEvents() {
  app.querySelector(".novel[data-action='advance']")?.addEventListener("click", (event) => {
    if (event.target.closest("[data-stop-advance]")) return;
    if (adManager.isBlocking()) return;
    onAdvance();
  });

  app.querySelectorAll("[data-scan-item]").forEach((item) => {
    item.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      startScanHold(item, event);
    });

    item.addEventListener("click", () => {
      if (suppressScanClick) return;
      handleScanItemClick(item);
    });
  });

  app.querySelector(".scan-terminal[data-scan-complete]")?.addEventListener("click", () => {
    if (!isCurrentSearchComplete()) return;
    void onAdvance();
  });

  app.querySelectorAll("[data-action]").forEach((element) => {
    if (element.dataset.action === "advance") return;
    element.addEventListener("click", () => {
      playBgmSync(settings.music);
      playButtonClick(settings.sfx);
      handleAction(element.dataset.action);
    });
  });

  app.querySelectorAll("[data-flow-scene]").forEach((element) => {
    element.addEventListener("click", () => {
      playButtonClick(settings.sfx);
      jumpToDiscoveredScene(element.dataset.flowScene);
    });
  });

  app.querySelectorAll("[data-choice]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!novelState) return;
      playButtonClick(settings.sfx);
      const choiceId = btn.dataset.choice;
      const result = choose(novelState, choiceId);
      novelState = result.state;
      trackStoryProgress(novelState, result.events, choiceId);
      const pathNotice = result.events.find((event) => event.type === "path_notice")?.pathNotice ?? null;
      choicesVisible = false;
      saveProgress();
      render();
      showPathNotice(pathNotice);
    });
  });

  app.querySelectorAll("[data-setting]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.setting;
      if (!key) return;
      settings[key] = clampPercent(input.value, settings[key] ?? 0);
      const valueLabel = app.querySelector(`[data-setting-value="${key}"]`);
      if (valueLabel) valueLabel.textContent = `${settings[key]}%`;
      applyAudioSettings();
      if (key === "music") {
        playBgmSync(settings.music);
      }
      saveSettings();
    });
  });
}

function resetNovelBackgroundState() {
  currentBgUrl = null;
  currentBgKey = null;
  activeBgLayer = "a";
  previousCharacterLayers = [];
}

function normalizeCharacterLayers(layers) {
  return (layers ?? []).map((layer) => ({
    id: layer.id,
    slot: layer.slot ?? "left",
    dimmed: Boolean(layer.dimmed),
  }));
}

function characterLayersEqual(a, b) {
  if (a.length !== b.length) return false;

  return a.every(
    (layer, index) =>
      layer.id === b[index].id &&
      layer.slot === b[index].slot &&
      layer.dimmed === b[index].dimmed,
  );
}

function setupNovelCharacters(layers) {
  const normalized = normalizeCharacterLayers(layers);
  const stage = app.querySelector(".novel__stage");

  if (!stage) {
    previousCharacterLayers = normalized;
    return;
  }

  if (characterLayersEqual(normalized, previousCharacterLayers)) {
    return;
  }

  const prevIds = new Set(previousCharacterLayers.map((layer) => layer.id));
  let enterIndex = 0;

  stage.querySelectorAll(".character[data-character-id]").forEach((element) => {
    const id = element.dataset.characterId;
    if (!id || prevIds.has(id)) return;

    if (enterIndex > 0) {
      element.style.animationDelay = `${enterIndex * 0.08}s`;
    }

    void element.offsetWidth;
    element.classList.add("character--enter");
    element.addEventListener(
      "animationend",
      (event) => {
        if (event.target !== element) return;
        if (!String(event.animationName).startsWith("character-enter")) return;
        element.classList.remove("character--enter");
        element.style.animationDelay = "";
      },
      { once: true },
    );
    enterIndex += 1;
  });

  previousCharacterLayers = normalized;
}

function escapeCssUrl(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function applyNovelBgLayer(layer, url) {
  if (!layer || !url) return;
  layer.style.backgroundImage = `url('${escapeCssUrl(url)}')`;
}

function clearBgLayerState(layer) {
  if (!layer) return;
  layer.classList.remove("is-visible", "is-entering", "is-leaving");
}

function setupNovelBackground(nextUrl, backgroundKey, { animate = true } = {}) {
  const stack = app.querySelector(".novel__bg-stack");
  if (!stack || !nextUrl || !backgroundKey) return;

  const layerA = stack.querySelector(".novel__bg--a");
  const layerB = stack.querySelector(".novel__bg--b");
  if (!layerA || !layerB) return;

  const shouldAnimate = animate && currentBgKey && currentBgKey !== backgroundKey;

  if (!shouldAnimate) {
    const visible = activeBgLayer === "a" ? layerA : layerB;
    const hidden = activeBgLayer === "a" ? layerB : layerA;

    applyNovelBgLayer(visible, nextUrl);
    clearBgLayerState(hidden);
    hidden.style.backgroundImage = "";
    visible.classList.add("is-visible");
    currentBgKey = backgroundKey;
    currentBgUrl = nextUrl;
    return;
  }

  const outgoing = activeBgLayer === "a" ? layerA : layerB;
  const incoming = activeBgLayer === "a" ? layerB : layerA;

  applyNovelBgLayer(outgoing, currentBgUrl ?? nextUrl);
  applyNovelBgLayer(incoming, nextUrl);

  clearBgLayerState(outgoing);
  clearBgLayerState(incoming);
  outgoing.classList.add("is-visible");
  incoming.classList.remove("is-visible");

  void incoming.offsetWidth;

  outgoing.classList.add("is-leaving");
  incoming.classList.add("is-entering");

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    incoming.removeEventListener("animationend", onEnterEnd);
    clearBgLayerState(outgoing);
    outgoing.classList.remove("is-visible");
    incoming.classList.remove("is-entering");
    incoming.classList.add("is-visible");
  };

  const onEnterEnd = (event) => {
    if (event.target !== incoming) return;
    if (event.animationName !== "novel-bg-enter") return;
    finish();
  };

  incoming.addEventListener("animationend", onEnterEnd);
  window.setTimeout(finish, BG_CROSSFADE_MS + 80);

  activeBgLayer = activeBgLayer === "a" ? "b" : "a";
  currentBgKey = backgroundKey;
  currentBgUrl = nextUrl;
}

function canAnimateTextboxLeave() {
  return Boolean(app.querySelector(".textbox__body")) && novelState?.phase === "playing" && !gameOverlay;
}

async function animateTextboxLeave() {
  const body = app.querySelector(".textbox__body");
  if (!body) return;

  body.classList.add("textbox__body--leave");

  await new Promise((resolve) => {
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      body.removeEventListener("animationend", onEnd);
      resolve();
    };

    const onEnd = (event) => {
      if (event.target !== body) return;
      if (event.animationName !== "textbox-body-leave") return;
      finish();
    };

    body.addEventListener("animationend", onEnd);
    window.setTimeout(finish, TEXTBOX_ANIM_MS);
  });
}

function animateOverlayClose(overlay, onDone) {
  if (!overlay) {
    onDone();
    return;
  }

  overlayClosing = true;

  const panel = overlay.querySelector(".panel");
  const isDim = overlay.classList.contains("overlay--dim");
  const isLeft = overlay.classList.contains("overlay--left");
  const panelLeaveName = isDim
    ? "panel-leave-center"
    : isLeft
      ? "panel-leave-left"
      : "panel-leave-right";
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    panel?.removeEventListener("animationend", onPanelAnimEnd);
    overlayClosing = false;
    onDone();
  };

  const onPanelAnimEnd = (event) => {
    if (event.target !== panel) return;
    if (event.animationName !== panelLeaveName) return;
    finish();
  };

  panel?.addEventListener("animationend", onPanelAnimEnd);
  requestAnimationFrame(() => {
    overlay.classList.add("is-leaving");
  });
  window.setTimeout(finish, OVERLAY_LEAVE_MS);
}

function closeMenuOverlay(onClosed) {
  if (overlayClosing || !menuOverlay) return;

  const overlay = app.querySelector(".main-menu .overlay");
  animateOverlayClose(overlay, () => {
    menuOverlay = null;
    render();
    onClosed?.();
  });
}

function closeGameOverlay({ resumeGameplay = true, onClosed } = {}) {
  if (overlayClosing || !gameOverlay) return;

  const overlay = app.querySelector(".novel .overlay");
  animateOverlayClose(overlay, () => {
    gameOverlay = null;
    if (resumeGameplay && novelState?.phase === "playing") {
      sdk.gameplayStart();
    }
    render();
    onClosed?.();
  });
}

function closeScanHelpOverlay() {
  if (overlayClosing || !scanHelpOpen) return;

  const overlay = app.querySelector(".novel .overlay");
  animateOverlayClose(overlay, () => {
    scanHelpOpen = false;
    render();
  });
}

function getSearchKey(vm = novelState ? getViewModel(novelState) : null) {
  if (!vm || !isItemSearchLine(vm.line)) return null;
  return `${vm.sceneId}:${vm.lineIndex}`;
}

function getSearchFoundSet(key) {
  if (!searchFoundByKey.has(key)) {
    searchFoundByKey.set(key, new Set());
  }

  return searchFoundByKey.get(key);
}

function getSearchRevealedSet(key) {
  if (!searchRevealedByKey.has(key)) {
    searchRevealedByKey.set(key, new Set());
  }

  return searchRevealedByKey.get(key);
}

function getCurrentSearchState(vm = novelState ? getViewModel(novelState) : null) {
  const key = getSearchKey(vm);
  if (!key) return null;
  return {
    foundIds: Array.from(getSearchFoundSet(key)),
    revealedIds: Array.from(getSearchRevealedSet(key)),
  };
}

function isCurrentSearchComplete(vm = novelState ? getViewModel(novelState) : null) {
  const key = getSearchKey(vm);
  if (!key) return true;

  const items = getItemSearchItems(vm.line);
  const found = getSearchFoundSet(key);
  return items.length > 0 && items.every((item) => found.has(item.id));
}

const SEARCH_COMPLETE_ADVANCE_MS = 420;
const SCAN_HOLD_MS = 680;

/** @type {{ zoneEl: HTMLElement, pointerId: number, raf: number, onEnd: (event: PointerEvent) => void } | null} */
let scanHoldState = null;
let suppressScanClick = false;

function cancelScanHold() {
  if (!scanHoldState) return;

  window.removeEventListener("pointerup", scanHoldState.onEnd);
  window.removeEventListener("pointercancel", scanHoldState.onEnd);
  window.cancelAnimationFrame(scanHoldState.raf);

  scanHoldState.zoneEl.classList.remove("scan-zone--charging");
  scanHoldState.zoneEl.style.removeProperty("--scan-charge");
  scanHoldState = null;
}

function canStartScanHold(zoneEl) {
  const itemId = zoneEl?.dataset?.scanItem;
  if (!itemId || !novelState || gameOverlay || scanHelpOpen || textAnimating) return false;
  if (!zoneEl.classList.contains("scan-zone--revealed")) return false;
  if (zoneEl.classList.contains("scan-zone--locked")) return false;

  const vm = getViewModel(novelState);
  const key = getSearchKey(vm);
  if (!key) return false;

  const found = getSearchFoundSet(key);
  return !found.has(itemId);
}

function lockScanItem(zoneEl) {
  const itemId = zoneEl?.dataset?.scanItem;
  if (!itemId || !novelState) return;

  const vm = getViewModel(novelState);
  const key = getSearchKey(vm);
  if (!key) return;

  const items = getItemSearchItems(vm.line);
  if (!items.some((item) => item.id === itemId)) return;

  const found = getSearchFoundSet(key);
  if (found.has(itemId)) return;

  found.add(itemId);
  getSearchRevealedSet(key).add(itemId);
  render();

  if (isCurrentSearchComplete(vm)) {
    window.setTimeout(() => void onAdvance(), SEARCH_COMPLETE_ADVANCE_MS);
  }
}

/**
 * @param {HTMLElement} zoneEl
 * @param {PointerEvent} event
 */
function startScanHold(zoneEl, event) {
  if (!canStartScanHold(zoneEl)) return;

  cancelScanHold();
  event.preventDefault();

  const start = performance.now();
  zoneEl.classList.add("scan-zone--charging");
  zoneEl.style.setProperty("--scan-charge", "0");
  zoneEl.setPointerCapture?.(event.pointerId);

  const onEnd = (endEvent) => {
    if (!scanHoldState || endEvent.pointerId !== scanHoldState.pointerId) return;
    cancelScanHold();
  };

  const tick = (now) => {
    if (!scanHoldState || scanHoldState.zoneEl !== zoneEl) return;

    const progress = Math.min(1, (now - start) / SCAN_HOLD_MS);
    zoneEl.style.setProperty("--scan-charge", String(progress));

    if (progress >= 1) {
      cancelScanHold();
      suppressScanClick = true;
      zoneEl.classList.add("scan-zone--hit");
      window.setTimeout(() => zoneEl.classList.remove("scan-zone--hit"), 420);
      lockScanItem(zoneEl);
      window.setTimeout(() => {
        suppressScanClick = false;
      }, 0);
      return;
    }

    scanHoldState.raf = window.requestAnimationFrame(tick);
  };

  scanHoldState = {
    zoneEl,
    pointerId: event.pointerId,
    raf: window.requestAnimationFrame(tick),
    onEnd,
  };

  window.addEventListener("pointerup", onEnd);
  window.addEventListener("pointercancel", onEnd);
}

function handleScanItemClick(zoneEl) {
  const itemId = zoneEl?.dataset?.scanItem;
  if (!itemId || !novelState || gameOverlay || textAnimating) return;

  const vm = getViewModel(novelState);
  const key = getSearchKey(vm);
  if (!key) return;

  const found = getSearchFoundSet(key);
  const isLocked = zoneEl.classList.contains("scan-zone--locked");

  if (found.has(itemId) || isLocked) {
    if (isCurrentSearchComplete(vm)) {
      void onAdvance();
    }
  }
}

function jumpToDiscoveredScene(sceneId) {
  if (!novelState || !sceneId || !novelState.story.scenes[sceneId]) return;

  stopAnomalyScan();
  menuOverlay = null;
  gameOverlay = null;
  choicesVisible = false;

  const checkpoint = { sceneId, lineIndex: 0 };
  novelState = resumeStory(novelState, checkpoint);
  savedCheckpoint = checkpoint;
  recordDiscovery(storyDiscovery, sceneId, null);
  trackStoryProgress(novelState, [], null);
  sdk.gameplayStart();
  saveProgress();
  render();
}

function handleAction(action) {
  if (overlayClosing && action !== "exit") return;
  if (adManager.isBlocking()) return;

  switch (action) {
    case "new-game":
      stopAnomalyScan();
      menuOverlay = null;
      gameOverlay = null;
      choicesVisible = false;
      resetEndingBranch();
      storyDiscovery = normalizeDiscovery(null);
      novelState = startStory(novelState);
      trackStoryProgress(novelState, [], null);
      sdk.gameplayStart();
      saveProgress();
      render();
      break;
    case "continue":
      if (!savedCheckpoint || !novelState) return;
      stopAnomalyScan();
      menuOverlay = null;
      gameOverlay = null;
      choicesVisible = false;
      novelState = resumeStory(novelState, savedCheckpoint);
      trackStoryProgress(novelState, [], null);
      sdk.gameplayStart();
      render();
      break;
    case "story":
      menuOverlay = "story";
      render();
      void ensureStoryFlowchartLayout();
      break;
    case "settings":
    case "settings-quick":
      menuOverlay = "settings";
      render();
      break;
    case "game-menu":
      gameOverlay = "menu";
      sdk.gameplayStop();
      render();
      break;
    case "game-settings":
      gameOverlay = "settings";
      sdk.gameplayStop();
      render();
      break;
    case "close-overlay":
      closeMenuOverlay(() => adManager.onAction("close-overlay"));
      return;
    case "close-game-overlay":
      closeGameOverlay({
        resumeGameplay: true,
        onClosed: () => adManager.onAction("close-game-overlay"),
      });
      return;
    case "open-scan-help":
      scanHelpOpen = true;
      render();
      break;
    case "close-scan-help":
      closeScanHelpOverlay();
      break;
    case "exit":
      sdk.gameplayStop();
      menuOverlay = null;
      gameOverlay = null;
      choicesVisible = false;
      resetEndingBranch();
      if (novelState) novelState = returnToMenu(novelState);
      render();
      break;
    default:
      break;
  }

  adManager.onAction(action);
}

async function onAdvance() {
  if (!novelState || gameOverlay || textAnimating || adManager.isBlocking()) return;
  if (!isCurrentSearchComplete()) return;

  playBgmSync(settings.music);
  playSceneNext(settings.sfx);
  textAnimating = true;

  try {
    if (
      novelState.phase === "playing" &&
      !getViewModel(novelState).line &&
      getCurrentSceneSafe()?.actBreak?.enabled &&
      !getCurrentSceneSafe()?.lines?.length
    ) {
      if (canAnimateTextboxLeave()) {
        await animateTextboxLeave();
      }

      novelState = { ...novelState, phase: "act_break" };
      choicesVisible = false;
      render();
      return;
    }

    const finishingEpilogue =
      novelState.phase === "playing" &&
      novelState.sceneId === "scene_epilogue" &&
      (() => {
        const scene = getCurrentSceneSafe();
        return Boolean(scene?.lines?.length && novelState.lineIndex >= scene.lines.length - 1);
      })();

    const prevSceneId = novelState.sceneId;
    const result = advance(novelState);
    captureEndingBranchFromAdvance(prevSceneId, result.events);
    const hasChoices = result.events.some((event) => event.type === "choices");
    const shouldPlayEndCinematic = finishingEpilogue && result.state.phase === "ended";

    if (canAnimateTextboxLeave() && !hasChoices) {
      await animateTextboxLeave();
    }

    if (hasChoices) {
      choicesVisible = true;
      render();
      return;
    }

    if (shouldPlayEndCinematic) {
      novelState = { ...result.state, phase: "end_cinematic" };
      choicesVisible = false;
      trackStoryProgress(novelState, result.events, null);
      await runEndCinematic();
      return;
    }

    novelState = result.state;
    choicesVisible = false;
    trackStoryProgress(novelState, result.events, null);

    const nextLine = getCurrentLine(novelState);
    if (nextLine?.effect === "white_flash") {
      const novelEl = app.querySelector(".novel");
      if (novelEl) {
        await playSoftWhiteFlash(novelEl);
      }
    }

    if (novelState.phase === "playing") {
      sdk.gameplayStart();
    } else if (novelState.phase === "ended") {
      sdk.gameplayStop();
    }

    saveProgress();
    render();
  } finally {
    textAnimating = false;
  }
}

async function saveProgress() {
  if (!novelState) return;
  const checkpoint = getCheckpoint(novelState);
  const payload = { [DISCOVERY_KEY]: serializeDiscovery(storyDiscovery) };

  if (checkpoint) {
    savedCheckpoint = checkpoint;
    payload[SAVE_KEY] = checkpoint;
  }

  await sdk.saveData(payload);
}

/**
 * @param {import("./novel-engine.js").NovelState} state
 * @param {Array<{ type: string, sceneId?: string }>} events
 * @param {string|null|undefined} choiceId
 */
function trackStoryProgress(state, events, choiceId) {
  if (state.phase === "playing" || state.phase === "act_break") {
    recordDiscovery(storyDiscovery, state.sceneId, choiceId ?? null);
  }

  for (const event of events) {
    if (event.type === "scene_change" && event.sceneId) {
      recordDiscovery(storyDiscovery, event.sceneId, null);
    }
  }
}

async function saveSettings() {
  await sdk.saveData({ [SETTINGS_KEY]: settings });
}

function getCurrentSceneSafe() {
  return novelState ? getCurrentScene(novelState) : null;
}

function getCurrentStoryTitle() {
  if (!novelState) return t("progress.menu");

  if (novelState.phase === "playing" || novelState.phase === "act_break") {
    const scene = getCurrentScene(novelState);
    const title = scene?.title?.trim() || scene?.actBreak?.title?.trim();
    if (title) return formatStoryTitle(title);
  }

  if (savedCheckpoint) {
    const scene = novelState.story.scenes[savedCheckpoint.sceneId];
    const title = scene?.title?.trim();
    if (title) return formatStoryTitle(title);
  }

  return t("progress.prologue");
}

function formatStoryTitle(title) {
  const cleaned = title.replace(/^(?:Ветка [A-Z]\d?|Скрытая S\d|S\d)\s*[—–-]\s*/iu, "").trim();
  if (!cleaned) return title;
  const lower = cleaned.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function getGameProgress() {
  const flow = getGlobalFlowchartProgress(storyDiscovery);

  return {
    total: flow.total,
    discovered: flow.discovered,
    percent: flow.percent,
    currentTitle: getCurrentStoryTitle(),
  };
}

function render() {
  cancelScanHold();
  if (!novelState) return;

  const vm = getViewModel(novelState);
  const showActBreak =
    vm.phase === "act_break" ||
    (vm.phase === "playing" && !vm.line && vm.scene?.actBreak?.enabled && !vm.scene?.lines?.length);

  if (vm.phase === "menu") {
    stopSyncVoice();
    resetNotificationSound();
    resetRingtoneSound();
    resetStoryCitySound();
    stopAnomalyScan();
    stopSyncSilhouettes();
    stopMenuBgCycle();
    resetNovelBackgroundState();
    app.innerHTML = renderMainMenu({
      hasSave: Boolean(savedCheckpoint),
      menuOverlay,
      discovery: storyDiscovery,
      storyFlowchartLayout,
      settings,
    });
    bindUiEvents();
    if (menuOverlay === "story" && storyFlowchartLayout) {
      requestAnimationFrame(() => {
        fitStoryFlowchartViewport();
        bindStoryFlowchartPan();
      });
    }
    startMenuBgCycle(app.querySelector(".main-menu"));
    return;
  }

  stopMenuBgCycle();

  if (vm.phase === "end_cinematic") {
    return;
  }

  if (vm.phase === "ended") {
    stopSyncVoice();
    resetNotificationSound();
    resetRingtoneSound();
    resetStoryCitySound();
    stopAnomalyScan();
    stopSyncSilhouettes();
    resetNovelBackgroundState();
    app.innerHTML = renderEndScreen({
      title: getEndScreenTitle(storyDiscovery, novelState?.story),
    });
    bindUiEvents();
    return;
  }

  const bgUrl = resolveBackground(novelState.story, vm.backgroundKey);
  const novelOptions = {
    story: novelState.story,
    vm,
    showActBreak,
    showChoices: choicesVisible && vm.choices.length > 0,
    gameOverlay,
    settings,
    progress: getGameProgress(),
    searchState: getCurrentSearchState(vm),
    scanHelpOpen: isItemSearchLine(vm.line) && scanHelpOpen,
  };

  const existingNovel = app.querySelector(".novel");
  if (existingNovel && (vm.phase === "playing" || vm.phase === "act_break")) {
    patchNovelScreen(existingNovel, novelOptions);
  } else {
    app.innerHTML = renderNovelScreen(novelOptions);
  }

  bindUiEvents();
  setupNovelBackground(bgUrl, vm.backgroundKey);
  const showChoices = choicesVisible && vm.choices.length > 0;
  setupNovelCharacters(showChoices ? getChoicePresenterLayers() : vm.characterLayers);
  refreshSyncSilhouettes(app);

  const novelEl = app.querySelector(".novel");
  const scanSceneKey = getSearchKey(vm);
  if (!isItemSearchLine(vm.line)) {
    scanHelpOpen = false;
  }
  if (isItemSearchLine(vm.line)) {
    startAnomalyScan(
      novelEl,
      scanSceneKey,
      (itemId) => {
        const revealKey = getSearchKey(vm);
        if (revealKey) getSearchRevealedSet(revealKey).add(itemId);
      },
      settings.scanner,
    );
  } else {
    stopAnomalyScan();
  }

  if (vm.phase === "playing" && !gameOverlay) {
    playSyncVoiceForLine(vm.line, settings.sync);
    playNotificationForLine(vm.line, settings.sfx);
    playRingtoneForLine(vm.line, settings.sfx);
    playStoryCityForLine(vm.line, settings.sfx, vm.backgroundKey);
  } else {
    stopSyncVoice();
    resetNotificationSound();
    resetRingtoneSound();
    resetStoryCitySound();
  }
}

