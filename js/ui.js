import { renderIcon } from "./icons.js";
import { PROTAGONIST_ID, SYNC_CHARACTER_ID, getChoicePresenterLayers } from "./novel-engine.js";
import { getMergedViewModel } from "./story-flowchart.js";

export const GAME_TITLE = "Последний День Курьера";
export const GAME_TITLE_LINES = ["ПОСЛЕДНИЙ ДЕНЬ", "КУРЬЕРА"];

const MENU_CAST = [];
const ITEM_SEARCH_RE = /^Поиск предметов/i;
const ITEM_LINE_RE = /^\s*(\d+)\.\s+(.+?)\.?\s*$/;
const DEFAULT_SEARCH_ITEM_COUNT = 8;
// Координаты под BG_01 — квартира Артёма (стол, журнальный столик, полка, куртка на стуле).
const SEARCH_ITEM_POSITIONS = [
  { x: 33, y: 66, size: 4.0, rotate: 10 }, // 1 — коробка на журнальном столике
  { x: 20, y: 62, size: 3.6, rotate: -14 }, // 2 — фото на куртке
  { x: 57, y: 55, size: 2.3, rotate: 74 }, // 3 — ключ на связке ключей на столе
  { x: 82, y: 72, size: 4.4, rotate: -55 }, // 4 — квитанция на столе у кружки
  { x: 15, y: 74, size: 5.0, rotate: 10 }, // 5 — бейдж на куртке
  { x: 90, y: 56, size: 3.2, rotate: 44 }, // 6 — флешка у окна
  { x: 25, y: 40, size: 4.0, rotate: 0 }, // 7 — часы на книжной полке
  { x: 74, y: 58, size: 4.8, rotate: -11 }, // 8 — записка на посылке
];

/** @param {object|null|undefined} line */
export function isItemSearchLine(line) {
  return line?.kind === "narration" && ITEM_SEARCH_RE.test(String(line.text ?? ""));
}

/** @param {object|null|undefined} line */
export function getItemSearchItems(line) {
  if (!isItemSearchLine(line)) return [];

  const labels = String(line.text ?? "")
    .split("\n")
    .map((row) => row.match(ITEM_LINE_RE)?.[2]?.trim())
    .filter(Boolean);
  const count = labels.length || DEFAULT_SEARCH_ITEM_COUNT;

  return Array.from({ length: count }, (_, index) => {
    const position = SEARCH_ITEM_POSITIONS[index % SEARCH_ITEM_POSITIONS.length];
    return {
      id: `item-${index + 1}`,
      label: labels[index] ?? `Предмет ${index + 1}`,
      x: position.x,
      y: position.y,
      size: position.size,
      rotate: position.rotate ?? 0,
    };
  });
}

/**
 * @param {object} options
 * @param {boolean} options.hasSave
 * @param {"settings"|"story"|null} options.menuOverlay
 * @param {{ visitedScenes: Set<string>, visitedChoices: Set<string> }} options.discovery
 * @param {import("./story-flowchart-layout.js").StoryFlowchartLayout|null} options.storyFlowchartLayout
 * @param {{ music: number, sfx: number }} options.settings
 */
export function renderMainMenu({ hasSave, menuOverlay, discovery, storyFlowchartLayout, settings }) {
  const castHtml = MENU_CAST.map(
    (item) => `<img class="main-menu__cast-item" src="${item.src}" alt="${item.alt}" />`,
  ).join("");

  return `
    <div class="screen screen--menu main-menu">
      <div class="main-menu__bg-stack" aria-hidden="true">
        <div class="main-menu__bg main-menu__bg--a is-visible"></div>
        <div class="main-menu__bg main-menu__bg--b"></div>
        <div class="main-menu__glitch-scanlines"></div>
        <canvas class="main-menu__noise-canvas"></canvas>
        <canvas class="main-menu__glitch-canvas"></canvas>
      </div>
      <div class="main-menu__vignette" aria-hidden="true"></div>

      <h1 class="main-menu__title">
        <span class="main-menu__title-line" data-text="${GAME_TITLE_LINES[0]}">${GAME_TITLE_LINES[0]}</span>
        <span class="main-menu__title-line" data-text="${GAME_TITLE_LINES[1]}">${GAME_TITLE_LINES[1]}</span>
      </h1>

      <div class="main-menu__nav-wrap">
        <nav class="main-menu__nav" aria-label="Главное меню">
          ${menuButton("new-game", "Новая игра", { active: true })}
          ${menuButton("continue", "Продолжить", { disabled: !hasSave })}
          ${menuButton("story", "Сюжет")}
        </nav>
      </div>

      <div class="main-menu__cast">${castHtml}</div>

      <button type="button" class="main-menu__settings" data-action="settings-quick" aria-label="Настройки">
        ${renderIcon("settings", "icon main-menu__settings-icon")}
      </button>

      ${menuOverlay === "settings" ? renderSettingsModal(settings) : ""}
      ${menuOverlay === "story" ? renderStoryFlowchartScreen(discovery, storyFlowchartLayout) : ""}
    </div>
  `;
}

function buildNovelMainHtml(story, vm, showActBreak, showChoices, searchState) {
  const line = vm.line;
  const isChoiceScreen = showChoices && vm.choices?.length > 0;
  const speaker = isChoiceScreen
    ? resolveSpeakerInline(story, PROTAGONIST_ID)
    : resolveSpeakerInline(story, line?.speaker);
  const isNarration = isChoiceScreen ? false : line?.kind === "narration" || !line?.speaker;
  const isThought = isChoiceScreen ? false : Boolean(line?.thought);

  if (showActBreak) {
    return renderActBreak(vm.actBreak ?? vm.scene?.actBreak);
  }

  if (showChoices) {
    return renderTextbox({ speaker, isNarration, isThought, choices: vm.choices });
  }

  if (isItemSearchLine(line)) {
    return renderScanTerminalPanel(line, searchState);
  }

  return renderTextbox({ line, speaker, isNarration, isThought });
}

function buildNovelOverlayHtml(gameOverlay, settings, progress, scanHelpOpen = false) {
  if (gameOverlay === "menu") return renderGameMenuModal(progress);
  if (gameOverlay === "settings") return renderSettingsModal(settings, { inGame: true });
  if (scanHelpOpen) return renderScanHelpModal();
  return "";
}

function renderScanHelpModal() {
  return `
    <div class="overlay overlay--dim" data-stop-advance="true">
      <div class="panel panel--scan-help">
        <div class="panel__head">
          <h2 class="panel__title">Как искать и сканировать</h2>
          <button type="button" class="panel__close" data-action="close-scan-help" aria-label="Закрыть">
            ${renderIcon("close", "icon panel__close-icon")}
          </button>
        </div>

        <div class="panel__body">
          <ol class="scan-help__steps">
            <li>Луч автоматически проходит сцену сверху вниз.</li>
            <li>Улики видны на сцене и перечислены в окне «Синхрон · Скан».</li>
            <li>Когда луч находит улику, её маркер загорается — зажмите его, чтобы зафиксировать.</li>
            <li>Зафиксированные улики подсвечиваются зелёным в списке.</li>
            <li>Найдите все улики, чтобы продолжить сюжет.</li>
          </ol>
        </div>

        <div class="panel__foot">
          ${menuButton("close-scan-help", "Понятно", { active: true, block: true })}
        </div>
      </div>
    </div>
  `;
}

function getNovelClassName(showActBreak, showChoices, line) {
  const isScan = isItemSearchLine(line);
  return `screen screen--novel novel ${showActBreak ? "novel--act-break" : ""} ${showChoices ? "novel--choices" : ""} ${isScan ? "novel--scan" : ""}`;
}

/**
 * @param {HTMLElement} novel
 * @param {object} options
 */
export function patchNovelScreen(novel, options) {
  const { story, vm, showActBreak, showChoices, gameOverlay, settings, progress, searchState, scanHelpOpen } =
    options;

  novel.className = getNovelClassName(showActBreak, showChoices, vm.line);

  const stage = novel.querySelector(".novel__stage");
  if (stage) {
    stage.innerHTML = renderStageLayers(story, vm, searchState, showChoices);
  }

  syncNovelScanLayer(novel, vm.line);

  let content = novel.querySelector(".novel__content");
  if (!content) {
    content = document.createElement("div");
    content.className = "novel__content";
    stage?.insertAdjacentElement("afterend", content);
  }

  content.innerHTML = buildNovelMainHtml(story, vm, showActBreak, showChoices, searchState);

  novel.querySelectorAll(".overlay").forEach((overlay) => overlay.remove());
  const overlayHtml = buildNovelOverlayHtml(gameOverlay, settings, progress, scanHelpOpen);
  if (overlayHtml) {
    novel.insertAdjacentHTML("beforeend", overlayHtml);
  }
}

/**
 * @param {object} options
 * @param {import("./novel-engine.js").NovelState["story"]} options.story
 * @param {ReturnType<import("./novel-engine.js").getViewModel>} options.vm
 * @param {boolean} options.showActBreak
 * @param {boolean} options.showChoices
 * @param {"menu"|"settings"|null} options.gameOverlay
 * @param {{ unlocked: number, total: number, percent: number, currentTitle: string }} [options.progress]
 * @param {{ foundIds: string[] }} [options.searchState]
 * @param {{ music: number, sfx: number }} options.settings
 */
export function renderNovelScreen({
  story,
  vm,
  showActBreak,
  showChoices,
  gameOverlay,
  settings,
  progress,
  searchState,
  scanHelpOpen,
}) {
  return `
    <div class="${getNovelClassName(showActBreak, showChoices, vm.line)}" data-action="advance">
      <div class="novel__bg-stack" aria-hidden="true">
        <div class="novel__bg novel__bg--a"></div>
        <div class="novel__bg novel__bg--b"></div>
      </div>
      <div class="novel__vignette" aria-hidden="true"></div>

      <header class="novel-hud">
        <div class="novel-hud__actions">
          <button type="button" class="hud-btn hud-btn--menu" data-action="game-menu" aria-label="Меню">
            ${renderIcon("chevronRight", "icon hud-btn__icon")}
          </button>
        </div>
      </header>

      <div class="novel__stage">
        ${renderStageLayers(story, vm, searchState, showChoices)}
      </div>

      ${isItemSearchLine(vm.line) ? `<div class="novel__scan">${renderAnomalyScanOverlay()}</div>` : ""}

      <div class="novel__content">
        ${buildNovelMainHtml(story, vm, showActBreak, showChoices, searchState)}
      </div>

      ${buildNovelOverlayHtml(gameOverlay, settings, progress, scanHelpOpen)}
    </div>
  `;
}

export function renderEndScreen() {
  return `
    <div class="screen screen--end end-screen">
      <div class="end-screen__bg" aria-hidden="true"></div>

      <div class="end-screen__content">
        <p class="end-screen__kicker">${GAME_TITLE}</p>
        <h1 class="end-screen__title">Конец пролога</h1>
        <p class="end-screen__note">Продолжение следует…</p>

        <div class="end-screen__actions">
          ${menuButton("exit", "В главное меню", { active: true, block: true })}
        </div>
      </div>
    </div>
  `;
}

/** @param {{ music: number, sfx: number }} settings @param {{ inGame?: boolean }} [options] */
export function renderSettingsModal(settings, options = {}) {
  const closeAction = options.inGame ? "close-game-overlay" : "close-overlay";

  return `
    <div class="overlay" data-stop-advance="true">
      <div class="panel panel--settings">
        <div class="panel__head">
          <h2 class="panel__title">${renderIcon("settings", "icon panel__title-icon")} Настройки</h2>
          <button type="button" class="panel__close" data-action="${closeAction}" aria-label="Закрыть">
            ${renderIcon("close", "icon panel__close-icon")}
          </button>
        </div>

        <div class="panel__body">
          ${settingsRow("music", "Музыка", settings.music, "volumeHigh")}
          ${settingsRow("sfx", "Звуковые эффекты", settings.sfx, "volumeHigh")}
          <p class="panel__note">Язык интерфейса — русский</p>
        </div>

        <div class="panel__foot">
          ${menuButton(closeAction, "Закрыть", { active: true, block: true })}
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {{ visitedScenes: Set<string>, visitedChoices: Set<string> }} discovery
 * @param {import("./story-flowchart-layout.js").StoryFlowchartLayout|null} layout
 */
export function renderStoryFlowchartScreen(discovery, layout) {
  if (!layout) {
    return `
      <div class="story-flowchart" data-stop-advance="true">
        <div class="story-flowchart__bg" aria-hidden="true"></div>
        <div class="story-flowchart__vignette" aria-hidden="true"></div>

        <header class="story-flowchart__head">
          <button type="button" class="hud-btn story-flowchart__close" data-action="close-overlay" aria-label="Закрыть">
            ${renderIcon("close", "icon hud-btn__icon")}
          </button>
          <div class="story-flowchart__intro">
            <h2 class="story-flowchart__title">${escapeHtml(GAME_TITLE)}</h2>
          </div>
        </header>

        <div class="story-flowchart__viewport" data-flowchart-viewport>
          <p class="story-flowchart__loading">Построение карты…</p>
        </div>
      </div>
    `;
  }

  const vm = getMergedViewModel(discovery, layout.nodes, layout.edges, {
    width: layout.width,
    height: layout.height,
  });
  const nodeById = new Map(vm.states.map(({ node }) => [node.id, node]));

  const vertical = layout.direction === "DOWN";

  const edgesSvg = vm.edges
    .map((edge) => {
      const from = nodeById.get(edge.from);
      const to = nodeById.get(edge.to);
      if (!from || !to) return "";
      const path = buildFlowEdgePath(from, to, { vertical });
      return `<path class="story-flowchart__edge" d="${path}" />`;
    })
    .join("");

  const nodesHtml = vm.states
    .filter(({ node }) => node.type !== "choice")
    .map(({ node, state }) => renderFlowchartNode(node, state))
    .join("");

  return `
    <div class="story-flowchart" data-stop-advance="true">
      <div class="story-flowchart__bg" aria-hidden="true"></div>
      <div class="story-flowchart__vignette" aria-hidden="true"></div>

      <header class="story-flowchart__head">
        <button type="button" class="hud-btn story-flowchart__close" data-action="close-overlay" aria-label="Закрыть">
          ${renderIcon("close", "icon hud-btn__icon")}
        </button>
        <div class="story-flowchart__intro">
          <h2 class="story-flowchart__title">${escapeHtml(GAME_TITLE)}</h2>
        </div>
      </header>

      <div class="story-flowchart__viewport${vertical ? " story-flowchart__viewport--vertical" : ""}" data-flowchart-viewport>
        <div class="story-flowchart__fit">
          <div
            class="story-flowchart__canvas"
            data-flowchart-canvas
            style="width:${vm.width}px;height:${vm.height}px;"
          >
            <svg class="story-flowchart__svg" viewBox="0 0 ${vm.width} ${vm.height}" aria-hidden="true">
              ${edgesSvg}
            </svg>
            <div class="story-flowchart__nodes">${nodesHtml}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {import("./story-flowchart.js").FlowNode} node
 * @param {{ discovered: boolean, taken: boolean, locked: boolean }} state
 */
function renderFlowchartNode(node, state) {
  const lockedClass = state.locked ? "story-flowchart__node--locked" : "story-flowchart__node--discovered";
  const takenClass = state.taken ? "story-flowchart__node--taken" : "";

  const typeClass =
    node.type === "start"
      ? "story-flowchart__node--start"
      : node.type === "outcome"
        ? "story-flowchart__node--outcome"
        : "story-flowchart__node--milestone";
  const lockOverlay = state.locked
    ? `<span class="story-flowchart__lock" aria-hidden="true">${renderIcon("lock", "icon story-flowchart__lock-icon")}</span>`
    : "";
  const image = node.bg
    ? `<span class="story-flowchart__card"><span class="story-flowchart__thumb" style="background-image:url('${escapeAttr(node.bg)}')"></span>${lockOverlay}</span>`
    : `<span class="story-flowchart__card story-flowchart__card--empty">${lockOverlay}</span>`;

  const canJump = !state.locked && Boolean(node.sceneId);
  const tag = canJump ? "button" : "div";
  const interactiveAttrs = canJump
    ? ` type="button" data-flow-scene="${escapeAttr(node.sceneId)}" aria-label="${escapeAttr(node.label)}"`
    : "";

  return `
    <${tag}
      class="story-flowchart__node ${typeClass} ${lockedClass} ${takenClass}"
      style="left:${node.x}px;top:${node.y}px;"
      ${interactiveAttrs}
    >
      ${image}
      <span class="story-flowchart__node-label">${escapeHtml(node.label)}</span>
    </${tag}>
  `;
}

const FLOW_NODE_METRICS = {
  cardWidth: 132,
  cardHeight: 60,
  choiceMinWidth: 132,
  choiceHeight: 28,
  labelGap: 6,
  labelHeight: 16,
  startTagHeight: 0,
  branchBusOffset: 18,
  mergeBusOffset: 24,
};

/** Подгоняет карту: десктоп — по высоте и горизонтальный скролл, мобильный — по ширине и вертикальный скролл. */
export function fitStoryFlowchartViewport() {
  const viewport = document.querySelector(".story-flowchart__viewport");
  const fit = document.querySelector(".story-flowchart__fit");
  const canvas = document.querySelector("[data-flowchart-canvas]");
  if (!viewport || !fit || !canvas) return;

  const naturalWidth = Number.parseFloat(canvas.style.width) || canvas.offsetWidth;
  const naturalHeight = Number.parseFloat(canvas.style.height) || canvas.offsetHeight;
  if (!naturalWidth || !naturalHeight) return;

  const vertical = viewport.classList.contains("story-flowchart__viewport--vertical");

  canvas.style.transform = "";
  canvas.style.transformOrigin = "";
  fit.style.width = "";
  fit.style.height = "";
  fit.style.margin = "";
  fit.style.overflow = "";

  if (vertical) {
    const padX = 8;
    const availableWidth = Math.max(0, viewport.clientWidth - padX * 2);
    const scale = Math.min(1, availableWidth / naturalWidth);
    const scaledWidth = Math.ceil(naturalWidth * scale);
    const scaledHeight = Math.ceil(naturalHeight * scale);

    let minX = naturalWidth;
    let maxX = 0;
    canvas.querySelectorAll(".story-flowchart__node").forEach((node) => {
      minX = Math.min(minX, node.offsetLeft);
      maxX = Math.max(maxX, node.offsetLeft + node.offsetWidth);
    });

    const contentCenter = maxX > minX ? (minX + maxX) / 2 : naturalWidth / 2;
    const translateX = scaledWidth / 2 - contentCenter * scale;

    fit.style.width = `${scaledWidth}px`;
    fit.style.height = `${scaledHeight}px`;
    fit.style.margin = "0 auto";
    fit.style.overflow = "hidden";

    canvas.style.transformOrigin = "top left";
    canvas.style.transform = `translateX(${Math.round(translateX * 10) / 10}px) scale(${scale})`;
    return;
  }

  const scale = Math.min(1, viewport.clientHeight / naturalHeight);

  canvas.style.transform = `scale(${scale})`;
  canvas.style.transformOrigin = "top left";
  fit.style.width = `${Math.ceil(naturalWidth * scale)}px`;
  fit.style.height = `${Math.ceil(naturalHeight * scale)}px`;
}

/** @type {{ viewport: HTMLElement, pointerId: number, startX: number, startY: number, startScroll: number, vertical: boolean } | null} */
let storyFlowchartPanSession = null;

/** @type {WeakMap<HTMLElement, { target: number, current: number, raf: number }>} */
const storyFlowchartWheelState = new WeakMap();

/** Drag-to-pan и плавная прокрутка колёсиком по карте сюжета. */
export function bindStoryFlowchartPan() {
  const viewport = document.querySelector("[data-flowchart-viewport]");
  if (!viewport) return;

  viewport.addEventListener("pointerdown", onStoryFlowchartPointerDown);
  viewport.addEventListener("wheel", onStoryFlowchartWheel, { passive: false });
}

/** @param {HTMLElement} viewport @param {number} value @param {"x"|"y"} axis */
function clampStoryFlowchartScroll(viewport, value, axis = "x") {
  const max =
    axis === "y"
      ? Math.max(0, viewport.scrollHeight - viewport.clientHeight)
      : Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  return Math.min(max, Math.max(0, value));
}

/** @param {PointerEvent} event */
function onStoryFlowchartPointerDown(event) {
  if (event.button !== 0) return;
  if (event.target.closest("[data-flow-scene]")) return;

  const viewport = event.currentTarget;
  if (!(viewport instanceof HTMLElement)) return;

  const vertical = viewport.classList.contains("story-flowchart__viewport--vertical");

  storyFlowchartPanSession = {
    viewport,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startScroll: vertical ? viewport.scrollTop : viewport.scrollLeft,
    vertical,
  };

  viewport.setPointerCapture(event.pointerId);
  viewport.classList.add("is-panning");
  viewport.addEventListener("pointermove", onStoryFlowchartPointerMove);
  viewport.addEventListener("pointerup", onStoryFlowchartPointerUp);
  viewport.addEventListener("pointercancel", onStoryFlowchartPointerUp);
}

/** @param {PointerEvent} event */
function onStoryFlowchartPointerMove(event) {
  const session = storyFlowchartPanSession;
  if (!session || event.pointerId !== session.pointerId) return;

  if (session.vertical) {
    const deltaY = event.clientY - session.startY;
    session.viewport.scrollTop = clampStoryFlowchartScroll(session.viewport, session.startScroll - deltaY, "y");
    return;
  }

  const deltaX = event.clientX - session.startX;
  session.viewport.scrollLeft = clampStoryFlowchartScroll(session.viewport, session.startScroll - deltaX, "x");
}

/** @param {PointerEvent} event */
function onStoryFlowchartPointerUp(event) {
  const session = storyFlowchartPanSession;
  if (!session || event.pointerId !== session.pointerId) return;

  session.viewport.releasePointerCapture(event.pointerId);
  session.viewport.classList.remove("is-panning");
  session.viewport.removeEventListener("pointermove", onStoryFlowchartPointerMove);
  session.viewport.removeEventListener("pointerup", onStoryFlowchartPointerUp);
  session.viewport.removeEventListener("pointercancel", onStoryFlowchartPointerUp);
  storyFlowchartPanSession = null;
}

/** @param {HTMLElement} viewport */
function smoothStoryFlowchartScrollBy(viewport, delta, axis = "x") {
  let state = storyFlowchartWheelState.get(viewport);
  const initial = axis === "y" ? viewport.scrollTop : viewport.scrollLeft;

  if (!state || state.axis !== axis) {
    state = { target: initial, current: initial, raf: 0, axis };
    storyFlowchartWheelState.set(viewport, state);
  }

  state.target = clampStoryFlowchartScroll(viewport, state.target + delta, axis);

  if (state.raf) return;

  const tick = () => {
    const diff = state.target - state.current;
    if (Math.abs(diff) < 0.5) {
      state.current = state.target;
      if (axis === "y") viewport.scrollTop = state.current;
      else viewport.scrollLeft = state.current;
      state.raf = 0;
      return;
    }

    state.current += diff * 0.24;
    if (axis === "y") viewport.scrollTop = state.current;
    else viewport.scrollLeft = state.current;
    state.raf = requestAnimationFrame(tick);
  };

  state.raf = requestAnimationFrame(tick);
}

/** @param {WheelEvent} event */
function onStoryFlowchartWheel(event) {
  const viewport = event.currentTarget;
  if (!(viewport instanceof HTMLElement)) return;

  const vertical = viewport.classList.contains("story-flowchart__viewport--vertical");
  const delta = vertical
    ? event.deltaY
    : Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;
  if (!delta) return;

  event.preventDefault();
  smoothStoryFlowchartScrollBy(viewport, delta, vertical ? "y" : "x");
}

/** @param {import("./story-flowchart.js").FlowNode} node */
function getFlowNodeBounds(node) {
  const { cardWidth, cardHeight, choiceMinWidth, choiceHeight, labelGap, labelHeight, startTagHeight } =
    FLOW_NODE_METRICS;

  if (node.type === "choice") {
    const width = Math.max(choiceMinWidth, Math.ceil(node.label.length * 6.5) + 44);
    return { x: node.x, y: node.y, width, height: choiceHeight, cardHeight: choiceHeight, isChoice: true };
  }

  const tag = node.type === "start" ? startTagHeight : 0;
  return {
    x: node.x,
    y: node.y,
    width: cardWidth,
    height: cardHeight + labelGap + labelHeight + tag,
    cardHeight,
    isChoice: false,
  };
}

/** @param {import("./story-flowchart.js").FlowNode} node */
function getFlowNodeCenterY(node) {
  const bounds = getFlowNodeBounds(node);
  return bounds.y + bounds.cardHeight / 2;
}

/** @param {import("./story-flowchart.js").FlowNode} node */
function getFlowNodeCenterX(node) {
  const bounds = getFlowNodeBounds(node);
  return bounds.x + bounds.width / 2;
}

/**
 * @param {import("./story-flowchart.js").FlowNode} from
 * @param {import("./story-flowchart.js").FlowNode} to
 * @param {{ vertical?: boolean }} [options]
 */
function buildFlowEdgePath(from, to, options = {}) {
  return options.vertical ? buildFlowEdgePathVertical(from, to) : buildFlowEdgePathHorizontal(from, to);
}

/**
 * @param {import("./story-flowchart.js").FlowNode} from
 * @param {import("./story-flowchart.js").FlowNode} to
 */
function buildFlowEdgePathHorizontal(from, to) {
  const fromBounds = getFlowNodeBounds(from);
  const toBounds = getFlowNodeBounds(to);
  const fromCenterY = getFlowNodeCenterY(from);
  const toCenterY = getFlowNodeCenterY(to);
  const fromRight = fromBounds.x + fromBounds.width;
  const fromLeft = fromBounds.x;
  const toLeft = toBounds.x;
  const toRight = toBounds.x + toBounds.width;
  const { mergeBusOffset } = FLOW_NODE_METRICS;
  const deltaY = toCenterY - fromCenterY;

  if (toLeft >= fromRight - 2) {
    const start = [fromRight, fromCenterY];
    const end = [toLeft, toCenterY];
    if (Math.abs(deltaY) < 2) return flowPathFromPoints([start, end]);

    const midX = Math.round((fromRight + toLeft) / 2);
    return flowPathFromPoints([start, [midX, fromCenterY], [midX, toCenterY], end]);
  }

  const busX = Math.min(fromLeft, toLeft) - mergeBusOffset;
  return flowPathFromPoints([
    [fromLeft, fromCenterY],
    [busX, fromCenterY],
    [busX, toCenterY],
    [toRight, toCenterY],
  ]);
}

/**
 * @param {import("./story-flowchart.js").FlowNode} from
 * @param {import("./story-flowchart.js").FlowNode} to
 */
function buildFlowEdgePathVertical(from, to) {
  const fromBounds = getFlowNodeBounds(from);
  const toBounds = getFlowNodeBounds(to);
  const fromCenterX = getFlowNodeCenterX(from);
  const toCenterX = getFlowNodeCenterX(to);
  const fromBottom = fromBounds.y + fromBounds.height;
  const fromTop = fromBounds.y;
  const toTop = toBounds.y;
  const toBottom = toBounds.y + toBounds.height;
  const { mergeBusOffset } = FLOW_NODE_METRICS;
  const deltaX = toCenterX - fromCenterX;

  if (toTop >= fromBottom - 2) {
    const start = [fromCenterX, fromBottom];
    const end = [toCenterX, toTop];
    if (Math.abs(deltaX) < 2) return flowPathFromPoints([start, end]);

    const midY = Math.round((fromBottom + toTop) / 2);
    return flowPathFromPoints([start, [fromCenterX, midY], [toCenterX, midY], end]);
  }

  const busY = Math.min(fromTop, toTop) - mergeBusOffset;
  return flowPathFromPoints([
    [fromCenterX, fromTop],
    [fromCenterX, busY],
    [toCenterX, busY],
    [toCenterX, toBottom],
  ]);
}

/** @param {Array<[number, number]>} points */
function flowPathFromPoints(points) {
  if (!points.length) return "";
  const [firstX, firstY] = points[0];
  const tail = points
    .slice(1)
    .map(([x, y]) => `L ${roundFlowCoord(x)} ${roundFlowCoord(y)}`)
    .join(" ");
  return `M ${roundFlowCoord(firstX)} ${roundFlowCoord(firstY)} ${tail}`;
}

/** @param {number} value */
function roundFlowCoord(value) {
  return Math.round(value * 10) / 10;
}

function renderGameMenuModal(progress) {
  const safeProgress = progress ?? { discovered: 0, total: 1, percent: 0, currentTitle: "Пролог" };

  return `
    <div class="overlay overlay--left" data-stop-advance="true">
      <div class="panel panel--game-menu">
        <div class="panel__head">
          <h2 class="panel__title">Меню</h2>
          <button type="button" class="panel__close" data-action="close-game-overlay" aria-label="Закрыть">
            ${renderIcon("close", "icon panel__close-icon")}
          </button>
        </div>

        <div class="panel__body panel__body--stack">
          ${gameMenuItem("exit", "Главное меню")}
          ${gameMenuItem("game-settings", "Настройки")}
          ${renderGameProgressBlock(safeProgress)}
        </div>
      </div>
    </div>
  `;
}

/** @param {{ discovered: number, total: number, percent: number, currentTitle: string }} progress */
function renderGameProgressBlock(progress) {
  return `
    <section class="game-progress" aria-label="Общий прогресс игры">
      <div class="game-progress__head">
        <div class="game-progress__titles">
          <h3 class="game-progress__title">Прогресс</h3>
          <p class="game-progress__subtitle">Общий прогресс игры</p>
        </div>
      </div>

      <div
        class="game-progress__bar"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${progress.percent}"
        aria-label="Пройдено ${progress.percent}%"
      >
        <span class="game-progress__bar-fill" style="width: ${progress.percent}%"></span>
      </div>

      <p class="game-progress__meta">Открыто узлов: ${progress.discovered} из ${progress.total} · ${progress.percent}%</p>
      <p class="game-progress__current">Сейчас: ${escapeHtml(progress.currentTitle)}</p>
    </section>
  `;
}

function gameMenuItem(action, label) {
  return `
    <button type="button" class="game-menu-item" data-action="${action}">
      <span class="game-menu-item__label">${escapeHtml(label)}</span>
    </button>
  `;
}

/**
 * @param {Array<{
 *   index: number,
 *   text: string,
 *   extraClass?: string,
 *   attrs?: string,
 *   as?: "button" | "div",
 *   choiceId?: string,
 * }>} plaques
 * @param {{ ariaLabel?: string }} [options]
 */
function renderChoicePlaqueList(plaques, options = {}) {
  const items = plaques
    .map((plaque) => {
      const extraClass = plaque.extraClass ? ` ${plaque.extraClass}` : "";
      const attrs = plaque.attrs ? ` ${plaque.attrs}` : "";

      if (plaque.as === "div") {
        return `
          <div class="choice-btn${extraClass}"${attrs}>
            <span class="choice-btn__index">${plaque.index}</span>
            <span class="choice-btn__text">${escapeHtml(plaque.text)}</span>
          </div>
        `;
      }

      const choiceAttr = plaque.choiceId ? ` data-choice="${escapeAttr(plaque.choiceId)}"` : "";
      return `
        <button type="button" class="choice-btn${extraClass}"${choiceAttr} data-stop-advance="true"${attrs}>
          <span class="choice-btn__index">${plaque.index}</span>
          <span class="choice-btn__text">${escapeHtml(plaque.text)}</span>
        </button>
      `;
    })
    .join("");

  const ariaLabel = options.ariaLabel ? ` aria-label="${escapeAttr(options.ariaLabel)}"` : "";

  return `
    <div class="choices choices--inline" data-stop-advance="true"${ariaLabel}>
      <div class="choices__list">${items}</div>
    </div>
  `;
}

/** @param {Array<{ id: string, text: string }>} choices */
function renderChoices(choices) {
  if (!choices?.length) return "";

  return renderChoicePlaqueList(
    choices.map((choice, index) => ({
      index: index + 1,
      text: choice.text,
      choiceId: choice.id,
    })),
  );
}

function renderActBreak(actBreak) {
  const title = escapeHtml(actBreak?.title ?? "...");
  const chevron = renderIcon("chevronTripleRight", "icon act-break__chevron");

  return `
    <div class="act-break">
      <div class="act-break__card">
        <div class="act-break__body">
          <h2 class="act-break__title">${title}</h2>
        </div>
        <div class="act-break__hint">
          <span class="act-break__hint-text">Нажмите, чтобы продолжить</span>
          <span class="act-break__chevrons" aria-hidden="true">${chevron}</span>
        </div>
      </div>
    </div>
  `;
}

function renderTextbox({ line, speaker, isNarration, isThought, choices }) {
  const hasChoices = Boolean(choices?.length);
  const text = hasChoices ? "" : formatStoryText(line?.text ?? "…");
  const name = speaker ? escapeHtml(speaker.label) : "";
  const choicesHtml = hasChoices ? renderChoices(choices) : "";

  return `
    <div class="textbox ${isNarration ? "textbox--narration" : ""} ${isThought ? "textbox--thought" : ""} ${hasChoices ? "textbox--with-choices" : ""}">
      <div class="textbox__body">
        ${name ? `<div class="textbox__name">${name}</div>` : ""}
        ${text ? `<p class="textbox__text">${text}</p>` : ""}
        ${choicesHtml}
      </div>
    </div>
  `;
}

function renderScanTerminalPanel(line, searchState) {
  const items = getItemSearchItems(line);
  const foundIds = new Set(searchState?.foundIds ?? []);
  const isComplete = items.length > 0 && items.every((item) => foundIds.has(item.id));

  const plaques = items
    .filter((item) => !foundIds.has(item.id))
    .map((item, index) => ({
      index: index + 1,
      text: item.label,
      as: "div",
      attrs: `data-scan-terminal-id="${escapeAttr(item.id)}" aria-label="${escapeAttr(item.label)}"`,
    }));

  return `
    <section
      class="textbox textbox--with-choices scan-terminal ${isComplete ? "scan-terminal--complete" : ""}"
      aria-label="Скан аномалий"
      ${isComplete ? 'data-scan-complete="true"' : ""}
      data-stop-advance="true"
    >
      <div class="textbox__body scan-terminal__body">
        <div class="textbox__name scan-terminal__name">СИНХРОН · СКАН</div>
        ${renderChoicePlaqueList(plaques, { ariaLabel: "Журнал сканирования" })}
      </div>
    </section>
  `;
}

function renderStageLayers(story, vm, searchState, showChoices = false) {
  const layers = showChoices && vm.choices?.length ? getChoicePresenterLayers() : vm.characterLayers;
  return `${renderCharacterLayers(story, layers)}${renderScanScene(vm.line, searchState)}`;
}

function renderAnomalyScanOverlay() {
  return `
    <div class="anomaly-scan is-scanning" aria-hidden="true" style="--scan-y: 0%;">
      <div class="anomaly-scan__scanned"></div>
      <div class="anomaly-scan__digitized"></div>
      <div class="anomaly-scan__grid"></div>
      <div class="anomaly-scan__head">
        <span class="anomaly-scan__head-band"></span>
        <span class="anomaly-scan__head-beam"></span>
      </div>
      <div class="anomaly-scan__frame"></div>
      <div class="anomaly-scan__scanlines"></div>
      <button
        type="button"
        class="hud-btn scan-help-btn"
        data-action="open-scan-help"
        data-stop-advance="true"
        aria-label="Как искать и сканировать"
      >?</button>
    </div>
  `;
}

/**
 * @param {HTMLElement} novel
 * @param {object|null|undefined} line
 */
function syncNovelScanLayer(novel, line) {
  let scanLayer = novel.querySelector(".novel__scan");

  if (!isItemSearchLine(line)) {
    scanLayer?.remove();
    return;
  }

  if (!scanLayer) {
    scanLayer = document.createElement("div");
    scanLayer.className = "novel__scan";
    const content = novel.querySelector(".novel__content");
    content?.insertAdjacentElement("beforebegin", scanLayer);
  }

  scanLayer.innerHTML = renderAnomalyScanOverlay();
}

function renderScanZones(line, searchState) {
  const items = getItemSearchItems(line);
  if (!items.length) return "";

  const foundIds = new Set(searchState?.foundIds ?? []);
  const revealedIds = new Set(searchState?.revealedIds ?? []);
  const zones = items
    .map((item) => {
      const isLocked = foundIds.has(item.id);
      const isRevealed = isLocked || revealedIds.has(item.id);
      const lockedClass = isLocked ? "scan-zone--locked" : "";
      const revealedClass = isRevealed ? "scan-zone--revealed" : "";
      return `
        <button
          type="button"
          class="scan-zone ${lockedClass} ${revealedClass}"
          data-scan-item="${escapeAttr(item.id)}"
          data-scan-y="${item.y}"
          data-stop-advance="true"
          aria-label="${escapeAttr(item.label)}"
          style="--scan-x: ${item.x}%; --scan-y: ${item.y}%; --scan-size: ${item.size}vw;"
        >
          <span class="scan-zone__reticle" aria-hidden="true">
            <span class="scan-zone__fill" aria-hidden="true"></span>
            <span class="scan-zone__corner scan-zone__corner--tl"></span>
            <span class="scan-zone__corner scan-zone__corner--tr"></span>
            <span class="scan-zone__corner scan-zone__corner--bl"></span>
            <span class="scan-zone__corner scan-zone__corner--br"></span>
          </span>
          <span class="scan-zone__core" aria-hidden="true"></span>
          <span class="scan-zone__readout" aria-hidden="true"></span>
        </button>
      `;
    })
    .join("");

  return `<div class="scan-zones">${zones}</div>`;
}

function renderScanScene(line, searchState) {
  return renderScanZones(line, searchState);
}

function renderSyncSilhouette(slot, dimmed) {
  return `
    <div class="character character--sync character--${slot} ${dimmed}" data-character-id="${escapeAttr(SYNC_CHARACTER_ID)}">
      <div class="sync-orb" aria-hidden="true">
        <div class="sync-orb__frame">
          <div class="sync-orb__ring-outer"></div>
          <div class="sync-orb__shell">
            <canvas class="sync-orb__fluid"></canvas>
            <canvas class="sync-orb__noise"></canvas>
            <svg class="sync-orb__rings" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" stroke-width="2.5" class="sync-orb__ring sync-orb__ring--outer" />
              <circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" stroke-width="7" class="sync-orb__ring sync-orb__ring--inner" />
              <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" stroke-width="1.5" class="sync-orb__ring sync-orb__ring--fine" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCharacterLayers(story, layers) {
  if (!layers?.length) return "";

  return layers
    .map((layer) => {
      const character = story.characters[layer.id];
      const slot = layer.slot ?? "left";
      const dimmed = layer.dimmed ? "character--dimmed" : "";

      if (layer.id === SYNC_CHARACTER_ID) {
        return renderSyncSilhouette(slot, dimmed);
      }

      if (character?.image) {
        return `
          <div class="character character--${slot} ${dimmed}" data-character-id="${escapeAttr(layer.id)}">
            <img class="character__img" src="${escapeAttr(character.image)}" alt="${escapeAttr(character.label)}" />
          </div>
        `;
      }

      const initial = (character?.label ?? "?").charAt(0);
      return `
        <div class="character character--${slot} character--placeholder ${dimmed}" data-character-id="${escapeAttr(layer.id)}">
          <div class="character__placeholder">${escapeHtml(initial)}</div>
          <span class="character__label">${escapeHtml(character?.label ?? "")}</span>
        </div>
      `;
    })
    .join("");
}

function settingsRow(key, label, value, iconName) {
  return `
    <label class="settings-row">
      <span class="settings-row__head">
        ${renderIcon(iconName, "icon settings-row__icon")}
        <span class="settings-row__label">${label}</span>
        <span class="settings-row__value" data-setting-value="${key}">${value}%</span>
      </span>
      <input
        class="settings-row__range"
        type="range"
        min="0"
        max="100"
        step="1"
        value="${value}"
        data-setting="${key}"
      />
    </label>
  `;
}

function menuButton(action, label, options = {}) {
  const { active = false, disabled = false, block = false } = options;
  return `
    <button
      type="button"
      class="menu-btn ${active ? "menu-btn--active" : ""} ${block ? "menu-btn--block" : ""}"
      data-action="${action}"
      ${disabled ? "disabled" : ""}
    >
      <span class="menu-btn__label">${label}</span>
    </button>
  `;
}

function resolveSpeakerInline(story, speakerId) {
  if (!speakerId) return null;
  return story.characters[speakerId] ?? { id: speakerId, label: speakerId, image: null };
}

const STORY_COLOR_TAG = /\[c=(#[0-9a-fA-F]{3,8})\]([\s\S]*?)\[\/c\]/g;
/** Служебные пометки переменных из черновиков сценария — не показывать игроку. */
const STORY_VARIABLE_FLAG_RE = /(?:^|[\s,.;])[a-z][a-z0-9_]*\s*[+\-]\s*\d+\.?/gi;
/** Черновые авторские пометки вроде «Итог: …». */
const STORY_DRAFT_NOTE_RE = /^Итог:\s*/gm;

/**
 * @param {string} text
 * @returns {string}
 */
export function stripStoryDraftNotes(text) {
  return String(text ?? "")
    .replace(STORY_DRAFT_NOTE_RE, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * @param {string} text
 * @returns {string}
 */
export function stripStoryVariableFlags(text) {
  return stripStoryDraftNotes(
    String(text ?? "")
      .replace(STORY_VARIABLE_FLAG_RE, (match) => (/^[\s,.;]/.test(match) ? match[0] : ""))
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.!?])/g, "$1")
      .trim(),
  );
}

function sanitizeHexColor(color) {
  if (!/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{8}$/.test(color)) {
    return null;
  }

  return color.toLowerCase();
}

function formatStoryText(text) {
  const source = stripStoryVariableFlags(text) || "…";
  let result = "";
  let lastIndex = 0;

  STORY_COLOR_TAG.lastIndex = 0;

  for (const match of source.matchAll(STORY_COLOR_TAG)) {
    result += escapeHtml(source.slice(lastIndex, match.index));

    const color = sanitizeHexColor(match[1]);
    const inner = escapeHtml(match[2]);

    if (color) {
      result += `<span class="textbox__accent" style="color: ${escapeAttr(color)}">${inner}</span>`;
    } else {
      result += escapeHtml(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  result += escapeHtml(source.slice(lastIndex));
  return result.replaceAll("\n", "<br>");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

let pathNoticeTimer = null;

/** @param {{ title: string, text: string }|null|undefined} notice */
export function showPathNotice(notice) {
  if (!notice) return;

  const novel = document.querySelector(".novel");
  if (!novel) return;

  novel.querySelectorAll(".path-notice").forEach((element) => element.remove());
  clearTimeout(pathNoticeTimer);

  novel.insertAdjacentHTML(
    "beforeend",
    `
      <div class="path-notice" role="status" aria-live="polite">
        <p class="path-notice__title">${escapeHtml(notice.title)}</p>
        <p class="path-notice__text">${escapeHtml(notice.text)}</p>
      </div>
    `,
  );

  const element = novel.querySelector(".path-notice");
  if (!element) return;

  requestAnimationFrame(() => {
    element.classList.add("path-notice--visible");
  });

  pathNoticeTimer = window.setTimeout(() => {
    element.classList.add("path-notice--leave");
    window.setTimeout(() => element.remove(), 280);
  }, 3200);
}
