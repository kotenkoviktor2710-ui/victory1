/**
 * Обёртка Yandex Games SDK с fallback для локальной разработки.
 */
import { pauseBackgroundMusic, resumeBackgroundMusic } from "./ui-audio.js";
function isLocalDev() {
  const host = location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

/** Техническое имя лидерборда в консоли Яндекс Игр */
export const LEADERBOARD_NAME = "trophy_rank";

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("SDK timeout")), ms);
    }),
  ]);
}

export class YandexSDK {
  constructor() {
    this.ysdk = null;
    this.player = null;
    this.isMock = false;
    this.reviewRequestedThisSession = false;
    this._overlayChain = Promise.resolve();
  }

  _enqueueOverlay(task) {
    const run = this._overlayChain.then(() => task());

    this._overlayChain = run
      .catch(() => {})
      .then(() => new Promise((resolve) => setTimeout(resolve, 450)));

    return run;
  }

  _finishOverlay({ resumeGameplay }) {
    resumeBackgroundMusic();
    if (resumeGameplay) {
      this.gameplayStart();
    }
  }

  _showFullscreenAdvImpl({ resumeGameplay = false } = {}) {
    return new Promise((resolve) => {
      if (!this.ysdk?.adv?.showFullscreenAdv) {
        resolve(false);
        return;
      }

      this.gameplayStop();
      pauseBackgroundMusic();

      this.ysdk.adv.showFullscreenAdv({
        callbacks: {
          onClose: (wasShown) => {
            this._finishOverlay({ resumeGameplay });
            resolve(wasShown);
          },
          onError: () => {
            this._finishOverlay({ resumeGameplay });
            resolve(false);
          },
        },
      });
    });
  }

  _showRewardedVideoImpl(onReward, { resumeGameplay = true } = {}) {
    return new Promise((resolve) => {
      if (!this.ysdk?.adv?.showRewardedVideo) {
        onReward?.();
        resolve(true);
        return;
      }

      this.gameplayStop();
      pauseBackgroundMusic();

      this.ysdk.adv.showRewardedVideo({
        callbacks: {
          onRewarded: () => {
            onReward?.();
          },
          onClose: (wasShown) => {
            this._finishOverlay({ resumeGameplay });
            resolve(wasShown);
          },
          onError: () => {
            this._finishOverlay({ resumeGameplay });
            resolve(false);
          },
        },
      });
    });
  }

  showFullscreenAdv(options = {}) {
    return this._enqueueOverlay(() => this._showFullscreenAdvImpl(options));
  }

  showRewardedVideo(onReward, options = {}) {
    return this._enqueueOverlay(() => this._showRewardedVideoImpl(onReward, options));
  }

  async tryRequestReview() {
    if (this.reviewRequestedThisSession) {
      return { shown: false, reason: "ALREADY_REQUESTED_SESSION" };
    }

    if (this.isMock || !this.ysdk?.feedback?.canReview || !this.ysdk?.feedback?.requestReview) {
      return { shown: false, reason: "UNAVAILABLE" };
    }

    return this._enqueueOverlay(async () => {
      try {
        const canReview = await this.ysdk.feedback.canReview();
        if (!canReview?.value) {
          return { shown: false, reason: canReview?.reason ?? "CANNOT_REVIEW" };
        }

        this.gameplayStop();
        pauseBackgroundMusic();

        const reviewResult = await this.ysdk.feedback.requestReview();
        this.reviewRequestedThisSession = true;

        resumeBackgroundMusic();

        return {
          shown: true,
          feedbackSent: Boolean(reviewResult?.feedbackSent),
        };
      } catch (err) {
        resumeBackgroundMusic();
        console.warn("[YandexSDK] requestReview:", err);
        return { shown: false, reason: "ERROR" };
      }
    });
  }

  async waitForSDK(timeoutMs = 8000) {
    const start = Date.now();
    while (typeof YaGames === "undefined" && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  enableMock(reason) {
    if (reason) console.info("[YandexSDK]", reason);
    this.isMock = true;
    this.player = new MockPlayer();
    return this;
  }

  async init() {
    // Вне iframe Яндекс Игр init() часто никогда не резолвится — не ждём бесконечно
    if (isLocalDev()) {
      return this.enableMock("Локальная разработка: mock-режим (SDK — на платформе Яндекс)");
    }

    await this.waitForSDK();

    if (typeof YaGames === "undefined") {
      return this.enableMock("YaGames не найден — mock-режим");
    }

    try {
      this.ysdk = await withTimeout(YaGames.init(), 8000);
      try {
        this.player = await withTimeout(this.ysdk.getPlayer({ scopes: false }), 5000);
      } catch {
        this.player = null;
      }
    } catch (err) {
      console.warn("[YandexSDK] init не завершён:", err.message);
      return this.enableMock("fallback на mock");
    }

    this.bindPlatformEvents();
    return this;
  }

  getLanguage() {
    const lang = this.ysdk?.environment?.i18n?.lang;
    return typeof lang === "string" && lang ? lang : "ru";
  }

  bindPlatformEvents() {
    if (!this.ysdk?.on || this._platformEventsBound) return;
    this._platformEventsBound = true;

    this._handlePlatformPause = () => {
      pauseBackgroundMusic();
      this.gameplayStop();
      window.dispatchEvent(new CustomEvent("yandex:pause"));
    };

    this._handlePlatformResume = () => {
      resumeBackgroundMusic();
      window.dispatchEvent(new CustomEvent("yandex:resume"));
    };

    this.ysdk.on("game_api_pause", this._handlePlatformPause);
    this.ysdk.on("game_api_resume", this._handlePlatformResume);
  }

  ready() {
    this.ysdk?.features?.LoadingAPI?.ready();
  }

  gameplayStart() {
    this.ysdk?.features?.GameplayAPI?.start();
  }

  gameplayStop() {
    this.ysdk?.features?.GameplayAPI?.stop();
  }

  async loadProgress() {
    if (!this.player?.getData) {
      return {
        bestScore: 0,
        coins: 0,
        gamesPlayed: 0,
        totalCorrect: 0,
        modeTrophies: null,
        unlockedEmojis: [],
      };
    }
    try {
      const data = await this.player.getData([
        "bestScore",
        "coins",
        "gamesPlayed",
        "totalCorrect",
        "modeTrophies",
        "unlockedEmojis",
      ]);
      let modeTrophies = null;
      if (data.modeTrophies) {
        try {
          modeTrophies =
            typeof data.modeTrophies === "string"
              ? JSON.parse(data.modeTrophies)
              : data.modeTrophies;
        } catch {
          modeTrophies = null;
        }
      }
      let unlockedEmojis = [];
      if (data.unlockedEmojis) {
        try {
          unlockedEmojis =
            typeof data.unlockedEmojis === "string"
              ? JSON.parse(data.unlockedEmojis)
              : data.unlockedEmojis;
          if (!Array.isArray(unlockedEmojis)) unlockedEmojis = [];
        } catch {
          unlockedEmojis = [];
        }
      }

      return {
        bestScore: Number(data.bestScore) || 0,
        coins: Number(data.coins) || 0,
        gamesPlayed: Number(data.gamesPlayed) || 0,
        totalCorrect: Number(data.totalCorrect) || 0,
        modeTrophies,
        unlockedEmojis,
      };
    } catch (err) {
      console.warn("[YandexSDK] getData:", err);
      return {
        bestScore: 0,
        coins: 0,
        gamesPlayed: 0,
        totalCorrect: 0,
        modeTrophies: null,
        unlockedEmojis: [],
      };
    }
  }

  async saveProgress({
    bestScore,
    coins,
    gamesPlayed,
    totalCorrect,
    modeTrophies,
    unlockedEmojis,
  }) {
    if (!this.player?.setData) return;
    try {
      await this.player.setData(
        {
          bestScore,
          coins,
          gamesPlayed,
          totalCorrect,
          modeTrophies: JSON.stringify(modeTrophies),
          unlockedEmojis: JSON.stringify(unlockedEmojis ?? []),
        },
        true
      );
    } catch (err) {
      console.warn("[YandexSDK] setData:", err);
    }
  }

  getPlayerProfile() {
    if (!this.player) {
      return { name: "Игрок", avatarUrl: null };
    }

    try {
      const name = this.player.getName?.()?.trim() || "Игрок";
      const avatarUrl =
        this.player.getPhoto?.("medium") ||
        this.player.getPhoto?.("small") ||
        this.player.getPhoto?.("large") ||
        null;

      return {
        name,
        avatarUrl: avatarUrl || null,
      };
    } catch (err) {
      console.warn("[YandexSDK] getPlayerProfile:", err);
      return { name: "Игрок", avatarUrl: null };
    }
  }

  extractLeaderboardAvatar(player) {
    if (!player?.getAvatarSrc) return null;

    try {
      const url =
        player.getAvatarSrc("medium") ||
        player.getAvatarSrc("small") ||
        player.getAvatarSrc("large");
      return url || null;
    } catch {
      return null;
    }
  }

  normalizeLeaderboardEntry(entry, selfUniqueId = null) {
    const player = entry?.player;
    const uniqueId = player?.uniqueID ?? null;
    const isSelf = Boolean(selfUniqueId && uniqueId && uniqueId === selfUniqueId);

    return {
      rank: Number(entry.rank) || 0,
      name: player?.publicName?.trim() || "Игрок",
      score: Number(entry.score) || 0,
      avatarUrl: this.extractLeaderboardAvatar(player),
      borderColor: null,
      isSelf,
    };
  }

  splitLeaderboardEntries(entries, limit, selfUniqueId = null) {
    const normalized = entries
      .map((entry) => this.normalizeLeaderboardEntry(entry, selfUniqueId))
      .filter((entry) => entry.rank > 0)
      .sort((a, b) => a.rank - b.rank);

    const top = [];
    const seenRanks = new Set();

    for (const entry of normalized) {
      if (entry.rank > limit || seenRanks.has(entry.rank)) continue;
      top.push(entry);
      seenRanks.add(entry.rank);
      if (top.length >= limit) break;
    }

    let self =
      normalized.find((entry) => entry.isSelf && entry.rank > limit) ??
      normalized.find((entry) => entry.isSelf && !seenRanks.has(entry.rank)) ??
      null;

    if (self && self.rank <= limit) {
      self = null;
    }

    return { top, self };
  }

  async loadLeaderboardEntries(limit = 10) {
    if (this.isMock || !this.ysdk?.leaderboards?.getEntries) {
      return this.loadMockLeaderboard(limit);
    }

    try {
      const selfUniqueId = this.player?.getUniqueID?.() ?? null;
      const result = await this.ysdk.leaderboards.getEntries(LEADERBOARD_NAME, {
        quantityTop: limit,
        includeUser: true,
      });

      const rawEntries = result?.entries ?? [];
      if (rawEntries.length === 0) {
        return this.loadMockLeaderboard(limit);
      }

      let { top, self } = this.splitLeaderboardEntries(rawEntries, limit, selfUniqueId);

      const userRank = Number(result?.userRank);
      if (!self && Number.isFinite(userRank) && userRank > limit) {
        self =
          rawEntries
            .map((entry) => this.normalizeLeaderboardEntry(entry, selfUniqueId))
            .find((entry) => entry.rank === userRank) ?? null;
      }

      if (top.length === 0) {
        return this.loadMockLeaderboard(limit);
      }

      return { top, self };
    } catch (err) {
      console.warn("[YandexSDK] getEntries:", err);
      return this.loadMockLeaderboard(limit);
    }
  }

  async loadMockLeaderboard(limit = 10) {
    try {
      const res = await fetch("data/leaderboard.json");
      if (!res.ok) return { top: [], self: null };
      const data = await res.json();
      const top = data.slice(0, limit).map((entry, index) => ({
        rank: index + 1,
        name: entry.name || "Игрок",
        score: Number(entry.score) || 0,
        avatarUrl: entry.avatarUrl || null,
        borderColor: entry.borderColor || null,
        isSelf: false,
      }));
      const profile = this.getPlayerProfile();

      return {
        top,
        self: {
          rank: 42,
          name: profile.name,
          score: 12450,
          avatarUrl: profile.avatarUrl,
          borderColor: "#52b788",
          isSelf: true,
        },
      };
    } catch (err) {
      console.warn("[YandexSDK] mock leaderboard:", err);
      return { top: [], self: null };
    }
  }

  async setLeaderboardScore(score) {
    const safeScore = Math.max(0, Math.floor(Number(score) || 0));
    if (this.isMock || !this.ysdk?.leaderboards?.setScore) return;

    try {
      await this.ysdk.leaderboards.setScore(LEADERBOARD_NAME, safeScore);
    } catch (err) {
      console.warn("[YandexSDK] setScore:", err);
    }
  }
}

class MockPlayer {
  constructor() {
    this._storageKey = "brawl_quiz_save";
  }

  getName() {
    return "Тестер";
  }

  getPhoto() {
    return "";
  }

  async getData(keys) {
    try {
      const raw = localStorage.getItem(this._storageKey);
      const all = raw ? JSON.parse(raw) : {};
      if (!keys?.length) return all;
      return keys.reduce((acc, key) => {
        if (all[key] !== undefined) acc[key] = all[key];
        return acc;
      }, {});
    } catch {
      return {};
    }
  }

  async setData(data) {
    const prev = await this.getData();
    const merged = { ...prev, ...data };
    if (merged.modeTrophies && typeof merged.modeTrophies !== "string") {
      merged.modeTrophies = JSON.stringify(merged.modeTrophies);
    }
    localStorage.setItem(this._storageKey, JSON.stringify(merged));
  }
}
