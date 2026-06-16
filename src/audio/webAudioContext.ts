let audioContext: AudioContext | null = null
let userGestureUnlocked = false
const gestureListeners = new Set<() => void>()

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioCtx) return null

  if (!audioContext) {
    audioContext = new AudioCtx()
  }

  return audioContext
}

export function onAudioUserGesture(listener: () => void): void {
  gestureListeners.add(listener)
  if (userGestureUnlocked) {
    listener()
  }
}

export function hasAudioUserGesture(): boolean {
  return userGestureUnlocked
}

/** Синхронно в обработчике жеста: resume AudioContext. */
export function unlockAudioOnUserGesture(): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    void ctx.resume()
  }

  if (!userGestureUnlocked) {
    userGestureUnlocked = true
    for (const listener of gestureListeners) {
      listener()
    }
  }
}
