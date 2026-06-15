import { onMounted, onUnmounted } from 'vue'

import { AD_MILESTONE_REWARD_TOYS } from '@/domain/constants'
import { useGameStore } from '@/stores/gameStore'

export function useAdMilestone(
  getAnchorRect: () => DOMRect | null,
  grantWithFlight: (fromRect: DOMRect) => void,
) {
  const game = useGameStore()

  function onRewardedAd(): void {
    const milestoneReached = game.recordRewardedAdView()
    if (!milestoneReached) {
      game.flushAdMilestonePendingGrants()
      return
    }

    const anchor = getAnchorRect()
    if (anchor) {
      grantWithFlight(anchor)
      return
    }

    game.flushAdMilestonePendingGrants()
  }

  onMounted(() => {
    window.addEventListener('ads:rewarded', onRewardedAd)
    game.flushAdMilestonePendingGrants()
  })

  onUnmounted(() => {
    window.removeEventListener('ads:rewarded', onRewardedAd)
  })

  return {
    milestoneRewardCount: AD_MILESTONE_REWARD_TOYS,
  }
}
