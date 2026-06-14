import { createRouter, createMemoryHistory } from 'vue-router'
import GameView from '../views/GameView.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'game',
      component: GameView,
    },
  ],
})

export default router
