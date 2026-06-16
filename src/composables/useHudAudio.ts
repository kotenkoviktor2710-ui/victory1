import { ref, watch } from 'vue'

import {
  pauseBackgroundMusic,
  resumeBackgroundMusic,
  setBackgroundMusicEnabled,
} from '@/audio/bgMusic'

const soundOn = ref(true)
const musicOn = ref(true)

let audioHooksReady = false

function ensureAudioHooks(): void {
  if (audioHooksReady || typeof window === 'undefined') return
  audioHooksReady = true

  watch(
    musicOn,
    (enabled) => {
      setBackgroundMusicEnabled(enabled)
    },
    { immediate: true },
  )

  window.addEventListener('ads:pause', pauseBackgroundMusic)
  window.addEventListener('ads:resume', () => {
    if (musicOn.value) {
      resumeBackgroundMusic()
    }
  })
}

export function useHudAudio() {
  ensureAudioHooks()

  function toggleSound(): void {
    soundOn.value = !soundOn.value
  }

  function toggleMusic(): void {
    musicOn.value = !musicOn.value
  }

  return {
    soundOn,
    musicOn,
    toggleSound,
    toggleMusic,
  }
}
