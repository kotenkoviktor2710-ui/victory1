import { t } from "./i18n.js";
import { setAdBreakBlocking } from "@/ads/ads";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const CLICK_AD_ACTIONS = new Set([
  "new-game",
  "continue",
  "exit",
  "close-overlay",
  "close-game-overlay",
  "story",
  "settings",
  "settings-quick",
  "game-menu",
  "game-settings",
]);

/**
 * @typedef {object} AdGameContext
 * @property {string|null} phase
 * @property {boolean} gameOverlay
 * @property {boolean} menuOverlay
 * @property {boolean} choicesVisible
 * @property {boolean} textAnimating
 * @property {boolean} scanHelpOpen
 * @property {boolean} overlayClosing
 */

export class AdManager {
  /**
   * @param {import("./yandex-sdk.js").YandexSDK} sdk
   * @param {object} [options]
   * @param {number} [options.intervalMs] — интервал таймерной рекламы
   * @param {number} [options.warningMs] — предупреждение перед таймерной рекламой
   * @param {number} [options.minGapMs] — минимальный интервал между любыми показами
   * @param {() => AdGameContext} [options.getContext]
   */
  constructor(
    sdk,
    {
      intervalMs = 120_000,
      warningMs = 3_000,
      minGapMs = 45_000,
      getContext = () => ({}),
    } = {},
  ) {
    this.sdk = sdk;
    this.intervalMs = intervalMs;
    this.warningMs = warningMs;
    this.minGapMs = minGapMs;
    this.getContext = getContext;

    this._started = false;
    this._blocking = false;
    this._paused = false;
    this._elapsedGameplayMs = 0;
    this._lastAdAt = 0;
    this._tickId = null;
    this._countdownEl = null;
    this._countdownTimerEl = null;
    this._countdownAbort = null;

    this._onVisibilityChange = () => {
      if (document.hidden) {
        this._clearCountdown();
      }
    };
  }

  start() {
    if (this._started) return;
    this._started = true;
    this._ensureCountdownOverlay();
    document.addEventListener("visibilitychange", this._onVisibilityChange);
    this._tickId = window.setInterval(() => this._onTick(), 1000);
  }

  stop() {
    if (!this._started) return;
    this._started = false;
    if (this._tickId !== null) {
      window.clearInterval(this._tickId);
      this._tickId = null;
    }
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    this._clearCountdown();
    this._hideCountdownOverlay();
  }

  isBlocking() {
    return this._blocking;
  }

  pause() {
    this._paused = true;
    this._clearCountdown();
  }

  resume() {
    this._paused = false;
  }

  /**
   * @param {string} action
   */
  onAction(action) {
    if (!CLICK_AD_ACTIONS.has(action)) return;

    const ctx = this._getContext();
    const menuOnlyActions = new Set(["settings", "settings-quick", "story", "close-overlay"]);
    if (ctx.phase === "menu" && menuOnlyActions.has(action)) {
      return;
    }

    void this._showClickAd();
  }

  onChoiceMade() {
    void this._showClickAd();
  }

  _getContext() {
    const ctx = this.getContext();
    return {
      phase: ctx.phase ?? null,
      gameOverlay: Boolean(ctx.gameOverlay),
      menuOverlay: Boolean(ctx.menuOverlay),
      choicesVisible: Boolean(ctx.choicesVisible),
      textAnimating: Boolean(ctx.textAnimating),
      scanHelpOpen: Boolean(ctx.scanHelpOpen),
      overlayClosing: Boolean(ctx.overlayClosing),
    };
  }

  _canShowAd({ requireGameplay = false } = {}) {
    if (this._blocking || this._paused || document.hidden) return false;
    if (Date.now() - this._lastAdAt < this.minGapMs) return false;

    const ctx = this._getContext();
    if (ctx.textAnimating || ctx.overlayClosing || ctx.scanHelpOpen) return false;
    if (ctx.choicesVisible) return false;

    if (requireGameplay) {
      return ctx.phase === "playing" && !ctx.gameOverlay && !ctx.menuOverlay;
    }

    return true;
  }

  _shouldResumeGameplay() {
    const ctx = this._getContext();
    return ctx.phase === "playing" && !ctx.gameOverlay && !ctx.menuOverlay;
  }

  _markAdShown() {
    this._lastAdAt = Date.now();
    this._elapsedGameplayMs = 0;
  }

  _onTick() {
    if (!this._started || this._blocking || this._paused || document.hidden) return;

    const ctx = this._getContext();
    const inGameplay =
      ctx.phase === "playing" && !ctx.gameOverlay && !ctx.menuOverlay && !ctx.choicesVisible;

    if (!inGameplay || ctx.textAnimating || ctx.scanHelpOpen) return;

    this._elapsedGameplayMs += 1000;

    if (this._elapsedGameplayMs >= this.intervalMs) {
      void this._showTimerAd();
    }
  }

  async _showClickAd() {
    if (!this._canShowAd()) return;

    this._blocking = true;

    try {
      await this.sdk.showFullscreenAdv({
        resumeGameplay: this._shouldResumeGameplay(),
      });
      this._markAdShown();
    } finally {
      this._blocking = false;
    }
  }

  async _showTimerAd() {
    if (!this._canShowAd({ requireGameplay: true })) return;

    this._blocking = true;
    this.sdk.gameplayStop();

    try {
      const completed = await this._runCountdown();
      if (!completed) return;

      await this.sdk.showFullscreenAdv({
        resumeGameplay: this._shouldResumeGameplay(),
      });
      this._markAdShown();
    } finally {
      this._blocking = false;
      this._hideCountdownOverlay();
    }
  }

  _ensureCountdownOverlay() {
    if (this._countdownEl) return;

    const root = document.createElement("div");
    root.id = "ad-countdown";
    root.className = "ad-countdown";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-live", "polite");
    root.innerHTML = `
      <div class="ad-countdown__panel">
        <p class="ad-countdown__title">${escapeHtml(t("ad.countdownTitle"))}</p>
        <p class="ad-countdown__timer" aria-hidden="true">3</p>
        <p class="ad-countdown__hint">${escapeHtml(t("ad.countdownHint"))}</p>
      </div>
    `;

    document.body.appendChild(root);
    this._countdownEl = root;
    this._countdownTimerEl = root.querySelector(".ad-countdown__timer");
  }

  _showCountdownOverlay(seconds) {
    this._ensureCountdownOverlay();
    if (!this._countdownEl || !this._countdownTimerEl) return;

    this._countdownTimerEl.textContent = String(seconds);
    this._countdownEl.hidden = false;
    document.body.classList.add("ad-countdown-active");
    setAdBreakBlocking(true);
  }

  _hideCountdownOverlay() {
    if (!this._countdownEl) return;
    this._countdownEl.hidden = true;
    document.body.classList.remove("ad-countdown-active");
    setAdBreakBlocking(false);
  }

  _clearCountdown() {
    if (this._countdownAbort) {
      this._countdownAbort.aborted = true;
      this._countdownAbort = null;
    }
    this._hideCountdownOverlay();
  }

  _runCountdown() {
    this._clearCountdown();

    const totalMs = this.warningMs;
    const seconds = Math.max(1, Math.ceil(totalMs / 1000));
    const abort = { aborted: false };
    this._countdownAbort = abort;

    return new Promise((resolve) => {
      let remaining = seconds;
      this._showCountdownOverlay(remaining);

      const tick = () => {
        if (abort.aborted || document.hidden) {
          this._countdownAbort = null;
          resolve(false);
          return;
        }

        remaining -= 1;

        if (remaining <= 0) {
          this._countdownAbort = null;
          this._hideCountdownOverlay();
          resolve(true);
          return;
        }

        if (this._countdownTimerEl) {
          this._countdownTimerEl.textContent = String(remaining);
        }

        window.setTimeout(tick, 1000);
      };

      window.setTimeout(tick, 1000);
    });
  }
}
