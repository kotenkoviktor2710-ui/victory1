import { MAX_TOY_LEVEL, MIN_TOY_LEVEL } from '../types/toy'
import { assetUrl } from '@/shared/utils/assetUrl'

/** Сколько WebP лежит в public/images/toys (1.webp … 50.webp). */
export const TOY_LEVEL_IMAGE_COUNT = MAX_TOY_LEVEL

const TOY_IMAGE_DIR = 'images/toys'

export function getToyImageByLevel(level: number): string {
  const clamped = Math.max(MIN_TOY_LEVEL, Math.min(level, MAX_TOY_LEVEL))
  return assetUrl(`${TOY_IMAGE_DIR}/${clamped}.webp`)
}

export const DEFAULT_TOY_IMAGE = getToyImageByLevel(1)
