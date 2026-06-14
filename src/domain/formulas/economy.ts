import { MAX_TOY_LEVEL, MIN_TOY_LEVEL, type ToyDefinition, type ToyStats } from '../types/toy'

/** Доход за клик по уровню игрушки. */
const INCOME_LEVEL_SCALE = 1.46
/** Бой/PvP-статы. */
const COMBAT_LEVEL_SCALE = 1.5
/**
 * Сколько кликов по лучшей игрушке на поле (x1) нужно на покупку.
 * В референсе ~15–18 при x1, ~3–4 при x5.
 */
const CLICKS_TO_AFFORD_AT_X1 = 15
/** Мягкая инфляция: рост замедляется (√N), чтобы не уезжать от дохода. */
const PURCHASE_INFLATION = 1.1

const BASE_CLICK_REWARD = 8
const BASE_BUY_COST = 70

function clampLevel(level: number): number {
  return Math.max(MIN_TOY_LEVEL, Math.min(MAX_TOY_LEVEL, level))
}

export function levelIncomeMultiplier(level: number): number {
  return Math.pow(INCOME_LEVEL_SCALE, clampLevel(level) - 1)
}

export function levelCombatMultiplier(level: number): number {
  return Math.pow(COMBAT_LEVEL_SCALE, clampLevel(level) - 1)
}

/** @deprecated Используйте levelCombatMultiplier. */
export function levelMultiplier(level: number): number {
  return levelCombatMultiplier(level)
}

/** Инфляция покупок: dampened, чтобы не обгонять рост дохода от уровней. */
export function purchaseCountMultiplier(totalPurchases: number): number {
  if (totalPurchases <= 0) return 1
  const dampenedExponent = Math.sqrt(totalPurchases)
  return Math.pow(PURCHASE_INFLATION, dampenedExponent)
}

export function getClickRewardByLevel(level: number): number {
  return Math.max(1, Math.round(BASE_CLICK_REWARD * levelIncomeMultiplier(level)))
}

export function getToyStats(definition: ToyDefinition, level: number): ToyStats {
  const combatMult = levelCombatMultiplier(level)
  return {
    attack: Math.round(definition.baseAttack * combatMult),
    health: Math.round(definition.baseHealth * combatMult),
    speed: Math.round(definition.baseSpeed * combatMult * 10) / 10,
    critChance: Math.min(0.75, definition.baseCritChance + (level - 1) * 0.01),
    critDamage: definition.baseCritDamage + (level - 1) * 0.05,
    clickReward: getClickRewardByLevel(level),
  }
}

export const SHOP_LEVEL_OFFSET = 4

export function getShopPurchaseLevel(maxBoardLevel: number): number {
  const clampedMax = Math.max(MIN_TOY_LEVEL, maxBoardLevel)
  return Math.max(MIN_TOY_LEVEL, clampedMax - SHOP_LEVEL_OFFSET)
}

function earlyPurchaseFloor(purchaseLevel: number): number {
  if (purchaseLevel > 3) return 1
  return Math.round(BASE_BUY_COST * Math.pow(1.08, purchaseLevel - 1))
}

/**
 * Цена привязана к текущему доходу с поля, а не к отдельной «дорогой» кривой.
 * cost ≈ clickReward(maxBoard) × clicksToAfford × (shopLevel/maxBoard) × inflation
 */
export function getPurchaseCostByLevel(
  purchaseLevel: number,
  incomeReferenceLevel: number,
  totalPurchases = 0,
): number {
  const purchase = clampLevel(purchaseLevel)
  const reference = clampLevel(Math.max(purchase, incomeReferenceLevel))

  const referenceIncome = getClickRewardByLevel(reference)
  const purchaseIncome = getClickRewardByLevel(purchase)
  const levelFactor = referenceIncome > 0 ? purchaseIncome / referenceIncome : 1

  const cost =
    referenceIncome *
    CLICKS_TO_AFFORD_AT_X1 *
    levelFactor *
    purchaseCountMultiplier(totalPurchases)

  // Первая покупка на пустом поле — доступна сразу после старта.
  if (totalPurchases === 0 && purchase <= 1 && incomeReferenceLevel <= 1) {
    return earlyPurchaseFloor(purchase)
  }

  return Math.max(earlyPurchaseFloor(purchase), Math.round(cost))
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
