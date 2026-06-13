import { createRouter, createMemoryHistory } from 'vue-router'
import NovelView from '../views/NovelView.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'novel',
      component: NovelView,
    },
  ],
})

export default router
