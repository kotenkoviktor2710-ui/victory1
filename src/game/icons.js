/** Локальные SVG-иконки из набора MDI (Iconify). */

/** @type {Record<string, string>} */
const ICON_FILES = {
  settings: "mdi-cog",
  check: "mdi-check",
  lock: "mdi-lock",
  close: "mdi-close",
  menu: "mdi-menu",
  home: "mdi-home",
  book: "mdi-book-open-variant",
  volumeHigh: "mdi-volume-high",
  volumeOff: "mdi-volume-off",
  chevronDown: "mdi-chevron-down",
  chevronRight: "mdi-chevron-right",
  chevronTripleRight: "mdi-chevron-triple-right",
};

/**
 * @param {keyof typeof ICON_FILES} name
 * @param {string} [className]
 */
export function renderIcon(name, className = "icon") {
  const file = ICON_FILES[name];
  if (!file) return "";
  return `<span class="${className} icon icon--${file}" aria-hidden="true"></span>`;
}
