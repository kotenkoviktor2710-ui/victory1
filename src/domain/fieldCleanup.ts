import { getShopPurchaseLevel } from './formulas/economy'
import type { PlacedToy } from './types/toy'

export interface FieldCleanupOptions {
  /** Не удалять эти игрушки (например, только что полученные после merge). */
  excludeInstanceIds?: string[]
}

/**
 * Удаляем игрушки ниже уровня бокового магазина (max на поле − 4):
 * прогресс уже выше, они не нужны для мержа и только занимают слот.
 */
export function isRemovableLowLevelToy(
  toy: PlacedToy,
  maxBoardLevel: number,
  shopPurchaseLevel = getShopPurchaseLevel(maxBoardLevel),
): boolean {
  if (toy.level >= maxBoardLevel) return false
  return toy.level < shopPurchaseLevel
}

export function getRemovableToyIds(
  board: PlacedToy[],
  options: FieldCleanupOptions = {},
): string[] {
  if (board.length === 0) return []

  const maxBoardLevel = Math.max(...board.map((toy) => toy.level))
  const shopLevel = getShopPurchaseLevel(maxBoardLevel)
  const exclude = new Set(options.excludeInstanceIds ?? [])

  return board
    .filter(
      (toy) =>
        !exclude.has(toy.instanceId) &&
        isRemovableLowLevelToy(toy, maxBoardLevel, shopLevel),
    )
    .map((toy) => toy.instanceId)
}

export interface ReplacementPickOptions {
  excludeInstanceIds?: string[]
  /** Сначала заменяем игрушки вне боевой команды. */
  protectInstanceIds?: string[]
}

/** Кого заменить при полном поле: сначала низкий уровень, затем не из команды PvP. */
export function pickBoardToysForReplacement(
  board: PlacedToy[],
  count: number,
  options: ReplacementPickOptions = {},
): PlacedToy[] {
  if (count <= 0 || board.length === 0) return []

  const exclude = new Set(options.excludeInstanceIds ?? [])
  const protect = new Set(options.protectInstanceIds ?? [])

  return [...board]
    .filter((toy) => !exclude.has(toy.instanceId))
    .sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level
      const aProtected = protect.has(a.instanceId) ? 1 : 0
      const bProtected = protect.has(b.instanceId) ? 1 : 0
      if (aProtected !== bProtected) return aProtected - bProtected
      return a.instanceId.localeCompare(b.instanceId)
    })
    .slice(0, count)
}
