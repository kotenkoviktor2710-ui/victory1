const END_VIDEO_URL = '/end.mp4'
const END_TEXT = 'Доброе утро, Артем Воронов'

const FADE_TO_DARK_MS = 900
const FADE_FROM_DARK_MS = 800
const BLACKOUT_AFTER_VIDEO_MS = 1500
const TEXT_HOLD_MS = 4000
const VIDEO_FADE_MS = 800

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

/**
 * @param {HTMLElement} container
 * @param {number} durationMs
 */
function beginGameScreenFade(container, durationMs) {
  for (const selector of ['.novel']) {
    const element = container.querySelector(selector)
    if (!element) continue
    element.dataset.endSequenceSuppressed = 'true'
    element.style.setProperty('--end-screen-fade-ms', `${durationMs}ms`)
    element.classList.add('end-sequence-screen-fade')
  }
}

/**
 * @param {HTMLElement} container
 */
function startGameScreenFade(container) {
  for (const element of container.querySelectorAll('.end-sequence-screen-fade')) {
    element.classList.add('is-fading')
  }
}

/**
 * @param {HTMLElement} container
 */
function finalizeGameScreenHide(container) {
  for (const element of container.querySelectorAll('[data-end-sequence-suppressed]')) {
    element.style.visibility = 'hidden'
  }
}

/**
 * @param {HTMLElement} container
 */
function restoreGameScreen(container) {
  for (const element of container.querySelectorAll('[data-end-sequence-suppressed]')) {
    element.classList.remove('end-sequence-screen-fade', 'is-fading')
    element.style.removeProperty('--end-screen-fade-ms')
    element.style.removeProperty('visibility')
    delete element.dataset.endSequenceSuppressed
  }
}

/**
 * @param {HTMLElement} line
 */
function startGlitchLoop(line) {
  let rafId = 0
  let lastTick = 0

  const tick = (now) => {
    if (!line.isConnected) return

    if (now - lastTick > 48 + Math.random() * 90) {
      lastTick = now
      const burst = Math.random() < 0.42
      const intensity = burst ? 0.35 + Math.random() * 0.65 : Math.random() * 0.12
      line.style.setProperty('--end-glitch-opacity', String(intensity))
      line.style.setProperty('--end-glitch-shift', `${(Math.random() - 0.5) * 18}px`)
      line.style.setProperty('--end-glitch-skew', `${(Math.random() - 0.5) * 3}deg`)
    }

    rafId = window.requestAnimationFrame(tick)
  }

  rafId = window.requestAnimationFrame(tick)
  return () => window.cancelAnimationFrame(rafId)
}

/**
 * Финальная сцена: затемнение → видео → тёмное затемнение → глитч-надпись (без отдельного свечения).
 * @param {HTMLElement} container
 * @returns {Promise<void>}
 */
export function playEndSequence(container) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const fadeToDarkMs = reduced ? 400 : FADE_TO_DARK_MS
  const fadeFromDarkMs = reduced ? 300 : FADE_FROM_DARK_MS
  const textHoldMs = reduced ? 2400 : TEXT_HOLD_MS
  const videoFadeMs = reduced ? 200 : VIDEO_FADE_MS
  const blackoutMs = reduced ? 450 : BLACKOUT_AFTER_VIDEO_MS

  return new Promise((resolve) => {
    const root = document.createElement('div')
    root.className = 'end-sequence'
    root.setAttribute('role', 'presentation')

    const backdrop = document.createElement('div')
    backdrop.className = 'end-sequence__backdrop'
    backdrop.setAttribute('aria-hidden', 'true')

    const video = document.createElement('video')
    video.className = 'end-sequence__video'
    video.src = END_VIDEO_URL
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.preload = 'auto'
    video.muted = false

    const textStage = document.createElement('div')
    textStage.className = 'end-sequence__text-stage'
    textStage.hidden = true

    const scanlines = document.createElement('div')
    scanlines.className = 'end-sequence__scanlines'
    scanlines.setAttribute('aria-hidden', 'true')

    const glitchLine = document.createElement('p')
    glitchLine.className = 'end-sequence__glitch-line'
    glitchLine.setAttribute('data-text', END_TEXT)
    glitchLine.textContent = END_TEXT

    textStage.append(scanlines, glitchLine)
    root.append(backdrop, video, textStage)
    container.appendChild(root)

    let stopGlitch = () => {}
    let settled = false
    const safetyTimeout = window.setTimeout(() => finish(), 180_000)

    const finish = () => {
      if (settled) return
      settled = true
      window.clearTimeout(safetyTimeout)
      stopGlitch()
      restoreGameScreen(container)
      root.remove()
      resolve()
    }

    const showGlitchText = async () => {
      textStage.hidden = false
      void textStage.offsetWidth
      textStage.classList.add('is-visible')
      glitchLine.classList.add('is-glitching')
      stopGlitch = startGlitchLoop(glitchLine)
      await delay(textHoldMs)
      finish()
    }

    const revealVideo = async () => {
      video.classList.add('is-visible')
      await delay(fadeFromDarkMs)
    }

    const blackoutAfterVideo = async () => {
      video.classList.remove('is-visible')
      await delay(videoFadeMs)

      video.pause()
      video.removeAttribute('src')
      video.load()
      video.remove()

      await delay(blackoutMs)
      await showGlitchText()
    }

    const run = async () => {
      void video.load()

      beginGameScreenFade(container, fadeToDarkMs)
      backdrop.style.transitionDuration = `${fadeToDarkMs}ms`

      await delay(32)
      startGameScreenFade(container)
      backdrop.classList.add('is-visible')
      void backdrop.offsetWidth
      await delay(fadeToDarkMs)
      finalizeGameScreenHide(container)

      try {
        await video.play()
        await revealVideo()
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[end-sequence] video play failed', error)
        }
        await delay(blackoutMs)
        await showGlitchText()
        return
      }

      if (video.ended || video.currentTime >= video.duration - 0.05) {
        await blackoutAfterVideo()
        return
      }

      video.addEventListener(
        'ended',
        () => {
          void blackoutAfterVideo()
        },
        { once: true },
      )

      video.addEventListener(
        'error',
        () => {
          void showGlitchText()
        },
        { once: true },
      )
    }

    void run().catch(() => finish())
  })
}

export function preloadEndVideo() {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'video'
  link.href = END_VIDEO_URL
  document.head.appendChild(link)
}
