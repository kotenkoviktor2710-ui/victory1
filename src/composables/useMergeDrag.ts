import { onUnmounted, ref } from 'vue'

const DRAG_THRESHOLD_PX = 10
const MERGE_SNAP_PX = 160

export interface DragGhost {
  x: number
  y: number
  image: string
  level: number
}

export function useMergeDrag(options: {
  canMerge: (fromId: string, toId: string) => boolean
  onMerge: (fromId: string, toId: string) => string | null
  onMove?: (fromId: string, clientX: number, clientY: number) => void
}) {
  const dragFromId = ref<string | null>(null)
  const dragOverId = ref<string | null>(null)
  const isDragging = ref(false)
  const ghost = ref<DragGhost | null>(null)
  const lastMergedId = ref<string | null>(null)

  const toyElements = new Map<string, HTMLElement>()

  let startX = 0
  let startY = 0
  let activePointerId: number | null = null
  let didDrag = false
  let ghostImage = ''
  let ghostLevel = 1
  let mergeFlashTimer = 0

  function setToyRef(el: Element | null, instanceId: string): void {
    if (el) toyElements.set(instanceId, el as HTMLElement)
    else toyElements.delete(instanceId)
  }

  function idAt(x: number, y: number, ignoreId?: string): string | null {
    for (const [id, el] of toyElements) {
      if (id === ignoreId) continue
      const rect = el.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return id
      }
    }

    const hit = document.elementFromPoint(x, y)
    const toyEl = hit?.closest('[data-toy-id]') as HTMLElement | null
    if (toyEl?.dataset.toyId && toyEl.dataset.toyId !== ignoreId) {
      return toyEl.dataset.toyId
    }

    return null
  }

  function resolveDropId(x: number, y: number, fromId: string): string | null {
    const direct = idAt(x, y, fromId)
    if (direct && direct !== fromId && options.canMerge(fromId, direct)) {
      return direct
    }

    if (
      dragOverId.value &&
      dragOverId.value !== fromId &&
      options.canMerge(fromId, dragOverId.value)
    ) {
      return dragOverId.value
    }

    let best: { id: string; distance: number } | null = null
    for (const [id, el] of toyElements) {
      if (id === fromId || !options.canMerge(fromId, id)) continue
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const distance = Math.hypot(x - cx, y - cy)
      if (!best || distance < best.distance) {
        best = { id, distance }
      }
    }

    if (best && best.distance < MERGE_SNAP_PX) return best.id
    return null
  }

  function flashMerge(id: string): void {
    lastMergedId.value = id
    window.clearTimeout(mergeFlashTimer)
    mergeFlashTimer = window.setTimeout(() => {
      lastMergedId.value = null
    }, 520)
  }

  function reset(): void {
    dragFromId.value = null
    dragOverId.value = null
    isDragging.value = false
    ghost.value = null
    activePointerId = null
    didDrag = false
    ghostImage = ''
    ghostLevel = 1
  }

  function onPointerDown(
    instanceId: string,
    event: PointerEvent,
    image: string,
    level: number,
  ): void {
    if (!event.isPrimary) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    activePointerId = event.pointerId
    dragFromId.value = instanceId
    startX = event.clientX
    startY = event.clientY
    didDrag = false
    ghostImage = image
    ghostLevel = level
    ghost.value = { x: event.clientX, y: event.clientY, image, level }

    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    event.preventDefault()
    event.stopPropagation()
  }

  function onPointerMove(event: PointerEvent): void {
    if (activePointerId !== event.pointerId || dragFromId.value === null) return

    const distance = Math.hypot(event.clientX - startX, event.clientY - startY)
    if (!isDragging.value && distance < DRAG_THRESHOLD_PX) return

    isDragging.value = true
    didDrag = true
    ghost.value = { x: event.clientX, y: event.clientY, image: ghostImage, level: ghostLevel }
    dragOverId.value = idAt(event.clientX, event.clientY, dragFromId.value ?? undefined)
    options.onMove?.(dragFromId.value, event.clientX, event.clientY)
  }

  function onPointerUp(event: PointerEvent): boolean {
    if (activePointerId !== event.pointerId) return false

    const fromId = dragFromId.value
    let merged = false

    if (isDragging.value && fromId) {
      const toId = resolveDropId(event.clientX, event.clientY, fromId)
      const mergedId = toId ? options.onMerge(fromId, toId) : null
      if (mergedId) {
        flashMerge(mergedId)
        merged = true
      } else if (!merged) {
        options.onMove?.(fromId, event.clientX, event.clientY)
      }
    }

    const wasDrag = didDrag
    reset()
    return wasDrag || merged
  }

  function onPointerCancel(event: PointerEvent): void {
    if (activePointerId === event.pointerId) reset()
  }

  function canDropAt(instanceId: string): boolean {
    const fromId = dragFromId.value
    if (!fromId || !isDragging.value) return false
    return fromId !== instanceId && options.canMerge(fromId, instanceId)
  }

  onUnmounted(() => {
    window.clearTimeout(mergeFlashTimer)
    reset()
  })

  return {
    dragFromId,
    dragOverId,
    isDragging,
    ghost,
    lastMergedId,
    setToyRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    canDropAt,
  }
}
