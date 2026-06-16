import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { adsPlaying } from '@/ads/ads'
import { gameplayPause, gameplayResume, getGameplayPauseDepth } from '@/yandex/sdk'
import { bindAdAudioLifecycle } from '@/audio/adAudio'
import { bindProgressLifecycle } from '@/yandex/progressLifecycle'
import { bindBrowserUiGuard } from '@/shared/utils/preventPullToRefresh'

bindBrowserUiGuard()
bindAdAudioLifecycle()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
bindProgressLifecycle()

document.addEventListener('visibilitychange', () => {
  if (document.hidden) gameplayPause()
  else gameplayResume()
})

window.addEventListener('ads:pause', () => gameplayPause())
window.addEventListener('ads:resume', () => gameplayResume())

if (import.meta.env.DEV) {
  Object.assign(window, {
    __getGameplayPauseDepth: getGameplayPauseDepth,
    __isAdsPlaying: () => adsPlaying(),
  })
}
