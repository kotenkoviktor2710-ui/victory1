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
