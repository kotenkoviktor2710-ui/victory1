import { assetUrl } from '@/shared/utils/assetUrl'
import {
  getSharedAudioContext,
  hasAudioUserGesture,
  onAudioUserGesture,
} from '@/audio/webAudioContext'

const BG_MUSIC_URL = assetUrl('audio/bg.mp3')
const BG_MUSIC_VOLUME = 0.26

let bgBuffer: AudioBuffer | null = null
let loadPromise: Promise<AudioBuffer | null> | null = null

let musicGain: GainNode | null = null
let musicSource: AudioBufferSourceNode | null = null
let musicEnabled = true
let musicPausedByAd = false

async function ensureBgBuffer(): Promise<AudioBuffer | null> {
  if (bgBuffer) return bgBuffer
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const ctx = getSharedAudioContext()
    if (!ctx) return null

    try {
      const response = await fetch(BG_MUSIC_URL)
      if (!response.ok) return null

      const data = await response.arrayBuffer()
      bgBuffer = await ctx.decodeAudioData(data)
      return bgBuffer
    } catch {
      return null
    }
  })()

  return loadPromise
}

export function preloadBackgroundMusic(): void {
  void ensureBgBuffer()
}

function getMusicGain(ctx: AudioContext): GainNode {
  if (!musicGain) {
    musicGain = ctx.createGain()
    musicGain.gain.value = musicEnabled && !musicPausedByAd ? BG_MUSIC_VOLUME : 0
    musicGain.connect(ctx.destination)
  }
  return musicGain
}

function stopMusicSource(): void {
  if (!musicSource) return

  try {
    musicSource.stop()
  } catch {
    // already stopped
  }

  musicSource.disconnect()
  musicSource = null
}

function startMusicPlayback(): void {
  const ctx = getSharedAudioContext()
  if (!ctx || !bgBuffer || !musicEnabled || musicPausedByAd) return

  stopMusicSource()

  const source = ctx.createBufferSource()
  source.buffer = bgBuffer
  source.loop = true
  source.connect(getMusicGain(ctx))
  source.start(0)
  musicSource = source
}

export function tryStartBackgroundMusic(): void {
  if (!musicEnabled || musicPausedByAd) return

  void ensureBgBuffer().then((buffer) => {
    if (!buffer) return
    const ctx = getSharedAudioContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => startMusicPlayback())
      return
    }

    startMusicPlayback()
  })
}

export function setBackgroundMusicEnabled(enabled: boolean): void {
  musicEnabled = enabled

  if (!enabled) {
    if (musicGain) {
      musicGain.gain.value = 0
    }
    stopMusicSource()
    return
  }

  if (musicPausedByAd) return

  if (musicGain) {
    musicGain.gain.value = BG_MUSIC_VOLUME
  }

  if (hasAudioUserGesture()) {
    tryStartBackgroundMusic()
  }
}

export function pauseBackgroundMusic(): void {
  musicPausedByAd = true
  if (musicGain) {
    musicGain.gain.value = 0
  }
}

export function resumeBackgroundMusic(): void {
  musicPausedByAd = false
  if (!musicEnabled) return

  if (musicSource && musicGain) {
    musicGain.gain.value = BG_MUSIC_VOLUME
    return
  }

  tryStartBackgroundMusic()
}

onAudioUserGesture(() => {
  preloadBackgroundMusic()
  tryStartBackgroundMusic()
})
