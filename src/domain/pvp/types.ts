export interface PvpTeamSlot {
  definitionId: string
  level: number
}

export interface PvpDefenseExtra {
  v: 1
  team: PvpTeamSlot[]
  power: number
  updatedAt: number
}

export interface PvpAttackPayload {
  type: 'pvp_attack'
  team: PvpTeamSlot[]
  power: number
  rating: number
}

export interface PvpOpponent {
  uniqueId: string
  name: string
  rating: number
  team: PvpTeamSlot[]
  power: number
}

export interface InboundAttack {
  sessionId: string
  attackerName: string
  attackerAvatar?: string
  team: PvpTeamSlot[]
  power: number
  rating: number
}
