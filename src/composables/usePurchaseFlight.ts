import { onUnmounted, ref } from 'vue'

import type { PlacedToy } from '@/domain/types/toy'

const FLIGHT_MS = 680

export interface PurchaseFlightView {
  id: number
  toy: PlacedToy
  x: number
  y: number
  scale: number
}

export function usePurchaseFlight(onComplete: (toy: PlacedToy) => void) {
  const flights = ref<PurchaseFlightView[]>([])

  let flightIdCounter = 0

  function finalizeAll(): void {
    for (const active of flights.value) {
      onComplete(active.toy)
    }
    flights.value = []
  }

  function launch(toy: PlacedToy, fromRect: DOMRect, fieldRect: DOMRect): void {
    const id = ++flightIdCounter
    const fromX = fromRect.left + fromRect.width / 2
    const fromY = fromRect.top + fromRect.height / 2
    const toX = fieldRect.left + (toy.x / 100) * fieldRect.width
    const toY = fieldRect.top + (toy.y / 100) * fieldRect.height
    const start = performance.now()

    flights.value = [...flights.value, { id, toy, x: fromX, y: fromY, scale: 0.3 }]

    function tick(now: number): void {
      const t = Math.min(1, (now - start) / FLIGHT_MS)
      const eased = 1 - Math.pow(1 - t, 3)
      const scale = 0.3 + eased * 0.7
      const arc = Math.sin(t * Math.PI) * 28
      const x = fromX + (toX - fromX) * eased
      const y = fromY + (toY - fromY) * eased - arc

      const idx = flights.value.findIndex((entry) => entry.id === id)
      if (idx === -1) return

      if (t < 1) {
        const next = [...flights.value]
        next[idx] = { id, toy, x, y, scale }
        flights.value = next
        requestAnimationFrame(tick)
        return
      }

      onComplete(toy)
      flights.value = flights.value.filter((entry) => entry.id !== id)
    }

    requestAnimationFrame(tick)
  }

  onUnmounted(finalizeAll)

  return { flights, launch }
}
