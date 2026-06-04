import { YandexSDK } from "./yandex-sdk.js";
import { launchResultsConfetti, stopConfetti } from "./confetti-fx.js";
import { launchEmojiBurst, clearEmojiBurst } from "./emoji-burst-fx.js";
import { bindUiClickSounds, initUiAudio, initAudioVisibilityHandler, tryStartBackgroundMusic } from "./ui-audio.js";
import {
  loadSettings,
  getSettings,
  setSetting,
  subscribe,
  areHintsEnabled,
} from "./settings.js";

const sdk = new YandexSDK();

const state = {
  quiz: null,
  roundQuestions: [],
  currentIndex: 0,
  score: 0,
  coins: 0,
  totalCorrect: 0,
  bestScore: 0,
  gamesPlayed: 0,
  answered: false,
  hintsUsed: { exclude: false, highlight: false, audience: false },
  sessionCoinsEarned: 0,
  currentMode: "easy",
  modeTrophies: { easy: 0, medium: 0, hard: 0 },
  unlockedEmojis: new Set(),
  leaderboard: [],
  leaderboardSelf: null,
  completedRoundSnapshot: null,
};

function getModeConfig(mode = state.currentMode) {
  return state.quiz?.modes?.[mode] ?? null;
}

function getModeLimit(mode) {
  const cfg = getModeConfig(mode);
  return cfg?.trophyMax ?? cfg?.poolSize ?? 10;
}

function getQuestionsPerRound(mode) {
  return getModeConfig(mode)?.questionsPerRound ?? 10;
}

/** Режим считается пройденным при максимуме трофеев (см. trophyMax в quiz.json). */
const MODE_UNLOCK_FROM = {
  easy: null,
  medium: "easy",
  hard: "medium",
};

const MODE_LABELS = {
  easy: "НАЧАЛЬНЫЙ",
  medium: "СРЕДНИЙ",
  hard: "СЛОЖНЫЙ",
};

const SHOP = {
  emoji: 120,
};

const HINT_FLASH = {
  highlight: 1000,
  ad: 2000,
  audience: 1800,
};

function createHintsUsedState() {
  return { exclude: false, highlight: false, audience: false };
}

function getModeTrophyProgress(mode) {
  const max = getModeLimit(mode);
  const val = state.modeTrophies[mode] ?? 0;
  return { val, max, completed: val >= max };
}

function isModeCompleted(mode) {
  return getModeTrophyProgress(mode).completed;
}

function isModeUnlocked(mode) {
  const requiredMode = MODE_UNLOCK_FROM[mode];
  if (!requiredMode) return true;
  return isModeCompleted(requiredMode);
}

function getModeUnlockRemaining(mode) {
  const requiredMode = MODE_UNLOCK_FROM[mode];
  if (!requiredMode) return 0;

  const { val, max } = getModeTrophyProgress(requiredMode);
  return Math.max(0, max - val);
}

function getModeUnlockLabel(mode) {
  const requiredMode = MODE_UNLOCK_FROM[mode];
  if (!requiredMode) return "";

  const labels = { easy: "начальный", medium: "средний", hard: "сложный" };
  return `Сначала пройди ${labels[requiredMode]}`;
}

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const screens = {
  menu: $("#screen-menu"),
  mode: $("#screen-mode"),
  rewards: $("#screen-rewards"),
  stats: $("#screen-stats"),
  game: $("#screen-game"),
  results: $("#screen-results"),
};

function showScreen(name) {
  const prev = document.querySelector(".screen.active")?.id;

  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name]?.classList.add("active");

  if (prev === "screen-results" && name !== "results") {
    stopConfetti();
  }

  if (prev === "screen-game" && name !== "game") {
    clearEmojiBurst();
  }

  if (name === "menu" || name === "mode" || name === "stats" || name === "rewards" || name === "results") {
    sdk.gameplayStop();
  } else if (name === "game") {
    sdk.gameplayStart();
  }

  if (name === "stats") {
    renderStatsSelfPin();
  }
}

function getTotalTrophies() {
  return Object.values(state.modeTrophies).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getNameInitial(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "?";
  return [...trimmed][0].toUpperCase();
}

function getAvatarFallbackHue(name) {
  let hash = 0;
  const value = String(name || "player");
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function renderStatsAvatar(entry) {
  const borderStyle = entry.borderColor
    ? ` style="border-color: ${escapeHtml(entry.borderColor)}"`
    : "";
  const safeName = escapeHtml(entry.name);

  if (entry.avatarUrl) {
    return `<img class="stats-avatar" src="${escapeHtml(entry.avatarUrl)}" alt="" loading="lazy" decoding="async"${borderStyle} />`;
  }

  const initial = escapeHtml(getNameInitial(entry.name));
  const hue = getAvatarFallbackHue(entry.name);
  const fallbackStyle = entry.borderColor
    ? `border-color: ${escapeHtml(entry.borderColor)};`
    : "";
  return `<span class="stats-avatar stats-avatar--fallback" style="${fallbackStyle} background: hsl(${hue} 55% 38%);" aria-hidden="true">${initial}</span>`;
}

async function loadLeaderboard() {
  const data = await sdk.loadLeaderboardEntries(10);
  state.leaderboard = data.top;
  state.leaderboardSelf = data.self;
}

function buildStatsRowHtml(entry, { self = false } = {}) {
  const rank = entry.rank ?? 0;

  return `
    <span class="stats-rank ${getRankClass(rank)}">${rank}</span>
    ${renderStatsAvatar(entry)}
    <span class="stats-name">${escapeHtml(entry.name)}${self ? ' <span class="stats-name__you">(вы)</span>' : ""}</span>
    <span class="stats-score-wrap">
      <img class="trophy-icon stats-score-wrap__icon" src="assets/ui/kubok.png" alt="" width="24" height="24" />
      <span class="stats-score">${entry.score}</span>
    </span>
  `.trim();
}

function renderStatsSelfPin() {
  const pin = $("#stats-self-pin");
  const row = $("#stats-self-row");
  if (!pin || !row) return;

  const self = state.leaderboardSelf;
  if (!self || self.rank <= 10) {
    pin.hidden = true;
    row.innerHTML = "";
    return;
  }

  pin.hidden = false;
  row.className = "stats-row stats-row--self";
  row.innerHTML = buildStatsRowHtml(self, { self: true });
}

function getRankClass(rank) {
  if (rank === 1) return "stats-rank--1";
  if (rank === 2) return "stats-rank--2";
  if (rank === 3) return "stats-rank--3";
  return "stats-rank--default";
}

function getEmojiCatalog() {
  return state.quiz?.emojis ?? [];
}

function getUnlockedEmojiUrls() {
  return getEmojiCatalog()
    .filter((emoji) => state.unlockedEmojis.has(emoji.id))
    .map((emoji) => emoji.url);
}

function tryUnlockEmoji(question) {
  const emojiId = question?.rewards?.emojiId;
  if (!emojiId || state.unlockedEmojis.has(emojiId)) return false;

  state.unlockedEmojis.add(emojiId);
  return true;
}

function canAfford(price) {
  return state.coins >= price;
}

function spendCoins(amount) {
  if (amount <= 0 || state.coins < amount) return false;
  state.coins -= amount;
  updateCoinsUI();
  return true;
}

function syncGameplayWithActiveScreen() {
  if (screens.game?.classList.contains("active")) {
    sdk.gameplayStart();
  } else {
    sdk.gameplayStop();
  }
}

function applyAppLanguage() {
  const lang = sdk.getLanguage();
  document.documentElement.lang = lang.split("-")[0] || "ru";
}

async function buyEmoji(emojiId) {
  if (state.unlockedEmojis.has(emojiId)) return;
  if (!canAfford(SHOP.emoji)) return;

  await sdk.showFullscreenAdv({ resumeGameplay: false });
  if (!spendCoins(SHOP.emoji)) return;

  state.unlockedEmojis.add(emojiId);
  await persistProgress();
  renderRewardsGrid();
}

function renderRewardsGrid() {
  const grid = $("#rewards-grid");
  const countEl = $("#rewards-count");
  if (!grid) return;

  const catalog = getEmojiCatalog();
  const total = catalog.length;
  const affordEmoji = canAfford(SHOP.emoji);

  if (countEl) {
    countEl.textContent = `${state.unlockedEmojis.size}/${total}`;
  }

  grid.innerHTML = catalog
    .map((emoji) => {
      const unlocked = state.unlockedEmojis.has(emoji.id);
      if (unlocked) {
        return `
          <div class="rewards-cell" title="Emoji #${emoji.id}">
            <img class="rewards-cell__img" src="${emoji.url}" alt="" width="64" height="64" loading="lazy" />
          </div>
        `;
      }

      return `
        <div class="rewards-cell rewards-cell--locked" title="Купить за ${SHOP.emoji} монет">
          <img class="rewards-cell__img" src="${emoji.url}" alt="" width="64" height="64" loading="lazy" />
          <button
            type="button"
            class="rewards-buy-btn"
            data-emoji-id="${emoji.id}"
            ${affordEmoji ? "" : "disabled"}
            aria-label="Купить emoji за ${SHOP.emoji} монет"
          >
            <img class="rewards-buy-btn__icon" src="assets/ui/coin.png" alt="" width="16" height="16" />
            <span>${SHOP.emoji}</span>
          </button>
        </div>
      `;
    })
    .join("");
}

async function persistProgress() {
  await sdk.saveProgress({
    bestScore: state.bestScore,
    coins: state.coins,
    gamesPlayed: state.gamesPlayed,
    totalCorrect: state.totalCorrect,
    modeTrophies: state.modeTrophies,
    unlockedEmojis: [...state.unlockedEmojis],
  });
}

function renderStatsList() {
  const list = $("#stats-list");
  if (!list) return;

  if (state.leaderboard.length === 0) {
    list.innerHTML = `
      <li class="stats-row stats-row--empty">
        <span class="stats-name">Рейтинг пока пуст</span>
      </li>
    `;
    renderStatsSelfPin();
    return;
  }

  list.innerHTML = state.leaderboard
    .map((entry, index) => {
      const rank = entry.rank ?? index + 1;
      return `
        <li class="stats-row">
          ${buildStatsRowHtml({ ...entry, rank })}
        </li>
      `;
    })
    .join("");

  renderStatsSelfPin();
}

async function refreshStatsList() {
  const list = $("#stats-list");
  if (list) {
    list.innerHTML = `
      <li class="stats-row stats-row--empty">
        <span class="stats-name">Загрузка...</span>
      </li>
    `;
  }

  $("#stats-self-pin")?.setAttribute("hidden", "");

  const data = await sdk.loadLeaderboardEntries(10);
  state.leaderboard = data.top;
  state.leaderboardSelf = data.self;
  renderStatsList();
}

function updateModeTrophiesUI() {
  $$(".mode-card__trophy-value").forEach((el) => {
    const mode = el.dataset.trophy;
    const { val, max } = getModeTrophyProgress(mode);
    el.textContent = `${val}/${max}`;
  });

  $$(".mode-card").forEach((card) => {
    const mode = card.dataset.mode;
    const unlocked = isModeUnlocked(mode);
    card.classList.toggle("mode-card--locked", !unlocked);
    card.disabled = !unlocked;
    card.setAttribute("aria-disabled", unlocked ? "false" : "true");

    const lock = card.querySelector(".mode-card__lock");
    const lockValue = card.querySelector(".mode-card__lock-value");
    const lockLabel = card.querySelector(".mode-card__lock-label");
    if (!lock) return;

    if (unlocked) {
      lock.hidden = true;
    } else {
      lock.hidden = false;
      if (lockValue) lockValue.textContent = String(getModeUnlockRemaining(mode));
      if (lockLabel) lockLabel.textContent = getModeUnlockLabel(mode);
    }
  });
}

async function selectMode(mode) {
  if (!isModeUnlocked(mode)) return;

  await sdk.showFullscreenAdv({ resumeGameplay: false });

  state.currentMode = mode;
  startRound();
}

function applyGameSettings() {
  const hintPanel = $("#hint-panel");
  if (hintPanel) {
    hintPanel.classList.toggle("hint-panel--ad-only", !areHintsEnabled());
  }
}

function syncSettingsModal() {
  const settings = getSettings();
  const soundEl = $("#setting-sound");
  const emojiOffEl = $("#setting-emoji-off");
  const hintsOffEl = $("#setting-hints-off");

  if (soundEl) soundEl.checked = settings.soundEnabled;
  if (emojiOffEl) emojiOffEl.checked = !settings.emojiEffectsEnabled;
  if (hintsOffEl) hintsOffEl.checked = !settings.hintsEnabled;
}

function openSettingsModal() {
  syncSettingsModal();
  openModal("modal-settings");
}

function bindSettingsControls() {
  $("#setting-sound")?.addEventListener("change", (e) => {
    setSetting("soundEnabled", e.target.checked);
  });
  $("#setting-emoji-off")?.addEventListener("change", (e) => {
    setSetting("emojiEffectsEnabled", !e.target.checked);
  });
  $("#setting-hints-off")?.addEventListener("change", (e) => {
    setSetting("hintsEnabled", !e.target.checked);
  });
}

function openModal(id) {
  $(`#${id}`)?.classList.add("open");
  sdk.gameplayStop();
}

function closeModal(id) {
  $(`#${id}`)?.classList.remove("open");
  const activeScreen = document.querySelector(".screen.active");
  if (activeScreen?.id === "screen-game") {
    sdk.gameplayStart();
  }
}

let confirmResolve = null;

function finishConfirm(result) {
  closeModal("modal-confirm");
  if (confirmResolve) {
    confirmResolve(result);
    confirmResolve = null;
  }
}

function showConfirm({ title = "Подтвердите действие", message = "", confirmText = "Да", cancelText = "Отмена" } = {}) {
  return new Promise((resolve) => {
    const titleEl = $("#modal-confirm-title");
    const messageEl = $("#modal-confirm-message");
    const btnConfirm = $("#modal-confirm-ok");
    const btnCancel = $("#modal-confirm-cancel");

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (btnConfirm) btnConfirm.textContent = confirmText;
    if (btnCancel) btnCancel.textContent = cancelText;

    confirmResolve = resolve;
    openModal("modal-confirm");
  });
}

async function loadQuiz() {
  const res = await fetch("data/quiz.json");
  if (!res.ok) throw new Error("Не удалось загрузить вопросы");
  state.quiz = await res.json();
  if (!state.quiz?.questions) {
    throw new Error("Некорректный формат data/quiz.json");
  }
}

function getModeQuestionPool(mode = state.currentMode) {
  return state.quiz?.questions?.[mode] ?? [];
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function questionFingerprint(q) {
  const options = (q.options ?? []).map((o) => String(o).trim().toLowerCase()).join("|");
  return `${String(q.question).trim().toLowerCase()}::${options}`;
}

function uniqueQuestions(questions) {
  const seen = new Set();
  return questions.filter((q) => {
    const key = questionFingerprint(q);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shuffleOptions(question) {
  const correctOriginal = question.correct_option_index;
  const pairs = question.options.map((text, originalIndex) => ({
    text,
    originalIndex,
  }));
  const shuffled = shuffle(pairs);

  return {
    options: shuffled.map((item) => item.text),
    correctIndex: shuffled.findIndex((item) => item.originalIndex === correctOriginal),
  };
}

function startRound() {
  const mode = state.currentMode;
  const pool = shuffle(uniqueQuestions(getModeQuestionPool(mode)));
  const roundSize = getQuestionsPerRound(mode);
  state.roundQuestions = pool.slice(0, Math.min(roundSize, pool.length));
  state.currentIndex = 0;
  state.score = 0;
  state.answered = false;
  state.hintsUsed = createHintsUsedState();
  state.sessionCoinsEarned = 0;
  showScreen("game");
  updateGameModeBadge();
  updateCoinsUI();
  renderQuestion();
}

function updateGameModeBadge() {
  const badge = $("#game-mode-badge");
  if (!badge) return;

  const mode = state.currentMode;
  badge.dataset.mode = mode;
  badge.textContent = MODE_LABELS[mode] ?? mode.toUpperCase();
}

function renderQuestion() {
  const q = state.roundQuestions[state.currentIndex];
  if (!q) return;

  state.answered = false;
  state.hintsUsed = createHintsUsedState();
  state.questionDisplay = null;

  $("#question-progress").textContent =
    `ВОПРОС ${state.currentIndex + 1}/${state.roundQuestions.length}`;
  $("#question-text").textContent = q.question;

  const container = $("#answers-container");
  container.innerHTML = "";

  const { options, correctIndex } = shuffleOptions(q);
  state.questionDisplay = { correctIndex };

  options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-answer answer-btn";
    btn.textContent = option;
    btn.dataset.index = String(index);
    btn.addEventListener("click", () => onAnswer(index));
    container.appendChild(btn);
  });

  updateHintButtons();
}

function getCorrectIndex() {
  return (
    state.questionDisplay?.correctIndex ??
    state.roundQuestions[state.currentIndex]?.correct_option_index
  );
}

function getCorrectButton() {
  const correctIndex = getCorrectIndex();
  if (correctIndex == null) return null;

  return [...$$("#answers-container .answer-btn")].find(
    (btn) => Number(btn.dataset.index) === correctIndex
  );
}

function getVisibleWrongButtons() {
  const correctIndex = getCorrectIndex();
  return [...$$("#answers-container .answer-btn")].filter(
    (btn) =>
      !btn.classList.contains("hidden") && Number(btn.dataset.index) !== correctIndex
  );
}

function flashAnswerClass(button, className, durationMs) {
  if (!button || state.answered) return;

  button.classList.add(className);
  window.setTimeout(() => {
    if (state.answered) return;
    button.classList.remove(className);
  }, durationMs);
}

function flashCorrectAnswer(durationMs) {
  flashAnswerClass(getCorrectButton(), "btn-answer--correct", durationMs);
}

function hintExclude() {
  if (!areHintsEnabled()) return;
  if (state.answered || state.hintsUsed.exclude) return;

  const wrongButtons = getVisibleWrongButtons();
  if (!wrongButtons.length) return;

  wrongButtons[Math.floor(Math.random() * wrongButtons.length)].classList.add("hidden");
  state.hintsUsed.exclude = true;
  updateHintButtons();
}

function hintHighlightCorrect() {
  if (!areHintsEnabled()) return;
  if (state.answered || state.hintsUsed.highlight) return;

  flashCorrectAnswer(HINT_FLASH.highlight);
  state.hintsUsed.highlight = true;
  updateHintButtons();
}

function hintAudienceHelp() {
  if (!areHintsEnabled()) return;
  if (state.answered || state.hintsUsed.audience) return;

  const correctButton = getCorrectButton();
  if (!correctButton) return;

  flashAnswerClass(correctButton, "btn-answer--correct", HINT_FLASH.audience);

  const emojiUrls = getUnlockedEmojiUrls();
  if (emojiUrls.length > 0) {
    launchEmojiBurst(emojiUrls);
  }

  state.hintsUsed.audience = true;
  updateHintButtons();
}

function useAdHint() {
  if (state.answered) return;
  flashCorrectAnswer(HINT_FLASH.ad);
}

function updateHintButtons() {
  const answered = state.answered;

  $("#btn-hint-exclude") &&
    ($("#btn-hint-exclude").disabled = answered || state.hintsUsed.exclude);
  $("#btn-hint-highlight") &&
    ($("#btn-hint-highlight").disabled = answered || state.hintsUsed.highlight);
  $("#btn-hint-audience") &&
    ($("#btn-hint-audience").disabled = answered || state.hintsUsed.audience);
  $("#btn-hint-ad") && ($("#btn-hint-ad").disabled = answered);
}

function onAnswer(selectedIndex) {
  if (state.answered) return;
  state.answered = true;

  const q = state.roundQuestions[state.currentIndex];
  const correctIndex = state.questionDisplay?.correctIndex ?? q.correct_option_index;
  const buttons = $$("#answers-container .answer-btn");
  const isCorrect = selectedIndex === correctIndex;

  buttons.forEach((btn, i) => {
    if (i === correctIndex) {
      btn.classList.add("btn-answer--correct");
    } else if (i === selectedIndex && !isCorrect) {
      btn.classList.add("btn-answer--wrong");
    }
  });

  if (isCorrect) {
    const coins = q.rewards?.coins ?? getModeConfig()?.rewards?.coinsPerCorrect ?? 2;

    state.score += 1;
    state.coins += coins;
    state.sessionCoinsEarned += coins;
    state.totalCorrect += 1;
    updateCoinsUI();
    persistProgress();
    if (tryUnlockEmoji(q)) {
      persistProgress();
    }

    const emojiUrls = getUnlockedEmojiUrls();
    if (emojiUrls.length > 0) {
      launchEmojiBurst(emojiUrls);
    }
  }

  setTimeout(() => {
    state.currentIndex += 1;
    if (state.currentIndex >= state.roundQuestions.length) {
      finishRound();
    } else {
      renderQuestion();
    }
  }, 900);
}

async function finishRound() {
  sdk.gameplayStop();

  const total = state.roundQuestions.length;
  const prevBestScore = state.bestScore;
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
  }
  const mode = state.currentMode;
  const modeCfg = getModeConfig(mode);
  const modeMax = getModeLimit(mode);
  const perfect = total > 0 && state.score === total;

  if (perfect && modeCfg?.rewards?.bonusPerfectRound) {
    state.coins += modeCfg.rewards.bonusPerfectRound;
    state.sessionCoinsEarned += modeCfg.rewards.bonusPerfectRound;
    updateCoinsUI();
  }

  const prevTrophies = state.modeTrophies[mode] ?? 0;
  state.modeTrophies[mode] = Math.min(modeMax, prevTrophies + state.score);
  updateModeTrophiesUI();
  state.gamesPlayed += 1;

  state.completedRoundSnapshot = {
    score: state.score,
    sessionCoinsEarned: state.sessionCoinsEarned,
    prevBestScore,
  };

  await persistProgress();
  await sdk.setLeaderboardScore(getTotalTrophies());

  showResults(total);
  scheduleReviewAfterRound(total);
}

const REVIEW_DELAY_MS = 1500;

function scheduleReviewAfterRound(total) {
  const good = state.score >= Math.ceil(total / 2);
  if (!good) return;

  window.setTimeout(async () => {
    if (!screens.results?.classList.contains("active")) return;
    await sdk.tryRequestReview();
  }, REVIEW_DELAY_MS);
}

function revertCompletedRound() {
  const snap = state.completedRoundSnapshot;
  if (!snap) return;

  const mode = state.currentMode;
  state.coins = Math.max(0, state.coins - snap.sessionCoinsEarned);
  state.modeTrophies[mode] = Math.max(0, (state.modeTrophies[mode] ?? 0) - snap.score);
  state.gamesPlayed = Math.max(0, state.gamesPlayed - 1);
  state.totalCorrect = Math.max(0, state.totalCorrect - snap.score);
  state.bestScore = snap.prevBestScore;
  state.completedRoundSnapshot = null;

  updateModeTrophiesUI();
  updateCoinsUI();
}

function restartSameRound() {
  if (!state.roundQuestions.length) return;

  state.currentIndex = 0;
  state.score = 0;
  state.answered = false;
  state.hintsUsed = createHintsUsedState();
  state.sessionCoinsEarned = 0;
  stopConfetti();
  showScreen("game");
  renderQuestion();
}

async function leaveResultsWithAd(callback) {
  await sdk.showFullscreenAdv({ resumeGameplay: false });
  await callback();
  syncGameplayWithActiveScreen();
}

async function restartRoundAfterRevert() {
  revertCompletedRound();
  await persistProgress();
  await sdk.setLeaderboardScore(getTotalTrophies());
  restartSameRound();
}

function showResults(total) {
  const perfect = state.score === total;
  const good = state.score >= Math.ceil(total / 2);

  $("#results-title").textContent = perfect
    ? "ИДЕАЛЬНО!"
    : good
      ? "ПРАВИЛЬНО!"
      : "РАУНД ЗАВЕРШЁН";
  $("#score-display").textContent = `${state.score}/${total}`;
  $("#best-score-display").textContent = `${state.bestScore}/${total}`;
  $("#session-coins").textContent = String(state.sessionCoinsEarned);
  updateCoinsUI();

  showScreen("results");
  launchResultsConfetti();
}

function updateCoinsUI() {
  const coinsText = String(state.coins);
  $("#coins-display").textContent = coinsText;
  $("#total-coins-menu").textContent = coinsText;

  if (screens.rewards?.classList.contains("active")) {
    renderRewardsGrid();
  }
  if (screens.game?.classList.contains("active")) {
    updateHintButtons();
  }
}

function bindPlatformUiHandlers() {
  window.addEventListener("yandex:resume", () => {
    syncGameplayWithActiveScreen();
  });

  $("#app")?.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
}

function bindEvents() {
  bindPlatformUiHandlers();
  bindUiClickSounds($("#app"));

  $("#btn-play").addEventListener("click", startRound);
  $("#btn-play-again").addEventListener("click", () => {
    leaveResultsWithAd(async () => {
      state.completedRoundSnapshot = null;
      startRound();
    });
  });
  $("#btn-restart-round")?.addEventListener("click", () => {
    leaveResultsWithAd(restartRoundAfterRevert);
  });
  $("#btn-main-menu").addEventListener("click", () => {
    leaveResultsWithAd(async () => {
      showScreen("menu");
      updateCoinsUI();
    });
  });
  $("#btn-back").addEventListener("click", async () => {
    const ok = await showConfirm({
      title: "Выйти из раунда?",
      message: "Прогресс не сохранится.",
      confirmText: "Выйти",
      cancelText: "Отмена",
    });
    if (ok) showScreen("menu");
  });
  $("#btn-mode").addEventListener("click", () => {
    updateModeTrophiesUI();
    showScreen("mode");
  });
  $("#btn-mode-back").addEventListener("click", () => showScreen("menu"));
  $$(".mode-card").forEach((card) => {
    card.addEventListener("click", () => selectMode(card.dataset.mode));
  });
  $("#btn-rewards").addEventListener("click", () => {
    updateCoinsUI();
    renderRewardsGrid();
    showScreen("rewards");
  });
  $("#btn-rewards-back").addEventListener("click", () => showScreen("menu"));
  $("#rewards-grid")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".rewards-buy-btn");
    if (!btn || btn.disabled) return;
    buyEmoji(Number(btn.dataset.emojiId));
  });
  $("#btn-stats").addEventListener("click", async () => {
    showScreen("stats");
    await refreshStatsList();
  });
  $("#btn-stats-back").addEventListener("click", () => showScreen("menu"));
  bindSettingsControls();
  subscribe(applyGameSettings);
  $("#btn-settings").addEventListener("click", openSettingsModal);
  $("#btn-info").addEventListener("click", () => openModal("modal-info"));

  $$("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
  });

  $("#modal-confirm-ok")?.addEventListener("click", () => finishConfirm(true));
  $("#modal-confirm-cancel")?.addEventListener("click", () => finishConfirm(false));

  $$(".modal-overlay:not(#modal-confirm)").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  $("#modal-confirm")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) finishConfirm(false);
  });

  $("#btn-hint-exclude")?.addEventListener("click", hintExclude);
  $("#btn-hint-highlight")?.addEventListener("click", hintHighlightCorrect);
  $("#btn-hint-audience")?.addEventListener("click", hintAudienceHelp);
  $("#btn-hint-ad")?.addEventListener("click", () => {
    sdk.showRewardedVideo(() => useAdHint(), { resumeGameplay: true });
  });
}

async function init() {
  loadSettings();
  applyGameSettings();
  initAudioVisibilityHandler();
  bindEvents();

  try {
    await initUiAudio();
    await sdk.init();
    applyAppLanguage();
    await loadQuiz();
    await loadLeaderboard();

    const progress = await sdk.loadProgress();
    state.bestScore = progress.bestScore;
    state.coins = progress.coins;
    state.gamesPlayed = progress.gamesPlayed;
    state.totalCorrect = progress.totalCorrect ?? 0;
    if (progress.modeTrophies) {
      state.modeTrophies = { ...state.modeTrophies, ...progress.modeTrophies };
    }
    if (Array.isArray(progress.unlockedEmojis)) {
      state.unlockedEmojis = new Set(progress.unlockedEmojis.map(Number));
    }
    updateCoinsUI();
    updateModeTrophiesUI();

    sdk.ready();
    await sdk.showFullscreenAdv({ resumeGameplay: false });
    showScreen("menu");
    tryStartBackgroundMusic();
  } catch (err) {
    console.error(err);
    $("#loader p").textContent = "Ошибка загрузки. Обновите страницу.";
    showScreen("menu");
  } finally {
    $("#loader").classList.add("hidden");
  }
}

init();
