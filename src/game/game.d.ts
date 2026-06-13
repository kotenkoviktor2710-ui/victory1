/** Типы для JS-модулей новеллы, импортируемых из TypeScript. */

declare module '@/game/i18n.js' {
  export function initI18n(): Promise<void>
  export function getUiValue(key: string): unknown
  export function t(key: string, vars?: Record<string, string | number>): string
}

declare module '@/game/story-loader.js' {
  export function loadStory(): Promise<Record<string, unknown>>
}

declare module '@/game/app.js' {
  export function bootstrapNovel(container: HTMLElement): Promise<void>
}
