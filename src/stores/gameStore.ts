import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { DAILY_QUEST_TARGETS, QUEST_REWARDS, type ChestType } from '@/domain/constants'
import { TOY_BY_ID, TOY_CATALOG, STARTER_TOY_ID } from '@/domain/data/toys'
import type { PvpTeamSlot } from '@/domain/pvp/types'
import { publishPvpDefense } from '@/yandex/pvpSync'
import { MAX_FIELD_TOYS, clampFieldPosition, normalizeBoard, randomFieldPosition } from '@/domain/field'
import { getRemovableToyIds } from '@/domain/fieldCleanup'
import {
  calcClickReward,
  getClickRewardByLevel,
  getPurchaseCostByLevel,
  getShopPurchaseLevel,
  getToyStats,
} from '@/domain/formulas/economy'
import type { FloatingIncome, GameSave, PvpRank, QuestId } from '@/domain/types/game'
import { COMBO_MULTIPLIERS, COMBO_THRESHOLDS, COMBO_CLICK_GAIN, COMBO_DECAY_PER_TICK } from '@/domain/types/game'
import { MAX_TOY_LEVEL, type PlacedToy } from '@/domain/types/toy'

export interface PendingPurchase {
  toy: PlacedToy
}

export interface ToyCelebration {
  id: number
  level: number
  definitionId: string
}

let instanceCounter = 0
let celebrationCounter = 0

function createInstanceId(): string {
  instanceCounter += 1
  return `toy-${Date.now()}-${instanceCounter}`
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function defaultSave(): GameSave {
  return {
    coins: 100,
    gems: 5,
    board: [],
    purchaseCounts: {},
    totalClicks: 0,
    totalMerges: 0,
    pvpRating: 0,
    pvpWins: 0,
    pvpLosses: 0,
    pvpRank: 'bronze',
    teamInstanceIds: [],
    questProgress: {
      dailyClicks: 0,
      dailyMerges: 0,
      dailyPvpWins: 0,
      dailyChests: 0,
      claimedDaily: [],
      lastDailyReset: todayKey(),
    },
    chestsOpened: 0,
    unlockedLevels: [],
    unlockedDefinitionIds: [STARTER_TOY_ID],
    seenPvpSessionIds: [],
  }
}

export const useGameStore = defineStore('game', () => {
  const coins = ref(100)
  const gems = ref(5)
  const board = ref<PlacedToy[]>([])
  const pendingToys = ref<PlacedToy[]>([])
  const purchaseCounts = ref<Record<string, number>>({})
  const totalClicks = ref(0)
  const totalMerges = ref(0)
  const pvpRating = ref(0)
  const pvpWins = ref(0)
  const pvpLosses = ref(0)
  const pvpRank = ref<PvpRank>('bronze')
  const teamInstanceIds = ref<string[]>([])
  const questProgress = ref(defaultSave().questProgress)
  const chestsOpened = ref(0)
  const unlockedLevels = ref<number[]>([])
  const unlockedDefinitionIds = ref<string[]>([STARTER_TOY_ID])
  const seenPvpSessionIds = ref<string[]>([])

  let pvpDefenseSyncTimer: ReturnType<typeof setTimeout> | null = null

  const comboProgress = ref(0)
  const comboLevel = ref(0)
  const floatingCoins = ref<FloatingIncome[]>([])
  let floatingId = 0

  const FLOATING_INCOME_MS = 950
  const FLOATING_INCOME_OFFSET_Y = -88

  const toyCelebrations = ref<ToyCelebration[]>([])

  const activeToyCelebration = computed(() => toyCelebrations.value[0] ?? null)

  const boardToys = computed(() => board.value.map((toy) => ({ toy })))

  const maxBoardLevel = computed(() => {
    if (board.value.length === 0) return 1
    return Math.max(...board.value.map((toy) => toy.level))
  })

  const shopPurchaseLevel = computed(() => getShopPurchaseLevel(maxBoardLevel.value))

  /** Награда за рекламу в боковом магазине: на 1 уровень выше покупки. */
  const shopAdGrantLevel = computed(() =>
    Math.min(MAX_TOY_LEVEL, shopPurchaseLevel.value + 1),
  )

  /** Награда за оценку игры: персонаж на 1 уровень выше лучшего на поле. */
  const freeCharacterGrantLevel = computed(() =>
    Math.min(MAX_TOY_LEVEL, maxBoardLevel.value + 1),
  )

  const comboMultiplier = computed(() => COMBO_MULTIPLIERS[comboLevel.value] ?? 1)

  function canAddToy(): boolean {
    return board.value.length + pendingToys.value.length < MAX_FIELD_TOYS
  }

  function findToy(instanceId: string): PlacedToy | undefined {
    return board.value.find((toy) => toy.instanceId === instanceId)
  }

  function createPlacedToy(definitionId: string, level = 1): PlacedToy {
    const pos = randomFieldPosition([...board.value, ...pendingToys.value])
    return {
      instanceId: createInstanceId(),
      definitionId,
      level,
      x: pos.x,
      y: pos.y,
    }
  }

  function addClickReward(baseReward: number, clientX?: number, clientY?: number): number {
    const levelAtClick = comboLevel.value
    const reward = calcClickReward(baseReward, comboMultiplier.value)
    coins.value += reward
    totalClicks.value += 1
    questProgress.value.dailyClicks += 1

    comboProgress.value += COMBO_CLICK_GAIN
    while (
      comboLevel.value < COMBO_THRESHOLDS.length - 1 &&
      comboProgress.value >= COMBO_THRESHOLDS[comboLevel.value + 1]!
    ) {
      comboLevel.value += 1
    }

    if (clientX != null && clientY != null) {
      floatingId += 1
      const id = floatingId
      floatingCoins.value.push({
        id,
        amount: reward,
        x: clientX,
        y: clientY + FLOATING_INCOME_OFFSET_Y,
        comboLevel: levelAtClick,
        driftX: (Math.random() - 0.5) * 36,
      })
      window.setTimeout(() => {
        floatingCoins.value = floatingCoins.value.filter((f) => f.id !== id)
      }, FLOATING_INCOME_MS)
    }

    return reward
  }

  function registerToyClick(instanceId: string, clientX?: number, clientY?: number): number {
    const toy = findToy(instanceId)
    if (!toy) return 0
    return addClickReward(getClickRewardByLevel(toy.level), clientX, clientY)
  }

  function getToyClickReward(instanceId: string): number {
    const toy = findToy(instanceId)
    if (!toy) return 0
    return getClickRewardByLevel(toy.level)
  }

  function decayCombo(): void {
    if (comboProgress.value <= 0) return
    comboProgress.value = Math.max(0, comboProgress.value - COMBO_DECAY_PER_TICK)

    while (comboLevel.value > 0 && comboProgress.value < COMBO_THRESHOLDS[comboLevel.value]!) {
      comboLevel.value -= 1
    }
  }

  function getTotalPurchaseCount(): number {
    return Object.values(purchaseCounts.value).reduce((sum, count) => sum + count, 0)
  }

  function getPurchaseCost(_definitionId: string, level = 1): number {
    return getPurchaseCostByLevel(level, maxBoardLevel.value, getTotalPurchaseCount())
  }

  function beginPurchase(definitionId: string, level = 1): PendingPurchase | null {
    const def = TOY_BY_ID[definitionId]
    if (!def || !canAddToy()) return null

    const cost = getPurchaseCost(definitionId, level)
    if (coins.value < cost) return null

    coins.value -= cost

    purchaseCounts.value = {
      ...purchaseCounts.value,
      [definitionId]: (purchaseCounts.value[definitionId] ?? 0) + 1,
    }

    const toy = createPlacedToy(definitionId, level)
    trackPendingToy(toy)

    return { toy }
  }

  function beginShopPurchase(): PendingPurchase | null {
    return beginPurchase(STARTER_TOY_ID, shopPurchaseLevel.value)
  }

  function beginShopAdGrant(): PendingPurchase | null {
    if (!canAddToy()) return null
    return beginGrant(STARTER_TOY_ID, shopAdGrantLevel.value)
  }

  function beginFreeCharacterGrant(): PendingPurchase | null {
    if (!canGrantFreeCharacter()) return null
    return beginGrant(STARTER_TOY_ID, freeCharacterGrantLevel.value)
  }

  function canGrantFreeCharacter(): boolean {
    return canAddToy() && maxBoardLevel.value < MAX_TOY_LEVEL
  }

  function trackPendingToy(toy: PlacedToy): void {
    pendingToys.value = [...pendingToys.value, toy]
  }

  function tryUnlockLevel(level: number): boolean {
    if (unlockedLevels.value.includes(level)) return false
    unlockedLevels.value = [...unlockedLevels.value, level]
    return true
  }

  function unlockDefinition(definitionId: string): void {
    if (!TOY_BY_ID[definitionId]) return
    if (unlockedDefinitionIds.value.includes(definitionId)) return
    unlockedDefinitionIds.value = [...unlockedDefinitionIds.value, definitionId]
  }

  function isDefinitionUnlocked(definitionId: string): boolean {
    return unlockedDefinitionIds.value.includes(definitionId)
  }

  function enqueueToyCelebration(toy: PlacedToy): void {
    if (!tryUnlockLevel(toy.level)) return

    celebrationCounter += 1
    toyCelebrations.value = [
      ...toyCelebrations.value,
      {
        id: celebrationCounter,
        level: toy.level,
        definitionId: toy.definitionId,
      },
    ]
  }

  function dismissToyCelebration(): void {
    toyCelebrations.value = toyCelebrations.value.slice(1)
  }

  function removeUnusableToys(excludeInstanceIds: string[] = []): void {
    const removeIds = new Set(getRemovableToyIds(board.value, { excludeInstanceIds }))
    if (removeIds.size === 0) return

    board.value = board.value.filter((toy) => !removeIds.has(toy.instanceId))
    teamInstanceIds.value = teamInstanceIds.value.filter((id) => !removeIds.has(id))
  }

  function commitToyToBoard(toy: PlacedToy): boolean {
    pendingToys.value = pendingToys.value.filter((entry) => entry.instanceId !== toy.instanceId)
    if (board.value.length >= MAX_FIELD_TOYS) return false
    if (board.value.some((entry) => entry.instanceId === toy.instanceId)) return true

    board.value = [...board.value, toy]
    return true
  }

  function finalizePurchase(toy: PlacedToy): void {
    if (!commitToyToBoard(toy)) return

    unlockDefinition(toy.definitionId)
    enqueueToyCelebration(toy)
    removeUnusableToys([toy.instanceId])
  }

  function buyToy(definitionId: string): boolean {
    const pending = beginPurchase(definitionId)
    if (!pending) return false
    finalizePurchase(pending.toy)
    return true
  }

  function beginGrant(definitionId: string, level = 1): PendingPurchase | null {
    const def = TOY_BY_ID[definitionId]
    if (!def || !canAddToy()) return null
    const toy = createPlacedToy(definitionId, level)
    trackPendingToy(toy)
    return { toy }
  }

  function grantToy(definitionId: string, level = 1): boolean {
    const pending = beginGrant(definitionId, level)
    if (!pending) return false
    finalizePurchase(pending.toy)
    return true
  }

  function grantRandomCommonToy(): PendingPurchase | null {
    const commons = TOY_CATALOG.filter((t) => t.rarity === 'common')
    const toy = commons[Math.floor(Math.random() * commons.length)]!
    return beginGrant(toy.id)
  }

  function canMerge(a: PlacedToy, b: PlacedToy): boolean {
    return (
      a.level === b.level &&
      a.level < MAX_TOY_LEVEL &&
      a.instanceId !== b.instanceId
    )
  }

  function tryMerge(fromId: string, toId: string): string | null {
    if (fromId === toId) return null
    const from = findToy(fromId)
    const to = findToy(toId)
    if (!from || !to || !canMerge(from, to)) return null

    const mergedToy: PlacedToy = {
      instanceId: createInstanceId(),
      definitionId: to.definitionId,
      level: to.level + 1,
      x: to.x,
      y: to.y,
    }

    board.value = board.value
      .filter((toy) => toy.instanceId !== fromId && toy.instanceId !== toId)
      .concat(mergedToy)

    teamInstanceIds.value = teamInstanceIds.value
      .filter((id) => id !== fromId)
      .map((id) => (id === toId ? mergedToy.instanceId : id))

    totalMerges.value += 1
    questProgress.value.dailyMerges += 1
    enqueueToyCelebration(mergedToy)
    removeUnusableToys([mergedToy.instanceId])
    return mergedToy.instanceId
  }

  function canMergeToys(fromId: string, toId: string): boolean {
    if (fromId === toId) return false
    const from = findToy(fromId)
    const to = findToy(toId)
    if (!from || !to) return false
    return canMerge(from, to)
  }

  function mergeToys(fromId: string, toId: string): string | null {
    return tryMerge(fromId, toId)
  }

  function moveToy(instanceId: string, x: number, y: number): void {
    const toy = findToy(instanceId)
    if (!toy) return
    const pos = clampFieldPosition(x, y)
    board.value = board.value.map((entry) =>
      entry.instanceId === instanceId ? { ...entry, x: pos.x, y: pos.y } : entry,
    )
  }

  function toggleTeamToy(instanceId: string): void {
    const pos = teamInstanceIds.value.indexOf(instanceId)
    if (pos >= 0) {
      teamInstanceIds.value.splice(pos, 1)
      schedulePvpDefenseSync()
      return
    }

    if (teamInstanceIds.value.length >= 5) return
    if (!findToy(instanceId)) return
    teamInstanceIds.value.push(instanceId)
    schedulePvpDefenseSync()
  }

  function getPvpTeamSlots(): PvpTeamSlot[] {
    const selected = teamInstanceIds.value
      .map((id) => board.value.find((toy) => toy.instanceId === id))
      .filter((toy): toy is PlacedToy => Boolean(toy))
      .map((toy) => ({ definitionId: toy.definitionId, level: toy.level }))

    if (selected.length > 0) return selected.slice(0, 5)

    return [...board.value]
      .filter((toy) => Boolean(TOY_BY_ID[toy.definitionId]))
      .sort((a, b) => {
        const defA = TOY_BY_ID[a.definitionId]!
        const defB = TOY_BY_ID[b.definitionId]!
        const powerA = getToyStats(defA, a.level)
        const powerB = getToyStats(defB, b.level)
        return powerB.attack + powerB.health - (powerA.attack + powerA.health)
      })
      .slice(0, 5)
      .map((toy) => ({ definitionId: toy.definitionId, level: toy.level }))
  }

  function calcPvpTeamPower(slots: PvpTeamSlot[]): number {
    return slots.reduce((sum, slot) => {
      const definition = TOY_BY_ID[slot.definitionId]
      if (!definition) return sum
      const stats = getToyStats(definition, slot.level)
      return sum + stats.attack + stats.health
    }, 0)
  }

  function markPvpSessionSeen(sessionId: string): void {
    if (!sessionId || seenPvpSessionIds.value.includes(sessionId)) return
    seenPvpSessionIds.value = [...seenPvpSessionIds.value, sessionId].slice(-80)
  }

  async function syncPvpDefense(): Promise<void> {
    const team = getPvpTeamSlots()
    if (team.length === 0) return
    const rating = Math.max(1, pvpRating.value)
    await publishPvpDefense(rating, team, calcPvpTeamPower(team))
  }

  function schedulePvpDefenseSync(): void {
    if (pvpDefenseSyncTimer) clearTimeout(pvpDefenseSyncTimer)
    pvpDefenseSyncTimer = setTimeout(() => {
      pvpDefenseSyncTimer = null
      void syncPvpDefense()
    }, 1500)
  }

  function addCoins(amount: number): void {
    coins.value += amount
  }

  function addGems(amount: number): void {
    gems.value += amount
  }

  function spendGems(amount: number): boolean {
    if (gems.value < amount) return false
    gems.value -= amount
    return true
  }

  function recordPvpStats(won: boolean, ratingDelta: number): void {
    pvpRating.value = Math.max(0, pvpRating.value + ratingDelta)
    if (won) {
      pvpWins.value += 1
      questProgress.value.dailyPvpWins += 1
    } else {
      pvpLosses.value += 1
    }
    updatePvpRank()
  }

  function recordPvpResult(won: boolean, ratingDelta: number, coinReward: number): void {
    recordPvpStats(won, ratingDelta)
    addCoins(coinReward)
  }

  function updatePvpRank(): void {
    const rating = pvpRating.value
    if (rating >= 6500) pvpRank.value = 'legend'
    else if (rating >= 4500) pvpRank.value = 'master'
    else if (rating >= 3000) pvpRank.value = 'diamond'
    else if (rating >= 2000) pvpRank.value = 'platinum'
    else if (rating >= 1200) pvpRank.value = 'gold'
    else if (rating >= 500) pvpRank.value = 'silver'
    else pvpRank.value = 'bronze'
  }

  function openChest(type: ChestType = 'common'): { coins: number; gems: number; toyId?: string } {
    const rewards = {
      common: { coins: 100, gems: 0, toyChance: 0.15 },
      rare: { coins: 250, gems: 1, toyChance: 0.25 },
      epic: { coins: 500, gems: 2, toyChance: 0.35 },
      legendary: { coins: 1000, gems: 5, toyChance: 0.5 },
      mythic: { coins: 2000, gems: 10, toyChance: 0.65 },
    }[type]

    coins.value += rewards.coins
    gems.value += rewards.gems
    chestsOpened.value += 1
    questProgress.value.dailyChests += 1

    let toyId: string | undefined
    if (Math.random() < rewards.toyChance) {
      const affordable = TOY_CATALOG.filter((t) => {
        const rarityOrder = ['common', 'rare', 'epic', 'legendary', 'mythic', 'ancient']
        const maxRarity = type === 'mythic' ? 4 : type === 'legendary' ? 3 : type === 'epic' ? 2 : 1
        return rarityOrder.indexOf(t.rarity) <= maxRarity
      })
      const def = affordable[Math.floor(Math.random() * affordable.length)]!
      toyId = def.id
      const pending = beginGrant(def.id)
      if (pending) finalizePurchase(pending.toy)
    }

    return { coins: rewards.coins, gems: rewards.gems, toyId }
  }

  function resetDailyQuestsIfNeeded(): void {
    const today = todayKey()
    if (questProgress.value.lastDailyReset === today) return
    questProgress.value = {
      dailyClicks: 0,
      dailyMerges: 0,
      dailyPvpWins: 0,
      dailyChests: 0,
      claimedDaily: [],
      lastDailyReset: today,
    }
  }

  function claimQuestReward(questId: QuestId): boolean {
    resetDailyQuestsIfNeeded()
    if (questProgress.value.claimedDaily.includes(questId)) return false

    const progress = {
      daily_clicks: questProgress.value.dailyClicks,
      daily_merges: questProgress.value.dailyMerges,
      daily_pvp_wins: questProgress.value.dailyPvpWins,
      daily_chests: questProgress.value.dailyChests,
    }[questId]

    const target = DAILY_QUEST_TARGETS[questId]
    if (progress < target) return false

    const reward = QUEST_REWARDS[questId]
    coins.value += reward.coins
    gems.value += reward.gems
    questProgress.value.claimedDaily.push(questId)

    return true
  }

  function toSave(): GameSave {
    return {
      coins: coins.value,
      gems: gems.value,
      board: board.value.map((t) => ({ ...t })),
      purchaseCounts: { ...purchaseCounts.value },
      totalClicks: totalClicks.value,
      totalMerges: totalMerges.value,
      pvpRating: pvpRating.value,
      pvpWins: pvpWins.value,
      pvpLosses: pvpLosses.value,
      pvpRank: pvpRank.value,
      teamInstanceIds: [...teamInstanceIds.value],
      questProgress: { ...questProgress.value },
      chestsOpened: chestsOpened.value,
      unlockedLevels: [...unlockedLevels.value],
      unlockedDefinitionIds: [...unlockedDefinitionIds.value],
      seenPvpSessionIds: [...seenPvpSessionIds.value],
    }
  }

  function loadSave(save: GameSave | (Omit<GameSave, 'board' | 'teamInstanceIds'> & { board?: unknown; teamSlotIndices?: number[]; teamInstanceIds?: string[]; lastPassiveTick?: number })): void {
    coins.value = save.coins
    gems.value = save.gems
    board.value = normalizeBoard(save.board as Parameters<typeof normalizeBoard>[0])
    purchaseCounts.value = { ...save.purchaseCounts }
    totalClicks.value = save.totalClicks
    totalMerges.value = save.totalMerges
    pvpRating.value = save.pvpRating
    pvpWins.value = save.pvpWins
    pvpLosses.value = save.pvpLosses
    pvpRank.value = save.pvpRank

    const legacyTeam = 'teamSlotIndices' in save ? save.teamSlotIndices : undefined
    if (save.teamInstanceIds?.length) {
      teamInstanceIds.value = save.teamInstanceIds.filter((id) => board.value.some((t) => t.instanceId === id))
    } else if (legacyTeam?.length) {
      teamInstanceIds.value = legacyTeam
        .map((index) => board.value[index]?.instanceId)
        .filter((id): id is string => Boolean(id))
    } else {
      teamInstanceIds.value = []
    }

    questProgress.value = {
      ...save.questProgress,
      claimedDaily: save.questProgress.claimedDaily ?? [],
    }
    chestsOpened.value = save.chestsOpened
    unlockedLevels.value = save.unlockedLevels?.length
      ? [...save.unlockedLevels]
      : [...new Set(board.value.map((toy) => toy.level))]
    unlockedDefinitionIds.value = save.unlockedDefinitionIds?.length
      ? [...save.unlockedDefinitionIds]
      : [STARTER_TOY_ID]
    for (const toy of board.value) {
      unlockDefinition(toy.definitionId)
    }
    seenPvpSessionIds.value = save.seenPvpSessionIds?.length ? [...save.seenPvpSessionIds] : []
    removeUnusableToys()
    resetDailyQuestsIfNeeded()
    updatePvpRank()
  }

  function hydrate(): void {
    loadSave(defaultSave())
  }

  return {
    coins,
    gems,
    board,
    purchaseCounts,
    totalClicks,
    totalMerges,
    pvpRating,
    pvpWins,
    pvpLosses,
    pvpRank,
    teamInstanceIds,
    questProgress,
    chestsOpened,
    unlockedLevels,
    unlockedDefinitionIds,
    seenPvpSessionIds,
    comboProgress,
    comboLevel,
    floatingCoins,
    activeToyCelebration,
    boardToys,
    maxBoardLevel,
    shopPurchaseLevel,
    shopAdGrantLevel,
    freeCharacterGrantLevel,
    comboMultiplier,
    dismissToyCelebration,
    isDefinitionUnlocked,
    registerToyClick,
    getToyClickReward,
    decayCombo,
    getPurchaseCost,
    canAddToy,
    canGrantFreeCharacter,
    beginPurchase,
    beginShopPurchase,
    beginShopAdGrant,
    beginFreeCharacterGrant,
    commitToyToBoard,
    finalizePurchase,
    buyToy,
    beginGrant,
    grantToy,
    grantRandomCommonToy,
    canMergeToys,
    mergeToys,
    moveToy,
    toggleTeamToy,
    getPvpTeamSlots,
    calcPvpTeamPower,
    markPvpSessionSeen,
    syncPvpDefense,
    addCoins,
    addGems,
    spendGems,
    recordPvpResult,
    recordPvpStats,
    openChest,
    resetDailyQuestsIfNeeded,
    claimQuestReward,
    toSave,
    loadSave,
    hydrate,
    catalog: TOY_CATALOG,
  }
})
