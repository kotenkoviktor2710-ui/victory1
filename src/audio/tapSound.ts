import { assetUrl } from '@/shared/utils/assetUrl'
import { isAdAudioMuted } from '@/audio/adAudio'
import {
  getSharedAudioContext,
  unlockAudioOnUserGesture as unlockSharedAudioOnUserGesture,
} from '@/audio/webAudioContext'

export function unlockAudioOnUserGesture(): void {
  unlockSharedAudioOnUserGesture()
  preloadTapSound()
}

const TAP_SOUND_URL = assetUrl('audio/tap.mp3')
const TAP_SOUND_VOLUME = 0.15

let tapBuffer: AudioBuffer | null = null
let loadPromise: Promise<AudioBuffer | null> | null = null

function playBuffer(ctx: AudioContext, buffer: AudioBuffer): void {
  const source = ctx.createBufferSource()
  source.buffer = buffer

  const gain = ctx.createGain()
  gain.gain.value = TAP_SOUND_VOLUME

  source.connect(gain)
  gain.connect(ctx.destination)
  source.start(0)
}

export async function ensureTapBuffer(): Promise<AudioBuffer | null> {
  if (tapBuffer) return tapBuffer
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const ctx = getSharedAudioContext()
    if (!ctx) return null

    try {
      const response = await fetch(TAP_SOUND_URL)
      if (!response.ok) return null

      const data = await response.arrayBuffer()
      tapBuffer = await ctx.decodeAudioData(data)
      return tapBuffer
    } catch {
      return null
    }
  })()

  return loadPromise
}

export function preloadTapSound(): void {
  void ensureTapBuffer()
}

/** Короткий tap через Web Audio API (без HTMLAudioElement). */
export function playToyTapSound(): void {
  if (isAdAudioMuted()) return

  const ctx = getSharedAudioContext()
  if (!ctx) return

  unlockAudioOnUserGesture()

  if (tapBuffer) {
    playBuffer(ctx, tapBuffer)
    return
  }

  void ensureTapBuffer().then((buffer) => {
    const activeCtx = getSharedAudioContext()
    if (!buffer || !activeCtx) return
    if (activeCtx.state === 'suspended') {
      void activeCtx.resume().then(() => playBuffer(activeCtx, buffer))
      return
    }
    playBuffer(activeCtx, buffer)
  })
}
