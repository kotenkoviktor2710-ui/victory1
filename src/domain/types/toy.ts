export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'ancient'

export interface ToyDefinition {
  id: string
  name: string
  rarity: Rarity
  baseAttack: number
  baseHealth: number
  baseSpeed: number
  baseCritChance: number
  baseCritDamage: number
  baseClickReward: number
}

export interface PlacedToy {
  instanceId: string
  definitionId: string
  level: number
  x: number
  y: number
}

export interface ToyStats {
  attack: number
  health: number
  speed: number
  critChance: number
  critDamage: number
  clickReward: number
}

export const MAX_TOY_LEVEL = 50
export const MIN_TOY_LEVEL = 1
