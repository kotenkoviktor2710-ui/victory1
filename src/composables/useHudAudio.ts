import { ref } from 'vue'

const soundOn = ref(true)
const musicOn = ref(true)

export function useHudAudio() {
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
