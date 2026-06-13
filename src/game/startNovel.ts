import { initI18n } from '@/game/i18n.js'

type BootstrapNovel = (container: HTMLElement) => Promise<void>

let bootstrapPromise: Promise<BootstrapNovel> | null = null

async function loadBootstrap(): Promise<BootstrapNovel> {
  const module = await import('@/game/app.js')
  return module.bootstrapNovel as BootstrapNovel
}

/** Загрузка UI-словаря — до LoadingAPI.ready(). */
export async function prepareNovelBoot(): Promise<void> {
  await initI18n()
}

/** Запуск новеллы в контейнере после markAppReady(). */
export async function startNovel(container: HTMLElement): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = loadBootstrap()
  }

  const bootstrapNovel = await bootstrapPromise
  await bootstrapNovel(container)
}
