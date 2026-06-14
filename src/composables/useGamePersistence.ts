import { onMounted, onUnmounted } from 'vue'

import { COMBO_DECAY_INTERVAL_MS } from '@/domain/types/game'
import { useGameStore } from '@/stores/gameStore'
import { loadPlayerData, savePlayerData } from '@/yandex/playerStorage'
import type { GameSave } from '@/domain/types/game'

export const GAME_SAVE_KEY = 'merge_playtime_save'

export function useGamePersistence() {
  const game = useGameStore()
  let saveTimer: ReturnType<typeof setInterval> | null = null
  let comboTimer: ReturnType<typeof setInterval> | null = null

  async function load(): Promise<void> {
    const save = await loadPlayerData<GameSave>(GAME_SAVE_KEY)
    if (save) {
      game.loadSave(save)
    } else {
      game.hydrate()
    }
    game.resetDailyQuestsIfNeeded()
  }

  async function save(flush = false): Promise<void> {
    await savePlayerData(game.toSave(), GAME_SAVE_KEY, flush)
  }

  function startLoops(): void {
    comboTimer = setInterval(() => {
      game.decayCombo()
    }, COMBO_DECAY_INTERVAL_MS)

    saveTimer = setInterval(() => {
      void save()
    }, 15_000)
  }

  function stopLoops(): void {
    if (comboTimer) clearInterval(comboTimer)
    if (saveTimer) clearInterval(saveTimer)
  }

  onMounted(async () => {
    await load()
    startLoops()
  })

  onUnmounted(() => {
    stopLoops()
    void save(true)
  })

  return { load, save }
}
