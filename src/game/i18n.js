/** UI-словарь игры (русский). Язык платформы — из SDK, контент только ru. */

import { syncDocumentLang } from "@/yandex/sdk";

const UI_URL = "lang/ui.json";

/** @type {Record<string, unknown>} */
let uiDict = {};

/**
 * @returns {Promise<void>}
 */
export async function initI18n() {
  const response = await fetch(UI_URL, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Не удалось загрузить словарь UI (${response.status})`);
  }

  uiDict = await response.json();
  syncDocumentLang();
}

/**
 * @param {string} key
 * @returns {unknown}
 */
export function getUiValue(key) {
  const parts = key.split(".");
  let node = uiDict;

  for (const part of parts) {
    if (!node || typeof node !== "object" || !(part in node)) {
      return null;
    }
    node = node[part];
  }

  return node ?? null;
}

/**
 * @param {string} key
 * @param {Record<string, string|number>} [vars]
 * @returns {string}
 */
export function t(key, vars) {
  const parts = key.split(".");
  let node = uiDict;

  for (const part of parts) {
    if (!node || typeof node !== "object" || !(part in node)) {
      return key;
    }
    node = node[part];
  }

  let value = typeof node === "string" ? node : key;

  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, String(replacement));
    }
  }

  return value;
}

/**
 * @param {string} text
 * @param {RegExp} pattern
 * @returns {boolean}
 */
export function matchesLocalized(text, pattern) {
  return pattern.test(String(text ?? ""));
}

/** @returns {RegExp} */
export function getItemSearchPattern() {
  const pattern = uiDict?.patterns?.itemSearch;
  if (typeof pattern === "string") {
    try {
      return new RegExp(pattern, "i");
    } catch {
      // fallback below
    }
  }
  return /^Поиск предметов/i;
}

/** @param {number} index */
export function getDefaultItemLabel(index) {
  return t("gameplay.itemFallback", { n: index });
}

/** @returns {{ arcTitles: Record<string, string>, nodeLabels: Record<string, string> }} */
export function getFlowchartTranslations() {
  return {
    arcTitles: uiDict?.flowchart?.arcTitles ?? {},
    nodeLabels: uiDict?.flowchart?.nodeLabels ?? {},
  };
}

/** @returns {import("./story-flowchart.js").FlowArc[]} */
export function getLocalizedFlowchartArcs(baseArcs) {
  const tr = getFlowchartTranslations();

  return baseArcs.map((arc) => ({
    ...arc,
    title: tr.arcTitles?.[arc.id] ?? arc.title,
    nodes: arc.nodes.map((node) => ({
      ...node,
      label: tr.nodeLabels?.[node.id] ?? node.label,
    })),
  }));
}
