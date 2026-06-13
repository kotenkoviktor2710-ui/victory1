import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appTitle = env.VITE_APP_TITLE || 'Yandex Games Template'

  return {
    base:
      process.env.GITHUB_PAGES === 'true'
        ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'yandex-games-template'}/`
        : './',
    plugins: [
      vue(),
      {
        name: 'html-env',
        transformIndexHtml(html) {
          return html.replaceAll('%VITE_APP_TITLE%', appTitle)
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
