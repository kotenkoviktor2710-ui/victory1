/** Карта сюжета в стиле flowchart — данные веток и прогресс открытий. */

const INTERNAL_TITLE_RE = /^(?:Ветка [A-Z]\d?|Скрытая S\d|S\d)\s*[—–-]\s*/iu;

/**
 * @typedef {"start"|"milestone"|"choice"|"outcome"} FlowNodeType
 */

/**
 * @typedef {object} FlowNode
 * @property {string} id
 * @property {FlowNodeType} type
 * @property {string} label
 * @property {number} x
 * @property {number} y
 * @property {string} [sceneId]
 * @property {string} [choiceId]
 * @property {string} [bg]
 */

/**
 * @typedef {object} FlowArc
 * @property {string} id
 * @property {string} title
 * @property {FlowNode[]} nodes
 * @property {Array<{ from: string, to: string }>} edges
 */

/** @type {FlowArc[]} */
export const FLOWCHART_ARCS = [
  {
    id: "main",
    title: "Основная линия",
    nodes: [
      { id: "m-start", type: "start", label: "НАЧАЛО", sceneId: "scene_prologue", bg: "./images/8bg.png", x: 48, y: 200 },
      { id: "m-prologue", type: "milestone", label: "Чёрный экран", sceneId: "scene_prologue", bg: "./images/8bg.png", x: 220, y: 200 },
      { id: "m-apartment", type: "milestone", label: "Квартира", sceneId: "scene_ch01_apartment", bg: "./images/1bg.png", x: 420, y: 200 },
      { id: "m-yard", type: "milestone", label: "Двор", sceneId: "scene_ch01_yard", bg: "./images/2bg.png", x: 620, y: 200 },
      { id: "c-cafe", type: "choice", label: "Кафе «Минута»", choiceId: "ch01_cafe", sceneId: "scene_ch02_cafe", x: 648, y: 328 },
      { id: "c-warehouse", type: "choice", label: "Склад доставки", choiceId: "ch01_warehouse", sceneId: "scene_ch02_warehouse", x: 728, y: 328 },
      { id: "c-orlova", type: "choice", label: "Инспектор Орлова", choiceId: "ch01_orlova", sceneId: "scene_ch02_orlova", x: 648, y: 392 },
      { id: "c-observe", type: "choice", label: "Наблюдать за городом", choiceId: "ch01_observe", sceneId: "scene_ch02_observe", x: 728, y: 392 },
      { id: "m-cross", type: "milestone", label: "Перекрёсток", sceneId: "scene_ch03_crossroad", bg: "./images/8bg.png", x: 860, y: 200 },
      { id: "m-repeat", type: "milestone", label: "Первый повтор", sceneId: "scene_ch03_repeat", bg: "./images/9bg.png", x: 1060, y: 200 },
      { id: "m-hub", type: "outcome", label: "Выбор приоритета", sceneId: "scene_ch04_hub", bg: "./images/9bg.png", x: 1260, y: 200 },
    ],
    edges: [
      { from: "m-start", to: "m-prologue" },
      { from: "m-prologue", to: "m-apartment" },
      { from: "m-apartment", to: "m-yard" },
      { from: "m-yard", to: "m-cross" },
      { from: "m-cross", to: "m-repeat" },
      { from: "m-repeat", to: "m-hub" },
      { from: "m-yard", to: "c-cafe" },
      { from: "m-yard", to: "c-warehouse" },
      { from: "m-yard", to: "c-orlova" },
      { from: "m-yard", to: "c-observe" },
      { from: "c-cafe", to: "m-cross" },
      { from: "c-warehouse", to: "m-cross" },
      { from: "c-orlova", to: "m-cross" },
      { from: "c-observe", to: "m-cross" },
    ],
  },
  {
    id: "save-stranger",
    title: "Спасти незнакомку",
    nodes: [
      { id: "a-start", type: "start", label: "НАЧАЛО", sceneId: "scene_a1_search", bg: "./images/6bg.png", x: 48, y: 220 },
      { id: "a-c-loop", type: "choice", label: "День повторяется", choiceId: "a1_loop", x: 200, y: 100 },
      { id: "a-c-danger", type: "choice", label: "Грозит опасность", choiceId: "a1_danger", x: 200, y: 150 },
      { id: "a-c-avoid", type: "choice", label: "Не идти на перекрёсток", choiceId: "a1_avoid", x: 200, y: 200 },
      { id: "a-c-lera", type: "choice", label: "Позвать Леру", choiceId: "a1_lera", x: 200, y: 250 },
      { id: "a-roof", type: "milestone", label: "Лера и Аня", sceneId: "scene_a2_sisters", bg: "./images/11bg.png", x: 460, y: 220 },
      { id: "a-c-leave", type: "choice", label: "Увести Аню из центра", choiceId: "a2_leave", x: 620, y: 100 },
      { id: "a-c-stay", type: "choice", label: "Остаться на перекрёстке", choiceId: "a2_stay", x: 620, y: 150 },
      { id: "a-c-orlova", type: "choice", label: "Передать данные Орловой", choiceId: "a2_orlova", x: 620, y: 200 },
      { id: "a-c-nika", type: "choice", label: "Подключить Нику", choiceId: "a2_nika", x: 620, y: 250 },
      { id: "a-final", type: "outcome", label: "Один спасённый день", sceneId: "scene_a_final", bg: "./images/8bg.png", x: 900, y: 200 },
      { id: "a-c-hub", type: "choice", label: "Выбрать другой путь", choiceId: "a_to_hub", x: 900, y: 310 },
      { id: "a-c-finale", type: "choice", label: "Идти к финалу", choiceId: "a_to_e", x: 900, y: 360 },
    ],
    edges: [
      { from: "a-start", to: "a-c-loop" },
      { from: "a-start", to: "a-c-danger" },
      { from: "a-start", to: "a-c-avoid" },
      { from: "a-start", to: "a-c-lera" },
      { from: "a-c-loop", to: "a-roof" },
      { from: "a-c-danger", to: "a-roof" },
      { from: "a-c-avoid", to: "a-roof" },
      { from: "a-c-lera", to: "a-roof" },
      { from: "a-roof", to: "a-c-leave" },
      { from: "a-roof", to: "a-c-stay" },
      { from: "a-roof", to: "a-c-orlova" },
      { from: "a-roof", to: "a-c-nika" },
      { from: "a-c-leave", to: "a-final" },
      { from: "a-c-stay", to: "a-final" },
      { from: "a-c-orlova", to: "a-final" },
      { from: "a-c-nika", to: "a-final" },
      { from: "a-final", to: "a-c-hub" },
      { from: "a-final", to: "a-c-finale" },
    ],
  },
  {
    id: "courier-error",
    title: "Ошибка курьера",
    nodes: [
      { id: "b-start", type: "start", label: "НАЧАЛО", sceneId: "scene_b1_address", bg: "./images/7bg.png", x: 48, y: 200 },
      { id: "b-address", type: "milestone", label: "Пустой адрес", sceneId: "scene_b1_address", bg: "./images/7bg.png", x: 280, y: 200 },
      { id: "b-c-server", type: "choice", label: "Взломать сервер", choiceId: "b2_server", x: 520, y: 120 },
      { id: "b-c-hide", type: "choice", label: "Скрыть ошибку", choiceId: "b2_hide", x: 520, y: 180 },
      { id: "b-c-orlova", type: "choice", label: "Сдать Орловой", choiceId: "b2_orlova", x: 520, y: 240 },
      { id: "b-c-destroy", type: "choice", label: "Уничтожить посылку", choiceId: "b2_destroy", x: 520, y: 300 },
      { id: "b-end", type: "outcome", label: "Последствия ошибки", sceneId: "scene_b_final", bg: "./images/8bg.png", x: 780, y: 200 },
      { id: "b-c-hub", type: "choice", label: "Вернуться к выбору", choiceId: "b_to_hub", x: 780, y: 310 },
      { id: "b-c-finale", type: "choice", label: "Идти к финалу", choiceId: "b_to_e", x: 780, y: 360 },
      { id: "b-c-s2", type: "choice", label: "Нулевой курьер", choiceId: "b_to_s2", x: 780, y: 410 },
    ],
    edges: [
      { from: "b-start", to: "b-address" },
      { from: "b-address", to: "b-c-server" },
      { from: "b-address", to: "b-c-hide" },
      { from: "b-address", to: "b-c-orlova" },
      { from: "b-address", to: "b-c-destroy" },
      { from: "b-c-server", to: "b-end" },
      { from: "b-c-hide", to: "b-end" },
      { from: "b-c-orlova", to: "b-end" },
      { from: "b-c-destroy", to: "b-end" },
      { from: "b-end", to: "b-c-hub" },
      { from: "b-end", to: "b-c-finale" },
      { from: "b-end", to: "b-c-s2" },
    ],
  },
  {
    id: "empty-city",
    title: "Город без людей",
    nodes: [
      { id: "c-start", type: "start", label: "НАЧАЛО", sceneId: "scene_c1_empty", bg: "./images/10bg.png", x: 48, y: 200 },
      { id: "c-empty", type: "milestone", label: "Пустое утро", sceneId: "scene_c1_empty", bg: "./images/10bg.png", x: 280, y: 200 },
      { id: "c-c-max", type: "choice", label: "Искать Макса", choiceId: "c1_max", x: 520, y: 120 },
      { id: "c-c-server", type: "choice", label: "Проверить сервер", choiceId: "c1_server", x: 520, y: 180 },
      { id: "c-c-route", type: "choice", label: "Следовать маршруту", choiceId: "c1_route", x: 520, y: 240 },
      { id: "c-c-break", type: "choice", label: "Сломать петлю", choiceId: "c1_break", x: 520, y: 300 },
      { id: "c-end", type: "outcome", label: "Выход из пустоты", sceneId: "scene_c_escape", bg: "./images/12bg.png", x: 780, y: 200 },
    ],
    edges: [
      { from: "c-start", to: "c-empty" },
      { from: "c-empty", to: "c-c-max" },
      { from: "c-empty", to: "c-c-server" },
      { from: "c-empty", to: "c-c-route" },
      { from: "c-empty", to: "c-c-break" },
      { from: "c-c-max", to: "c-end" },
      { from: "c-c-server", to: "c-end" },
      { from: "c-c-route", to: "c-end" },
      { from: "c-c-break", to: "c-end" },
    ],
  },
  {
    id: "algorithm",
    title: "Союз с алгоритмом",
    nodes: [
      { id: "d-start", type: "start", label: "НАЧАЛО", sceneId: "scene_d1_route", bg: "./images/13bg.png", x: 48, y: 200 },
      { id: "d-route", type: "milestone", label: "Идеальный маршрут", sceneId: "scene_d1_route", bg: "./images/13bg.png", x: 280, y: 200 },
      { id: "d-c-follow", type: "choice", label: "Следовать алгоритму", choiceId: "d1_follow", x: 520, y: 120 },
      { id: "d-c-ask", type: "choice", label: "Спросить у Синхрона", choiceId: "d1_ask", x: 520, y: 180 },
      { id: "d-c-break", type: "choice", label: "Сломать маршрут", choiceId: "d1_break", x: 520, y: 240 },
      { id: "d-c-lera", type: "choice", label: "Позвать Леру", choiceId: "d1_lera", x: 520, y: 300 },
      { id: "d-end", type: "outcome", label: "Идеальный день", sceneId: "scene_d_final", bg: "./images/14bg.png", x: 780, y: 200 },
      { id: "d-c-hub", type: "choice", label: "Вернуться к выбору", choiceId: "d_to_hub", x: 780, y: 310 },
      { id: "d-c-finale", type: "choice", label: "Идти к финалу", choiceId: "d_to_e", x: 780, y: 360 },
    ],
    edges: [
      { from: "d-start", to: "d-route" },
      { from: "d-route", to: "d-c-follow" },
      { from: "d-route", to: "d-c-ask" },
      { from: "d-route", to: "d-c-break" },
      { from: "d-route", to: "d-c-lera" },
      { from: "d-c-follow", to: "d-end" },
      { from: "d-c-ask", to: "d-end" },
      { from: "d-c-break", to: "d-end" },
      { from: "d-c-lera", to: "d-end" },
      { from: "d-end", to: "d-c-hub" },
      { from: "d-end", to: "d-c-finale" },
    ],
  },
  {
    id: "city-memory",
    title: "Память города",
    nodes: [
      { id: "s1-start", type: "start", label: "НАЧАЛО", sceneId: "scene_s1_city", bg: "./images/15bg.png", x: 48, y: 200 },
      { id: "s1-city", type: "milestone", label: "Город помнит", sceneId: "scene_s1_city", bg: "./images/15bg.png", x: 280, y: 200 },
      { id: "s1-c-route", type: "choice", label: "Следовать маршруту памяти", choiceId: "s1_route", x: 520, y: 120 },
      { id: "s1-c-lera", type: "choice", label: "Спросить Леру", choiceId: "s1_lera", x: 520, y: 180 },
      { id: "s1-c-pub", type: "choice", label: "Опубликовать архив", choiceId: "s1_publish", x: 520, y: 240 },
      { id: "s1-c-ignore", type: "choice", label: "Игнорировать", choiceId: "s1_ignore", x: 520, y: 300 },
      { id: "s1-end", type: "outcome", label: "Архив города", sceneId: "scene_s1_archive", bg: "./images/16bg.png", x: 780, y: 200 },
      { id: "s1-c-hub", type: "choice", label: "Вернуться к выбору", choiceId: "s1_to_hub", x: 780, y: 310 },
      { id: "s1-c-finale", type: "choice", label: "Идти к финалу", choiceId: "s1_to_e", x: 780, y: 360 },
    ],
    edges: [
      { from: "s1-start", to: "s1-city" },
      { from: "s1-city", to: "s1-c-route" },
      { from: "s1-city", to: "s1-c-lera" },
      { from: "s1-city", to: "s1-c-pub" },
      { from: "s1-city", to: "s1-c-ignore" },
      { from: "s1-c-route", to: "s1-end" },
      { from: "s1-c-lera", to: "s1-end" },
      { from: "s1-c-pub", to: "s1-end" },
      { from: "s1-c-ignore", to: "s1-end" },
      { from: "s1-end", to: "s1-c-hub" },
      { from: "s1-end", to: "s1-c-finale" },
    ],
  },
  {
    id: "zero-courier",
    title: "Нулевой курьер",
    nodes: [
      { id: "s2-start", type: "start", label: "НАЧАЛО", sceneId: "scene_s2_video", bg: "./images/4bg.png", x: 48, y: 200 },
      { id: "s2-video", type: "milestone", label: "Запись с камеры", sceneId: "scene_s2_video", bg: "./images/4bg.png", x: 280, y: 200 },
      { id: "s2-c-lera", type: "choice", label: "Показать Лере", choiceId: "s2_lera", x: 520, y: 120 },
      { id: "s2-c-orlova", type: "choice", label: "Передать Орловой", choiceId: "s2_orlova", x: 520, y: 180 },
      { id: "s2-c-alone", type: "choice", label: "Разобраться самому", choiceId: "s2_alone", x: 520, y: 240 },
      { id: "s2-c-nika", type: "choice", label: "Отдать Нике", choiceId: "s2_nika", x: 520, y: 300 },
      { id: "s2-end", type: "outcome", label: "Нулевой курьер", sceneId: "scene_s2_nika", bg: "./images/5bg.png", x: 780, y: 200 },
    ],
    edges: [
      { from: "s2-start", to: "s2-video" },
      { from: "s2-video", to: "s2-c-lera" },
      { from: "s2-video", to: "s2-c-orlova" },
      { from: "s2-video", to: "s2-c-alone" },
      { from: "s2-video", to: "s2-c-nika" },
      { from: "s2-c-lera", to: "s2-end" },
      { from: "s2-c-orlova", to: "s2-end" },
      { from: "s2-c-alone", to: "s2-end" },
      { from: "s2-c-nika", to: "s2-end" },
    ],
  },
  {
    id: "true-ending",
    title: "Настоящий конец дня",
    nodes: [
      { id: "e-start", type: "start", label: "НАЧАЛО", sceneId: "scene_e1_council", bg: "./images/15bg.png", x: 48, y: 220 },
      { id: "e-council", type: "milestone", label: "Совет перед финалом", sceneId: "scene_e1_council", bg: "./images/15bg.png", x: 280, y: 220 },
      { id: "e-c-nika", type: "choice", label: "Довериться Нике", choiceId: "e1_nika", x: 480, y: 100 },
      { id: "e-c-orlova", type: "choice", label: "Довериться Орловой", choiceId: "e1_orlova", x: 480, y: 150 },
      { id: "e-c-lera", type: "choice", label: "Довериться Лере", choiceId: "e1_lera", x: 480, y: 200 },
      { id: "e-c-max", type: "choice", label: "Довериться Максу", choiceId: "e1_max", x: 480, y: 250 },
      { id: "e-c-sync", type: "choice", label: "Довериться Синхрону", choiceId: "e1_sync", x: 480, y: 300 },
      { id: "e-cross", type: "milestone", label: "19:43", sceneId: "scene_e2_crossroad", bg: "./images/8bg.png", x: 720, y: 220 },
      { id: "e-end-best", type: "outcome", label: "Настоящий конец дня", sceneId: "scene_e_end_best", bg: "./images/16bg.png", x: 980, y: 140 },
      { id: "e-end-emotional", type: "outcome", label: "Эмоциональный финал", sceneId: "scene_e_end_emotional", bg: "./images/11bg.png", x: 980, y: 220 },
      { id: "e-end-tech", type: "outcome", label: "Технический финал", sceneId: "scene_e_end_technical", bg: "./images/13bg.png", x: 980, y: 300 },
      { id: "e-end-phil", type: "outcome", label: "Философский финал", sceneId: "scene_e_end_philosophical", bg: "./images/12bg.png", x: 980, y: 380 },
    ],
    edges: [
      { from: "e-start", to: "e-council" },
      { from: "e-council", to: "e-c-nika" },
      { from: "e-council", to: "e-c-orlova" },
      { from: "e-council", to: "e-c-lera" },
      { from: "e-council", to: "e-c-max" },
      { from: "e-council", to: "e-c-sync" },
      { from: "e-c-nika", to: "e-cross" },
      { from: "e-c-orlova", to: "e-cross" },
      { from: "e-c-lera", to: "e-cross" },
      { from: "e-c-max", to: "e-cross" },
      { from: "e-c-sync", to: "e-cross" },
      { from: "e-cross", to: "e-end-best" },
      { from: "e-cross", to: "e-end-emotional" },
      { from: "e-cross", to: "e-end-tech" },
      { from: "e-cross", to: "e-end-phil" },
    ],
  },
];

/** Связи между ветками — хаб, возвраты и переходы к финалу. */
export const STORY_CROSS_EDGES = [
  { from: "m-hub", to: "a-start" },
  { from: "m-hub", to: "b-start" },
  { from: "m-hub", to: "c-start" },
  { from: "m-hub", to: "d-start" },
  { from: "m-hub", to: "s1-start" },
  { from: "m-hub", to: "s2-start" },
  { from: "m-hub", to: "e-start" },
  { from: "a-c-hub", to: "m-hub" },
  { from: "a-c-finale", to: "e-start" },
  { from: "b-c-hub", to: "m-hub" },
  { from: "b-c-finale", to: "e-start" },
  { from: "b-c-s2", to: "s2-start" },
  { from: "d-c-hub", to: "m-hub" },
  { from: "d-c-finale", to: "e-start" },
  { from: "s1-c-hub", to: "m-hub" },
  { from: "s1-c-finale", to: "e-start" },
];

/** @returns {{ nodes: FlowNode[], edges: Array<{ from: string, to: string }> }} */
export function buildMergedStoryGraph() {
  const nodes = new Map();
  const edges = [];

  for (const arc of FLOWCHART_ARCS) {
    for (const node of arc.nodes) {
      if (!nodes.has(node.id)) nodes.set(node.id, { ...node });
    }
    for (const edge of arc.edges) edges.push({ ...edge });
  }

  for (const edge of STORY_CROSS_EDGES) edges.push({ ...edge });

  return { nodes: [...nodes.values()], edges };
}

/** @param {FlowNode} node */
export function isSceneFlowNode(node) {
  return node.type !== "choice";
}

/**
 * Сворачивает цепочки «сцена → выбор(ы) → сцена» в прямые связи между сценами.
 * Между одной парой сцен — не больше одной линии.
 *
 * @returns {{ nodes: FlowNode[], edges: Array<{ from: string, to: string }> }}
 */
export function buildDisplayStoryGraph() {
  const { nodes, edges } = buildMergedStoryGraph();
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const outgoing = new Map();

  for (const edge of edges) {
    if (!outgoing.has(edge.from)) outgoing.set(edge.from, []);
    outgoing.get(edge.from).push(edge.to);
  }

  /** @param {string} nodeId */
  function walkThroughChoices(nodeId) {
    const nextIds = outgoing.get(nodeId) ?? [];
    const results = [];

    for (const nextId of nextIds) {
      const next = byId.get(nextId);
      if (!next) continue;

      if (isSceneFlowNode(next)) {
        results.push(nextId);
        continue;
      }

      results.push(...walkThroughChoices(nextId));
    }

    return results;
  }

  const seen = new Set();
  const displayEdges = [];
  for (const node of nodes) {
    if (!isSceneFlowNode(node)) continue;

    for (const targetId of walkThroughChoices(node.id)) {
      const key = `${node.id}|${targetId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      displayEdges.push({ from: node.id, to: targetId });
    }
  }

  return {
    nodes: nodes.filter(isSceneFlowNode),
    edges: displayEdges,
  };
}

/** @returns {{ visitedScenes: Set<string>, visitedChoices: Set<string> }} */
export function normalizeDiscovery(raw) {
  const visitedScenes = new Set(Array.isArray(raw?.visitedScenes) ? raw.visitedScenes : []);
  const visitedChoices = new Set(Array.isArray(raw?.visitedChoices) ? raw.visitedChoices : []);
  return { visitedScenes, visitedChoices };
}

/** @param {{ visitedScenes: Set<string>, visitedChoices: Set<string> }} discovery */
export function serializeDiscovery(discovery) {
  return {
    visitedScenes: [...discovery.visitedScenes],
    visitedChoices: [...discovery.visitedChoices],
  };
}

/**
 * @param {string} text
 * @returns {string}
 */
export function cleanFlowLabel(text) {
  return String(text ?? "").trim().replace(INTERNAL_TITLE_RE, "");
}

/**
 * @param {FlowNode} node
 * @param {{ visitedScenes: Set<string>, visitedChoices: Set<string> }} discovery
 * @param {Set<string>} revealedIds
 */
function resolveNodeState(node, discovery, revealedIds) {
  if (node.type === "choice") {
    const taken = node.choiceId ? discovery.visitedChoices.has(node.choiceId) : false;
    const discovered = taken || (node.sceneId ? discovery.visitedScenes.has(node.sceneId) : revealedIds.has(node.id));
    return { discovered, taken, locked: !discovered };
  }

  const sceneHit = node.sceneId ? discovery.visitedScenes.has(node.sceneId) : false;
  const discovered = sceneHit || revealedIds.has(node.id);
  return { discovered, taken: sceneHit, locked: !discovered };
}

/**
 * @param {FlowArc} arc
 * @param {{ visitedScenes: Set<string>, visitedChoices: Set<string> }} discovery
 */
function buildRevealedIds(arc, discovery) {
  const revealed = new Set();
  const byId = new Map(arc.nodes.map((node) => [node.id, node]));
  const incoming = new Set(arc.edges.map((edge) => edge.to));

  for (const node of arc.nodes) {
    if (!incoming.has(node.id)) revealed.add(node.id);
  }

  let changed = true;

  while (changed) {
    changed = false;
    for (const node of arc.nodes) {
      if (revealed.has(node.id)) continue;

      const sceneHit = node.sceneId && discovery.visitedScenes.has(node.sceneId);
      const choiceHit = node.choiceId && discovery.visitedChoices.has(node.choiceId);
      if (sceneHit || choiceHit) {
        revealed.add(node.id);
        changed = true;
        continue;
      }

      const hasVisitedParent = arc.edges.some((edge) => {
        if (edge.to !== node.id) return false;
        const parent = byId.get(edge.from);
        if (!parent) return false;
        if (parent.choiceId && discovery.visitedChoices.has(parent.choiceId)) return true;
        if (parent.sceneId && discovery.visitedScenes.has(parent.sceneId)) return true;
        return false;
      });

      if (hasVisitedParent) {
        revealed.add(node.id);
        changed = true;
      }
    }
  }

  return revealed;
}

/**
 * @param {FlowArc} arc
 * @param {{ visitedScenes: Set<string>, visitedChoices: Set<string> }} discovery
 */
export function getArcViewModel(arc, discovery) {
  const revealedIds = buildRevealedIds(arc, discovery);
  const states = arc.nodes.map((node) => ({
    node,
    state: resolveNodeState(node, discovery, revealedIds),
  }));

  const discoveredCount = states.filter(({ state }) => state.discovered).length;
  const percent = arc.nodes.length ? Math.round((discoveredCount / arc.nodes.length) * 100) : 0;

  const width = Math.max(...arc.nodes.map((node) => node.x)) + 220;
  const height = Math.max(...arc.nodes.map((node) => node.y)) + 160;

  return { states, percent, width, height, edges: arc.edges };
}

/**
 * @param {{ visitedScenes: Set<string>, visitedChoices: Set<string> }} discovery
 * @param {FlowNode[]} positionedNodes
 * @param {Array<{ from: string, to: string }>} edges
 * @param {{ width: number, height: number }} canvas
 */
export function getMergedViewModel(discovery, positionedNodes, edges, canvas) {
  const fullGraph = buildMergedStoryGraph();
  const revealedIds = buildRevealedIds(fullGraph, discovery);
  const states = positionedNodes.map((node) => ({
    node,
    state: resolveNodeState(node, discovery, revealedIds),
  }));

  const discoveredCount = states.filter(({ state }) => state.discovered).length;
  const percent = positionedNodes.length ? Math.round((discoveredCount / positionedNodes.length) * 100) : 0;

  return {
    states,
    percent,
    width: canvas.width,
    height: canvas.height,
    edges,
  };
}

/**
 * @param {{ visitedScenes: Set<string>, visitedChoices: Set<string> }} discovery
 */
export function getGlobalFlowchartProgress(discovery) {
  const fullGraph = buildMergedStoryGraph();
  const revealedIds = buildRevealedIds(fullGraph, discovery);
  const sceneNodes = fullGraph.nodes.filter(isSceneFlowNode);

  let discovered = 0;
  for (const node of sceneNodes) {
    if (resolveNodeState(node, discovery, revealedIds).discovered) discovered += 1;
  }

  const total = sceneNodes.length;
  return {
    total,
    discovered,
    percent: total ? Math.round((discovered / total) * 100) : 0,
  };
}

/**
 * @param {{ visitedScenes: Set<string>, visitedChoices: Set<string> }} discovery
 * @param {string} [sceneId]
 * @param {string} [choiceId]
 */
export function recordDiscovery(discovery, sceneId, choiceId) {
  if (sceneId) discovery.visitedScenes.add(sceneId);
  if (choiceId) discovery.visitedChoices.add(choiceId);
}

/** @param {import("./story-loader.js").StoryBundle} story */
export function seedDiscoveryFromScene(story, sceneId) {
  const discovery = normalizeDiscovery(null);
  const scene = story.scenes[sceneId];
  if (!scene) return discovery;

  recordDiscovery(discovery, sceneId, null);

  for (const choice of scene.choices ?? []) {
    if (choice.nextSceneId) recordDiscovery(discovery, choice.nextSceneId, null);
  }

  return discovery;
}
