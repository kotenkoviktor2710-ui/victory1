import { pauseBackgroundMusic, resumeBackgroundMusic } from '@/audio/bgMusic'
import { getSharedAudioContext } from '@/audio/webAudioContext'

let pauseDepth = 0
let bound = false

function muteAllAudio(): void {
  pauseBackgroundMusic()
  const ctx = getSharedAudioContext()
  if (ctx && ctx.state === 'running') {
    void ctx.suspend()
  }
}

function unmuteAllAudio(): void {
  const ctx = getSharedAudioContext()
  if (ctx && ctx.state === 'suspended') {
    void ctx.resume()
  }
  resumeBackgroundMusic()
}

function onAudioPause(): void {
  pauseDepth++
  if (pauseDepth === 1) {
    muteAllAudio()
  }
}

function onAudioResume(): void {
  if (pauseDepth <= 0) return
  pauseDepth--
  if (pauseDepth === 0) {
    unmuteAllAudio()
  }
}

function onVisibilityChange(): void {
  if (document.hidden) onAudioPause()
  else onAudioResume()
}

/** Подписка на паузу/возобновление звука при рекламе и смене вкладки. */
export function bindAdAudioLifecycle(): void {
  if (bound || typeof window === 'undefined') return
  bound = true

  window.addEventListener('ads:audio-pause', onAudioPause)
  window.addEventListener('ads:audio-resume', onAudioResume)
  document.addEventListener('visibilitychange', onVisibilityChange)
}

export function isAdAudioMuted(): boolean {
  return pauseDepth > 0
}
