/**
 * Собирает data/quiz.json из js/vic1.js, js/vic2.js, js/vic3.json
 * Запуск: node scripts/build-questions.mjs
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const VIC1_PATH = join(ROOT, "js", "vic1.js");
const VIC2_PATH = join(ROOT, "js", "vic2.js");
const VIC3_PATH = join(ROOT, "js", "vic3.json");
const OUT_PATH = join(ROOT, "data", "quiz.json");
const EMOJI_DIR = join(ROOT, "assets", "emoji");
const MODE_ORDER = ["easy", "medium", "hard"];

const MODES = {
  easy: { coins: 2, xp: 5, tier: 1 },
  medium: { coins: 3, xp: 8, tier: 2 },
  hard: { coins: 5, xp: 12, tier: 3 },
};

const BRAWLER_IMAGES = [
  ["шелли", "shelly.svg"],
  ["shelly", "shelly.svg"],
  ["кольт", "colt.svg"],
  ["colt", "colt.svg"],
  ["булл", "frank.svg"],
  ["нита", "frank.svg"],
  ["джесси", "colt.svg"],
  ["брок", "colt.svg"],
  ["динамайк", "colt.svg"],
  ["бо", "colt.svg"],
  ["тик", "colt.svg"],
  ["8-бит", "colt.svg"],
  ["эмз", "colt.svg"],
  ["эль примо", "frank.svg"],
  ["барли", "colt.svg"],
  ["рико", "colt.svg"],
  ["пенни", "colt.svg"],
  ["карл", "colt.svg"],
  ["джеки", "colt.svg"],
  ["гром", "colt.svg"],
  ["мортис", "colt.svg"],
  ["спраут", "colt.svg"],
  ["макс", "colt.svg"],
  ["мистер п", "colt.svg"],
  ["спайк", "spike.svg"],
  ["кроу", "crow.svg"],
  ["ворон", "crow.svg"],
  ["леон", "leon.svg"],
  ["сэнди", "colt.svg"],
  ["эдгар", "leon.svg"],
  ["биби", "frank.svg"],
  ["белль", "colt.svg"],
  ["пайпер", "piper.svg"],
  ["пэм", "colt.svg"],
  ["фрэнк", "frank.svg"],
  ["беа", "colt.svg"],
  ["лола", "colt.svg"],
  ["грей", "colt.svg"],
  ["честер", "colt.svg"],
  ["корделиус", "colt.svg"],
  ["отис", "colt.svg"],
  ["гас", "colt.svg"],
  ["мэнди", "colt.svg"],
  ["эш", "colt.svg"],
  ["р-т", "colt.svg"],
  ["фэнг", "colt.svg"],
  ["лу", "colt.svg"],
  ["джин", "colt.svg"],
  ["амбер", "colt.svg"],
  ["ив", "colt.svg"],
  ["базз", "colt.svg"],
  ["сэм", "colt.svg"],
  ["нарф", "colt.svg"],
  ["ruffs", "colt.svg"],
];

function pickImage(question, options, correctIndex) {
  const brawlerMatch = question.match(/Какой б(?:оец|равлер):\s*(.+?)\?/i);
  const haystack = [brawlerMatch?.[1], question, options[correctIndex], ...options]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const [keyword, file] of BRAWLER_IMAGES) {
    if (haystack.includes(keyword)) {
      return `assets/brawlers/${file}`;
    }
  }
  return "assets/brawlers/colt.svg";
}

function detectTopic(question) {
  if (/боец|бравлер|суперспособност|класс|трио|гаджет|звёздн|гиперзаряд/i.test(question)) {
    return "brawlers";
  }
  if (/режим|броулбол|нокаут|кристал|осад|ограблен|зон/i.test(question)) {
    return "modes";
  }
  if (/валют|монет|блинг|кристалл|очк/i.test(question)) {
    return "economy";
  }
  return "general";
}

function questionFingerprint(question, options) {
  const opts = options.map((o) => String(o).trim().toLowerCase()).join("|");
  return `${question.trim().toLowerCase()}::${opts}`;
}

function dedupeUnique(questions, label) {
  const seen = new Set();
  const unique = [];

  for (const q of questions) {
    const fp = questionFingerprint(q.question, q.options);
    if (seen.has(fp)) {
      throw new Error(`[${label}] Дубликат: ${q.question}`);
    }
    seen.add(fp);
    unique.push(q);
  }

  return unique;
}

function assertUniquePool(questions, mode) {
  const seen = new Set();
  for (const q of questions) {
    const fp = questionFingerprint(q.question, q.options);
    if (seen.has(fp)) {
      throw new Error(`[quiz.json/${mode}] Дубликат после сборки: ${q.question}`);
    }
    seen.add(fp);
  }
}

function parseVicFile(filePath, mode, source) {
  const raw = readFileSync(filePath, "utf8");
  const items = JSON.parse(raw);

  const parsed = items
    .filter((q) => !q.difficulty || q.difficulty === mode)
    .map((q, index) => ({
      question: q.question.trim(),
      options: q.answers.map((a) => String(a).trim()),
      correct_option_index: q.correctAnswer,
      mode,
      stats: {
        topic: detectTopic(q.question),
        sourceNumber: index + 1,
        source,
      },
    }));

  return dedupeUnique(parsed, source);
}

function toQuizQuestion(entry, mode, index) {
  const cfg = MODES[mode];
  const image = pickImage(
    entry.question,
    entry.options,
    entry.correct_option_index
  );

  return {
    id: `${mode}-${index + 1}`,
    number: index + 1,
    mode,
    question: entry.question,
    options: entry.options,
    correct_option_index: entry.correct_option_index,
    image_url: image,
    rewards: {
      coins: cfg.coins,
      xp: cfg.xp,
    },
    stats: {
      topic: entry.stats?.topic ?? "general",
      difficultyTier: cfg.tier,
      sourceNumber: entry.stats?.sourceNumber ?? index + 1,
      source: entry.stats?.source ?? null,
    },
  };
}

function assertGlobalUnique(questionsByMode) {
  const globalText = new Map();
  const globalFull = new Map();

  for (const mode of Object.keys(questionsByMode)) {
    for (const q of questionsByMode[mode]) {
      const text = q.question.trim().toLowerCase();
      const full = questionFingerprint(q.question, q.options);

      if (globalText.has(text)) {
        throw new Error(
          `Межрежимный дубликат текста (${globalText.get(text)} и ${mode}:${q.id}): ${q.question}`
        );
      }
      if (globalFull.has(full)) {
        throw new Error(
          `Межрежимный полный дубликат (${globalFull.get(full)} и ${mode}:${q.id}): ${q.question}`
        );
      }

      globalText.set(text, `${mode}:${q.id}`);
      globalFull.set(full, `${mode}:${q.id}`);
    }
  }
}

function buildByMode(vic1Easy, vic2Medium, vic3Hard) {
  const byMode = {
    easy: dedupeUnique(vic1Easy, "easy"),
    medium: dedupeUnique(vic2Medium, "medium"),
    hard: dedupeUnique(vic3Hard, "hard"),
  };

  const result = { easy: [], medium: [], hard: [] };
  for (const mode of Object.keys(result)) {
    result[mode] = byMode[mode].map((item, i) => toQuizQuestion(item, mode, i));
    assertUniquePool(result[mode], mode);
  }
  assertGlobalUnique(result);
  return result;
}

function loadEmojiCatalog() {
  const files = readdirSync(EMOJI_DIR).filter((name) => /\.png$/i.test(name));
  const catalog = files
    .map((file) => {
      const id = Number.parseInt(file.replace(/\D/g, ""), 10);
      if (!Number.isFinite(id)) return null;
      return {
        id,
        file,
        url: `assets/emoji/${file}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.id - b.id);

  if (catalog.length !== 20) {
    throw new Error(`Ожидалось 20 emoji в assets/emoji, найдено ${catalog.length}`);
  }

  return catalog;
}

function assignEmojisToQuestions(questionsByMode, catalog) {
  const flat = MODE_ORDER.flatMap((mode) => questionsByMode[mode] ?? []);
  const total = flat.length;

  flat.forEach((question, index) => {
    const emojiIndex = Math.min(catalog.length - 1, Math.floor((index * catalog.length) / total));
    const emoji = catalog[emojiIndex];
    question.rewards.emojiId = emoji.id;
    question.rewards.emojiUrl = emoji.url;
  });
}

function buildQuiz(questionsByMode, sources, emojiCatalog) {
  assignEmojisToQuestions(questionsByMode, emojiCatalog);

  const modes = {};
  for (const [id, cfg] of Object.entries(MODES)) {
    const poolSize = questionsByMode[id].length;
    modes[id] = {
      id,
      trophyMax: poolSize,
      questionsPerRound: 10,
      poolSize,
      rewards: {
        coinsPerCorrect: cfg.coins,
        xpPerCorrect: cfg.xp,
        bonusPerfectRound: cfg.coins * 5,
      },
    };
  }

  const total = Object.values(questionsByMode).reduce((n, arr) => n + arr.length, 0);

  return {
    meta: {
      source: "js/vic1.js + js/vic2.js + js/vic3.json",
      generatedAt: new Date().toISOString(),
      ...sources,
      totalQuestions: total,
      emojiCount: emojiCatalog.length,
    },
    emojis: emojiCatalog.map(({ id, url }) => ({ id, url })),
    modes,
    questions: questionsByMode,
  };
}

const vic1Easy = parseVicFile(VIC1_PATH, "easy", "js/vic1.js");
const vic2Medium = parseVicFile(VIC2_PATH, "medium", "js/vic2.js");
const vic3Hard = parseVicFile(VIC3_PATH, "hard", "js/vic3.json");

const questionsByMode = buildByMode(vic1Easy, vic2Medium, vic3Hard);
const emojiCatalog = loadEmojiCatalog();
const quiz = buildQuiz(questionsByMode, {
  easyFromVic1: vic1Easy.length,
  mediumFromVic2: vic2Medium.length,
  hardFromVic3: vic3Hard.length,
}, emojiCatalog);

writeFileSync(OUT_PATH, JSON.stringify(quiz, null, 2), "utf8");

console.log(`Готово: ${OUT_PATH}`);
console.log(`Easy  (vic1.js):   ${vic1Easy.length} уникальных`);
console.log(`Medium (vic2.js):  ${vic2Medium.length} уникальных`);
console.log(`Hard  (vic3.json): ${vic3Hard.length} уникальных`);
for (const mode of ["easy", "medium", "hard"]) {
  console.log(`  ${mode}: ${quiz.questions[mode].length} в quiz.json`);
}
