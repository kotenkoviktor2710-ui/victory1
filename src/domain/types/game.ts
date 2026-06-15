import type { PlacedToy } from './toy'

export interface GameSave {
  coins: number
  gems: number
  board: PlacedToy[]
  purchaseCounts: Record<string, number>
  totalClicks: number
  totalMerges: number
  pvpRating: number
  pvpWins: number
  pvpLosses: number
  pvpRank: PvpRank
  teamInstanceIds: string[]
  questProgress: QuestProgress
  chestsOpened: number
  /** Уровни персонажей, для которых уже показывали модалку получения. */
  unlockedLevels: number[]
  /** Персонажи, которых игрок уже получал хотя бы раз. */
  unlockedDefinitionIds: string[]
  /** ID сессий входящих атак, которые игрок уже видел. */
  seenPvpSessionIds: string[]
  /** Unix-ms: когда снова можно напасть (0 — сразу). */
  nextAttackAvailableAt: number
  /** Учтённые просмотры rewarded-рекламы в текущем цикле (0…9). */
  rewardedAdViews: number
  /** Персонажи из бонуса, ожидающие свободного места на поле. */
  adMilestonePendingToys: number
}

export type PvpRank =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master'
  | 'legend'

export type QuestId =
  | 'daily_clicks'
  | 'daily_merges'
  | 'daily_pvp_wins'
  | 'daily_chests'

export interface QuestProgress {
  dailyClicks: number
  dailyMerges: number
  dailyPvpWins: number
  dailyChests: number
  claimedDaily: QuestId[]
  lastDailyReset: string
}

export const COMBO_MULTIPLIERS = [1, 2, 3, 4, 5] as const
export const COMBO_LEVEL_COLORS = ['#ffffff', '#7ee06a', '#64b5f6', '#ce93d8', '#ef5350'] as const

export interface FloatingIncome {
  id: number
  amount: number
  x: number
  y: number
  comboLevel: number
  driftX: number
}
export const COMBO_THRESHOLDS = [0, 12, 28, 48, 72] as const
/** Максимум шкалы единого прогрессбара (порог x5). */
export const COMBO_MAX_PROGRESS = COMBO_THRESHOLDS[COMBO_THRESHOLDS.length - 1]!

/** Прирост комбо за один клик (дробный — полоска растёт плавнее). */
export const COMBO_CLICK_GAIN = 0.55
/** Сколько снимается с комбо за один тик затухания. */
export const COMBO_DECAY_PER_TICK = 0.28
/** Интервал затухания комбо (мс). */
export const COMBO_DECAY_INTERVAL_MS = 480
/** Скорость визуального заполнения полоски (0–1, lerp за кадр). */
export const COMBO_BAR_FILL_LERP = 0.07
/** Скорость визуального падения полоски (медленнее заполнения). */
export const COMBO_BAR_DECAY_LERP = 0.022
