import type { Rarity } from './types/toy'

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9e9e9e',
  rare: '#42a5f5',
  epic: '#ab47bc',
  legendary: '#ffa726',
  mythic: '#ef5350',
  ancient: '#26c6da',
}

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Обычная',
  rare: 'Редкая',
  epic: 'Эпическая',
  legendary: 'Легендарная',
  mythic: 'Мифическая',
  ancient: 'Древняя',
}

export const BOARD_SLOT_COUNTS: Record<4 | 5 | 6, number> = {
  4: 16,
  5: 25,
  6: 36,
}

export const MAX_TEAM_SIZE = 5

/** Кулдаун исходящего PvP-нападения (мс). */
export const PVP_ATTACK_COOLDOWN_MS = 2 * 60 * 1000

/** Просмотров rewarded-рекламы до бонусной награды. */
export const AD_MILESTONE_VIEWS = 10

/** Персонажей за полный цикл просмотров. */
export const AD_MILESTONE_REWARD_TOYS = 10

export const PVP_RANK_THRESHOLDS = [
  { rank: 'bronze' as const, min: 0 },
  { rank: 'silver' as const, min: 500 },
  { rank: 'gold' as const, min: 1200 },
  { rank: 'platinum' as const, min: 2000 },
  { rank: 'diamond' as const, min: 3000 },
  { rank: 'master' as const, min: 4500 },
  { rank: 'legend' as const, min: 6500 },
]

export const PVP_RANK_LABELS: Record<string, string> = {
  bronze: 'Бронза',
  silver: 'Серебро',
  gold: 'Золото',
  platinum: 'Платина',
  diamond: 'Алмаз',
  master: 'Мастер',
  legend: 'Легенда',
}

export const CHEST_TYPES = ['common', 'rare', 'epic', 'legendary', 'mythic'] as const
export type ChestType = (typeof CHEST_TYPES)[number]

export const CHEST_LABELS: Record<ChestType, string> = {
  common: 'Обычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
  mythic: 'Мифический',
}

export const DAILY_QUEST_TARGETS = {
  daily_clicks: 1000,
  daily_merges: 10,
  daily_pvp_wins: 5,
  daily_chests: 3,
} as const

export const QUEST_REWARDS = {
  daily_clicks: { coins: 500, gems: 2 },
  daily_merges: { coins: 800, gems: 3 },
  daily_pvp_wins: { coins: 1200, gems: 5 },
  daily_chests: { coins: 600, gems: 4 },
} as const
