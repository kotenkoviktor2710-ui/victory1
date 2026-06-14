import { MAX_TOY_LEVEL, MIN_TOY_LEVEL, type ToyDefinition, type ToyStats } from '../types/toy'

const LEVEL_SCALE = 1.5
/** Базовая награда за клик на Lv1 (GDD: Huggy Lv1 = 10). */
const BASE_CLICK_REWARD = 10
/** Базовая цена покупки игрушки Lv1. */
const BASE_BUY_COST = 50

export function levelMultiplier(level: number): number {
  const clamped = Math.max(MIN_TOY_LEVEL, Math.min(MAX_TOY_LEVEL, level))
  return Math.pow(LEVEL_SCALE, clamped - 1)
}

/** Награда за клик зависит только от уровня игрушки на поле. */
export function getClickRewardByLevel(level: number): number {
  return Math.round(BASE_CLICK_REWARD * levelMultiplier(level))
}

export function getToyStats(definition: ToyDefinition, level: number): ToyStats {
  const mult = levelMultiplier(level)
  return {
    attack: Math.round(definition.baseAttack * mult),
    health: Math.round(definition.baseHealth * mult),
    speed: Math.round(definition.baseSpeed * mult * 10) / 10,
    critChance: Math.min(0.75, definition.baseCritChance + (level - 1) * 0.01),
    critDamage: definition.baseCritDamage + (level - 1) * 0.05,
    clickReward: getClickRewardByLevel(level),
  }
}

/** На сколько уровней ниже максимума на поле продаётся боковой магазин. */
export const SHOP_LEVEL_OFFSET = 4

export function getShopPurchaseLevel(maxBoardLevel: number): number {
  const clampedMax = Math.max(MIN_TOY_LEVEL, maxBoardLevel)
  return Math.max(MIN_TOY_LEVEL, clampedMax - SHOP_LEVEL_OFFSET)
}

/** Фиксированная цена покупки по уровню (без роста от числа покупок). */
export function getPurchaseCostByLevel(level: number): number {
  return Math.round(BASE_BUY_COST * levelMultiplier(level))
}

export function calcClickReward(baseReward: number, comboMultiplier: number): number {
  return Math.round(baseReward * comboMultiplier)
}

export function formatNumber(value: number): string {
  if (value < 1000) return String(Math.floor(value))
  if (value < 1_000_000) return `${(value / 1000).toFixed(1)}K`
  if (value < 1_000_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  return `${(value / 1_000_000_000).toFixed(1)}B`
}
