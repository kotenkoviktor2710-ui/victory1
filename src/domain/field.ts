import type { PlacedToy } from './types/toy'

export const MAX_FIELD_TOYS = 16
/** Отступы игровой зоны внутри арены (%). Верх — до кнопок HUD (они вне арены). */
export const FIELD_INSET = { top: 0, right: 0, bottom: 0, left: 0 }

/** Мин. отступ центра игрушки от края (%), чтобы спрайт и бейджи не обрезались. */
export const FIELD_EDGE_MARGIN = 22

export function clampFieldPosition(x: number, y: number): { x: number; y: number } {
  const edge = FIELD_EDGE_MARGIN
  const limit = 100 - edge
  return {
    x: Math.max(edge, Math.min(limit, x)),
    y: Math.max(edge, Math.min(limit, y)),
  }
}

export function clientToFieldPercent(
  clientX: number,
  clientY: number,
  fieldRect: DOMRect,
): { x: number; y: number } {
  const x = ((clientX - fieldRect.left) / fieldRect.width) * 100
  const y = ((clientY - fieldRect.top) / fieldRect.height) * 100
  return clampFieldPosition(x, y)
}

export function randomFieldPosition(existing: PlacedToy[]): { x: number; y: number } {
  const minDist = 14
  const edge = FIELD_EDGE_MARGIN
  const span = 100 - edge * 2

  for (let attempt = 0; attempt < 24; attempt++) {
    const x = edge + Math.random() * span
    const y = edge + Math.random() * span
    const fits = existing.every((toy) => Math.hypot(toy.x - x, toy.y - y) >= minDist)
    if (fits) return { x, y }
  }

  return { x: edge + Math.random() * span, y: edge + Math.random() * span }
}

type LegacyBoard = (PlacedToy | null)[] | PlacedToy[]

export function normalizeBoard(raw: LegacyBoard | undefined): PlacedToy[] {
  if (!raw?.length) return []

  const first = raw.find((entry) => entry != null)
  if (first && 'x' in first && typeof first.x === 'number') {
    return (raw as PlacedToy[])
      .filter((entry) => entry != null)
      .map((entry) => {
        const pos = clampFieldPosition(entry.x, entry.y)
        return pos.x === entry.x && pos.y === entry.y ? entry : { ...entry, ...pos }
      })
  }

  return (raw as (PlacedToy | null)[])
    .map((entry, index) => {
      if (!entry) return null
      const col = index % 4
      const row = Math.floor(index / 4)
      return {
        ...entry,
        x: 14 + col * 22 + Math.random() * 6,
        y: 16 + row * 20 + Math.random() * 6,
      }
    })
    .filter((entry): entry is PlacedToy => entry != null)
}
