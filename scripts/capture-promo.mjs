import { spawn } from 'node:child_process'
import { mkdir, readdir, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'promo')
const BASE_URL = process.env.PROMO_URL ?? 'http://127.0.0.1:5174'

const LOCALES = [
  { id: 'ru', locale: 'ru-RU' },
  { id: 'en', locale: 'en-US' },
]

const FORMATS = [
  { id: '16x9', width: 1920, height: 1080 },
  { id: '9x16', width: 1080, height: 1920 },
]

const VIDEO_MS = 20_000

function buildPromoSave() {
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
    unlockedLevels: Array.from({ length: 20 }, (_, i) => i + 1),
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

async function seedPromoState(page) {
  const save = buildPromoSave()
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

async function waitForGame(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForSelector('.floor-arena', { timeout: 45_000 })
  await page.waitForTimeout(900)
  await seedPromoState(page)
  await page.waitForTimeout(600)
  await dismissBlockingModals(page)
  await page.waitForTimeout(400)
}

async function dismissBlockingModals(page) {
  for (let i = 0; i < 6; i += 1) {
    const closed = await page.evaluate(() => {
      const selectors = [
        '.toy-acquire__btn',
        '.game-modal__close',
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

async function simulateGameplay(page, durationMs) {
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
      const index = Math.floor(Math.random() * count)
      try {
        await toys.nth(index).click({ timeout: 800 })
      } catch {
        /* ignore missed clicks during animation */
      }
    }

    if (Math.random() < 0.08) {
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

async function captureScreenshot(page, filePath) {
  await dismissBlockingModals(page)
  await page.screenshot({ path: filePath, type: 'png' })
}

async function captureVideo(browser, localeConfig, format, fileBase) {
  const videoDir = path.join(OUT_DIR, '_tmp-video')
  await mkdir(videoDir, { recursive: true })

  const context = await browser.newContext({
    locale: localeConfig.locale,
    viewport: { width: format.width, height: format.height },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: videoDir,
      size: { width: format.width, height: format.height },
    },
  })

  await context.addInitScript(() => {
    localStorage.clear()
  })

  const page = await context.newPage()
  await waitForGame(page)
  await simulateGameplay(page, VIDEO_MS)
  await page.close()

  const video = page.video()
  const webmPath = path.join(OUT_DIR, `${fileBase}.webm`)
  if (video) {
    await video.saveAs(webmPath)
  }

  await context.close()

  const mp4Path = path.join(OUT_DIR, `${fileBase}.mp4`)
  const converted = await convertToMp4(webmPath, mp4Path)
  if (converted) {
    await rm(webmPath, { force: true })
    return mp4Path
  }

  return webmPath
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })

  try {
    for (const localeConfig of LOCALES) {
      for (const format of FORMATS) {
        const context = await browser.newContext({
          locale: localeConfig.locale,
          viewport: { width: format.width, height: format.height },
          deviceScaleFactor: 1,
        })

        await context.addInitScript(() => {
          localStorage.clear()
        })

        const page = await context.newPage()
        await waitForGame(page)

        const screenshotPath = path.join(OUT_DIR, `screenshot-${localeConfig.id}-${format.id}.png`)
        await captureScreenshot(page, screenshotPath)
        console.log(`✓ screenshot ${localeConfig.id} ${format.id}`)

        await page.close()
        await context.close()
      }

      for (const format of FORMATS) {
        const fileBase = `gameplay-${localeConfig.id}-${format.id}`
        const videoPath = await captureVideo(browser, localeConfig, format, fileBase)
        console.log(`✓ video ${localeConfig.id} ${format.id} → ${path.basename(videoPath)}`)
      }
    }
  } finally {
    await browser.close()
    await rm(path.join(OUT_DIR, '_tmp-video'), { recursive: true, force: true })
  }

  const files = await readdir(OUT_DIR)
  console.log('\nPromo assets saved to:', OUT_DIR)
  for (const file of files.sort()) {
    console.log(' -', file)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
