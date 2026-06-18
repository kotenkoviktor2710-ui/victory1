import { spawn } from 'node:child_process'
import { mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'promo')
const BASE_URL = process.env.PROMO_URL ?? 'http://127.0.0.1:5173'
const VIDEO_MS = 20_000

const MOBILE_9X16_WIDTH = 390

const FORMATS = [
  { id: '16x9', width: 1920, height: 1080 },
  {
    id: '9x16',
    width: MOBILE_9X16_WIDTH,
    height: Math.round((MOBILE_9X16_WIDTH * 16) / 9),
    isMobile: true,
  },
]

const ONLY_FORMAT = process.env.PROMO_FORMAT ?? ''
const ONLY_SCREENSHOTS = process.env.PROMO_ONLY === 'screenshots'

function getFormats() {
  if (!ONLY_FORMAT) return FORMATS
  const format = FORMATS.find((item) => item.id === ONLY_FORMAT)
  if (!format) throw new Error(`Unknown PROMO_FORMAT: ${ONLY_FORMAT}`)
  return [format]
}

const LOCALES = [
  { id: 'ru', locale: 'ru-RU' },
  { id: 'en', locale: 'en-US' },
]

function buildPromoSave({ unlockedLevelCount = 20 } = {}) {
  const today = new Date().toISOString().slice(0, 10)
  const board = [
    { instanceId: 'promo-1', definitionId: 'huggy', level: 6, x: 24, y: 36 },
    { instanceId: 'promo-2', definitionId: 'catnap', level: 5, x: 44, y: 28 },
    { instanceId: 'promo-3', definitionId: 'boxy', level: 7, x: 62, y: 42 },
    { instanceId: 'promo-4', definitionId: 'bunzo', level: 4, x: 34, y: 58 },
    { instanceId: 'promo-5', definitionId: 'huggy', level: 5, x: 52, y: 62 },
    { instanceId: 'promo-6', definitionId: 'catnap', level: 8, x: 70, y: 34 },
    { instanceId: 'promo-7', definitionId: 'boxy', level: 3, x: 18, y: 52 },
    { instanceId: 'promo-8', definitionId: 'bunzo', level: 6, x: 56, y: 48 },
  ]

  return {
    coins: 18_420,
    gems: 36,
    board,
    purchaseCounts: { huggy: 14, catnap: 10, boxy: 6, bunzo: 4 },
    totalClicks: 8420,
    totalMerges: 156,
    pvpRating: 1280,
    pvpWins: 24,
    pvpLosses: 11,
    pvpRank: 'gold',
    teamInstanceIds: ['promo-1', 'promo-3', 'promo-6'],
    questProgress: {
      dailyClicks: 120,
      dailyMerges: 8,
      dailyPvpWins: 2,
      dailyChests: 1,
      claimedDaily: [],
      lastDailyReset: today,
    },
    chestsOpened: 5,
    unlockedLevels: Array.from({ length: unlockedLevelCount }, (_, i) => i + 1),
    unlockedDefinitionIds: ['huggy', 'catnap', 'boxy', 'bunzo'],
    seenPvpSessionIds: [],
    nextAttackAvailableAt: 0,
    rewardedAdViews: 3,
    adMilestonePendingToys: 0,
  }
}

async function convertToMp4(webmPath, mp4Path) {
  return new Promise((resolve) => {
    const ffmpeg = spawn(
      'ffmpeg',
      ['-y', '-i', webmPath, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4Path],
      { stdio: 'ignore' },
    )
    ffmpeg.on('close', (code) => resolve(code === 0))
    ffmpeg.on('error', () => resolve(false))
  })
}

async function getGameStoreHandle(page) {
  return page.evaluateHandle(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const provides = app?._context?.provides ?? {}
    const piniaSymbol = Object.getOwnPropertySymbols(provides).find(
      (symbol) => symbol.toString() === 'Symbol(pinia)',
    )
    const pinia = piniaSymbol ? provides[piniaSymbol] : null
    return pinia?._s?.get('game') ?? null
  })
}

async function seedPromoState(page, options) {
  const save = buildPromoSave(options)
  await page.evaluate((saveData) => {
    const app = document.querySelector('#app')?.__vue_app__
    const provides = app?._context?.provides ?? {}
    const piniaSymbol = Object.getOwnPropertySymbols(provides).find(
      (symbol) => symbol.toString() === 'Symbol(pinia)',
    )
    const pinia = piniaSymbol ? provides[piniaSymbol] : null
    const game = pinia?._s?.get('game')
    if (!game?.loadSave) throw new Error('game store not found')
    game.loadSave(saveData)
    game.comboProgress = 72
    game.comboLevel = 4
  }, save)
}

async function waitForMainScreen(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForSelector('.floor-arena', { timeout: 45_000 })
  await page.waitForTimeout(900)
}

async function dismissBlockingModals(page) {
  for (let i = 0; i < 8; i += 1) {
    const closed = await page.evaluate(() => {
      const selectors = [
        '.game-modal__close',
        '.game-modal-picker__actions .game-sketch-btn--red',
        '.toy-acquire__btn',
        '.pvp-reward__skip',
        '.ad-break__btn',
        '.ad-unavailable__btn',
      ]
      for (const selector of selectors) {
        const btn = document.querySelector(selector)
        if (btn instanceof HTMLElement && btn.offsetParent !== null) {
          btn.click()
          return true
        }
      }
      return false
    })
    if (!closed) break
    await page.waitForTimeout(350)
  }
}

async function captureMainScreen(page) {
  await seedPromoState(page)
  await page.waitForTimeout(500)
  await dismissBlockingModals(page)
  await page.waitForTimeout(300)
}

async function openCollection(page) {
  await captureMainScreen(page)
  await page.locator('.game-hud-menu-btn--purple').click()
  await page.waitForSelector('.collection-grid', { timeout: 10_000 })
  await page.waitForTimeout(500)
  await page.locator('.collection-card:not(.collection-card--locked)').first().waitFor({
    state: 'visible',
    timeout: 10_000,
  })
}

async function startBattle(page) {
  await captureMainScreen(page)
  const attackBtn = page.locator('.bottom-bar__attack:not([disabled])')
  await attackBtn.click({ timeout: 10_000 })
  await page.waitForSelector('.game-modal-picker__actions .game-sketch-btn--green', {
    timeout: 10_000,
  })
  await page.locator('.game-modal-picker__actions .game-sketch-btn--green').click()
  await page.waitForSelector('.battle-screen', { timeout: 15_000 })
  await page.waitForTimeout(1800)
}

async function openNewCharacterModal(page) {
  await seedPromoState(page, { unlockedLevelCount: 19 })
  await page.waitForTimeout(400)
  await page.evaluate(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const provides = app?._context?.provides ?? {}
    const piniaSymbol = Object.getOwnPropertySymbols(provides).find(
      (symbol) => symbol.toString() === 'Symbol(pinia)',
    )
    const pinia = piniaSymbol ? provides[piniaSymbol] : null
    const game = pinia?._s?.get('game')
    if (!game?.grantToy) throw new Error('game store not found')
    game.grantToy('huggy', 20)
  })
  await page.waitForSelector('.toy-acquire-overlay', { timeout: 10_000 })
  await page.waitForTimeout(700)
}

async function simulateMainGameplay(page, durationMs) {
  const endAt = Date.now() + durationMs

  while (Date.now() < endAt) {
    await dismissBlockingModals(page)

    const field = page.locator('.floor-arena__field')
    if (await field.count()) {
      const box = await field.boundingBox()
      if (box) {
        const x = box.x + box.width * (0.35 + Math.random() * 0.3)
        const y = box.y + box.height * (0.35 + Math.random() * 0.3)
        await page.mouse.click(x, y)
      }
    }

    const toys = page.locator('.floor-arena__toy')
    const count = await toys.count()
    if (count > 0) {
      try {
        await toys.nth(Math.floor(Math.random() * count)).click({ timeout: 800 })
      } catch {
        /* ignore */
      }
    }

    if (Math.random() < 0.1) {
      const shop = page.locator('.game-side-card').first()
      if (await shop.isVisible()) {
        try {
          await shop.click({ timeout: 500 })
        } catch {
          /* ignore */
        }
      }
    }

    await page.waitForTimeout(110)
  }
}

async function createContext(browser, localeConfig, format) {
  const viewport = { width: format.width, height: format.height }
  const context = await browser.newContext({
    locale: localeConfig.locale,
    viewport,
    deviceScaleFactor: 1,
    isMobile: format.isMobile === true,
    hasTouch: format.isMobile === true,
  })
  await context.addInitScript(() => {
    localStorage.clear()
  })
  return context
}

async function captureScreensForLocale(browser, localeConfig, format) {
  const localeDir = path.join(OUT_DIR, localeConfig.id, format.id)
  await mkdir(localeDir, { recursive: true })

  const shots = [
    {
      name: 'main',
      setup: async (page) => {
        await waitForMainScreen(page)
        await captureMainScreen(page)
      },
    },
    {
      name: 'battle',
      setup: async (page) => {
        await waitForMainScreen(page)
        await startBattle(page)
      },
    },
    {
      name: 'collection',
      setup: async (page) => {
        await waitForMainScreen(page)
        await openCollection(page)
      },
    },
    {
      name: 'new-character',
      setup: async (page) => {
        await waitForMainScreen(page)
        await openNewCharacterModal(page)
      },
    },
  ]

  for (const shot of shots) {
    const context = await createContext(browser, localeConfig, format)
    const page = await context.newPage()
    try {
      await shot.setup(page)
      const filePath = path.join(localeDir, `${shot.name}.png`)
      await page.screenshot({ path: filePath, type: 'png' })
      console.log(`✓ ${localeConfig.id}/${format.id}/${shot.name}.png`)
    } finally {
      await page.close()
      await context.close()
    }
  }
}

async function captureVideoForLocale(browser, localeConfig, format) {
  const videoDir = path.join(OUT_DIR, '_tmp-video')
  await mkdir(videoDir, { recursive: true })

  const viewport = { width: format.width, height: format.height }
  const context = await browser.newContext({
    locale: localeConfig.locale,
    viewport,
    deviceScaleFactor: 1,
    isMobile: format.isMobile === true,
    hasTouch: format.isMobile === true,
    recordVideo: {
      dir: videoDir,
      size: viewport,
    },
  })

  await context.addInitScript(() => {
    localStorage.clear()
  })

  const page = await context.newPage()
  await waitForMainScreen(page)
  await captureMainScreen(page)
  await simulateMainGameplay(page, VIDEO_MS)
  await page.close()

  const webmPath = path.join(OUT_DIR, localeConfig.id, format.id, 'gameplay.webm')
  await mkdir(path.dirname(webmPath), { recursive: true })

  const video = page.video()
  if (video) {
    await video.saveAs(webmPath)
  }

  await context.close()

  const mp4Path = path.join(OUT_DIR, localeConfig.id, format.id, 'gameplay.mp4')
  const converted = await convertToMp4(webmPath, mp4Path)
  if (converted) {
    await rm(webmPath, { force: true })
    console.log(`✓ ${localeConfig.id}/${format.id}/gameplay.mp4`)
    return mp4Path
  }

  console.log(`✓ ${localeConfig.id}/${format.id}/gameplay.webm`)
  return webmPath
}

async function main() {
  const formats = getFormats()

  if (!ONLY_FORMAT && !ONLY_SCREENSHOTS) {
    await rm(OUT_DIR, { recursive: true, force: true })
  }
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })

  try {
    for (const localeConfig of LOCALES) {
      for (const format of formats) {
        await captureScreensForLocale(browser, localeConfig, format)
        if (!ONLY_SCREENSHOTS) {
          await captureVideoForLocale(browser, localeConfig, format)
        }
      }
    }
  } finally {
    await browser.close()
    await rm(path.join(OUT_DIR, '_tmp-video'), { recursive: true, force: true })
  }

  console.log('\nPromo assets saved to:', OUT_DIR)
  for (const locale of LOCALES) {
    for (const format of formats) {
      const dir = path.join(OUT_DIR, locale.id, format.id)
      const files = (await readdir(dir)).sort()
      for (const file of files) {
        console.log(` - ${locale.id}/${format.id}/${file}`)
      }
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
