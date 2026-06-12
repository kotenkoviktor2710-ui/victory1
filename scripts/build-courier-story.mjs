import fs from "node:fs";
import path from "node:path";
import { buildRest } from "./story-chapters-rest.mjs";
import { buildBranches } from "./story-branches.mjs";
import { buildBranchesS } from "./story-branches-s.mjs";
import { applySceneBackgrounds } from "./story-backgrounds.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const STORY_DIR = path.join(ROOT, "story");

const BG = "BG_01";

/** @param {"narration"|"dialogue"} kind */
function line(kind, text, speaker = null, thought = false, extra = {}) {
  const item = { kind, text, thought, ...extra };
  if (speaker) item.speaker = speaker;
  return item;
}

function scene(id, { title = "", lines = [], choices = [], actBreak = null, autoNextSceneId = null } = {}) {
  return {
    id,
    title,
    backgroundKey: BG,
    characterLayers: [],
    lines,
    choices,
    actBreak,
    autoNextSceneId,
  };
}

function choice(id, text, nextSceneId) {
  return { id, text, nextSceneId };
}

function writeChapter(filename, scenes) {
  const filePath = path.join(STORY_DIR, filename);
  applySceneBackgrounds(scenes);
  fs.writeFileSync(filePath, JSON.stringify({ scenes }, null, 2), "utf8");
  console.log(`✓ ${filename} (${Object.keys(scenes).length} сцен)`);
}

// ─── Глава 0 — Пролог ───────────────────────────────────────────────────────

writeChapter("ch00-prologue.json", {
  scene_prologue: scene("scene_prologue", {
    title: "Чёрный экран",
    lines: [
      line("narration", "Шум города. Машины. Далёкий сигнал светофора. Лай собаки."),
      line("narration", "19:43\nОшибка маршрута.\nВероятность происшествия: 97%.\nПовтор дня запущен."),
      line("dialogue", "Маршрут нестабилен. Необходимо повторить день.", "char_sync"),
      line("dialogue", "Кто здесь?", "char_artem"),
      line("dialogue", "Доброе утро, Артём Воронов.", "char_sync"),
      line("narration", "Белая вспышка.", null, false, { effect: "white_flash" }),
    ],
    actBreak: { enabled: true, title: "ГЛАВА 0 — ПРОЛОГ", backgroundKey: BG },
    autoNextSceneId: "scene_ch01_apartment",
  }),
});

// ─── Глава 1 — Обычное утро ─────────────────────────────────────────────────

writeChapter("ch01-morning.json", {
  scene_ch01_apartment: scene("scene_ch01_apartment", {
    title: "Квартира Артёма — 08:12",
    lines: [
      line("narration", "Небольшая городская квартира. Утренний свет через жалюзи. На столе телефон, ключи, чашка чая. На стуле курьерская куртка. У окна лежит серая посылка без логотипа."),
      line("dialogue", "Я проснулся от будильника, который точно не ставил.", "char_artem"),
      line("dialogue", "Вчера я удалил это приложение. Или мне уже снится, что я борюсь с будильниками?", "char_artem"),
      line("narration", "Он берёт телефон. На экране уведомление:\n\nСегодня важный день. Не опаздывай."),
      line("narration", "Звонит Макс."),
      line("dialogue", "Ты живой?", "char_max"),
      line("dialogue", "Доброе утро и тебе.", "char_artem"),
      line("dialogue", "Нет, я серьёзно. Мне приснилось, что ты звонил и сказал: «Не дай мне доставить коробку».", "char_max"),
      line("narration", "Артём смотрит на посылку у окна."),
      line("dialogue", "Макс.", "char_artem"),
      line("dialogue", "Что?", "char_max"),
      line("dialogue", "У меня дома коробка.", "char_artem"),
      line("dialogue", "Ты курьер. Это не самый странный поворот.", "char_max"),
      line("dialogue", "Она не из службы. На ней нет номера заказа.", "char_artem"),
      line("narration", "Поиск предметов — Квартира Артёма. Найдено 8 предметов:\n1. Квитанция с завтрашней датой.\n2. Ключ с биркой «Склад 17».\n3. Скомканная записка «Не доставляй посылку».\n4. Фото незнакомой девушки.\n5. Бейдж «Синхрон».\n6. Чёрная флешка.\n7. Часы, остановившиеся на 19:43.\n8. Маршрутный лист доставки."),
      line("dialogue", "Либо я вчера жил очень насыщенной жизнью, либо кто-то устроил мне квест без моего согласия.", "char_artem"),
      line("narration", "Телефон загорается."),
      line("dialogue", "Маршрут подтверждён. Получатель ожидает.", "char_sync"),
      line("dialogue", "Кто это пишет?", "char_artem"),
      line("dialogue", "Вы опаздываете на семь минут.", "char_sync"),
    ],
    choices: [
      choice("ch01_take_parcel", "Взять посылку и поехать по маршруту", "scene_ch01_after_take"),
      choice("ch01_open_parcel", "Открыть посылку", "scene_ch01_after_open"),
      choice("ch01_call_max", "Позвонить Максу и попросить приехать", "scene_ch01_after_max"),
      choice("ch01_hide_parcel", "Спрятать посылку и выйти без неё", "scene_ch01_after_hide"),
      choice("ch01_throw_parcel", "Выбросить посылку", "scene_ch01_after_throw"),
    ],
  }),

  scene_ch01_after_take: scene("scene_ch01_after_take", {
    lines: [line("narration", "Артём берёт посылку. Она тяжелее, чем кажется.")],
    autoNextSceneId: "scene_ch01_yard",
  }),
  scene_ch01_after_open: scene("scene_ch01_after_open", {
    lines: [
      line("narration", "Внутри — пустое гнездо из пенопласта и металлический модуль без маркировки. Техническая улика."),
      line("dialogue", "Кто-то уже вскрывал это до меня. Или наоборот — готовил к вскрытию.", "char_artem"),
    ],
    autoNextSceneId: "scene_ch01_yard",
  }),
  scene_ch01_after_max: scene("scene_ch01_after_max", {
    lines: [line("dialogue", "Макс, приезжай. Мне нужна вторая голова. Или хотя бы человек, который смеётся над моими шутками.", "char_artem")],
    autoNextSceneId: "scene_ch01_yard_max",
  }),
  scene_ch01_after_hide: scene("scene_ch01_after_hide", {
    lines: [line("narration", "Артём прячет посылку за холодильником и выходит без неё.")],
    autoNextSceneId: "scene_ch01_yard",
  }),
  scene_ch01_after_throw: scene("scene_ch01_after_throw", {
    lines: [
      line("narration", "Посылка летит в мусорный бак. На секунду Артёму кажется, что это правильное решение."),
      line("dialogue", "Вы отклонились от маршрута.", "char_sync"),
    ],
    autoNextSceneId: "scene_ch01_yard",
  }),

  scene_ch01_yard: scene("scene_ch01_yard", {
    title: "Двор — 08:45",
    lines: [
      line("narration", "Бублик подбегает к Артёму и начинает лаять на телефон."),
      line("dialogue", "Пёс умнее нас. Он уже понял, что источник проблемы — техника.", "char_artem"),
      line("narration", "Телефон вибрирует.\n\nИзменение маршрута.\nСледующая точка: кафе «Минута»."),
    ],
    choices: [
      choice("ch01_cafe", "Пойти в кафе «Минута»", "scene_ch02_cafe"),
      choice("ch01_warehouse", "Поехать на склад доставки", "scene_ch02_warehouse"),
      choice("ch01_orlova", "Пойти к инспектору Орловой", "scene_ch02_orlova"),
      choice("ch01_observe", "Игнорировать маршрут и наблюдать за городом", "scene_ch02_observe"),
    ],
  }),

  scene_ch01_yard_max: scene("scene_ch01_yard_max", {
    title: "Двор — 08:45",
    lines: [
      line("narration", "Бублик подбегает к Артёму и начинает лаять на телефон."),
      line("dialogue", "Пёс умнее нас. Он уже понял, что источник проблемы — техника.", "char_artem"),
      line("narration", "Макс появляется у подъезда."),
      line("dialogue", "Показывай коробку Судного дня.", "char_max"),
      line("dialogue", "Ты слишком быстро приехал.", "char_artem"),
      line("dialogue", "Я живу в десяти минутах.", "char_max"),
      line("dialogue", "Ты никогда не приходишь вовремя.", "char_artem"),
      line("dialogue", "Вот поэтому я тоже считаю это странным.", "char_max"),
      line("narration", "Телефон вибрирует.\n\nИзменение маршрута.\nСледующая точка: кафе «Минута»."),
    ],
    choices: [
      choice("ch01_cafe", "Пойти в кафе «Минута»", "scene_ch02_cafe"),
      choice("ch01_warehouse", "Поехать на склад доставки", "scene_ch02_warehouse"),
      choice("ch01_orlova", "Пойти к инспектору Орловой", "scene_ch02_orlova"),
      choice("ch01_observe", "Игнорировать маршрут и наблюдать за городом", "scene_ch02_observe"),
    ],
  }),
});

// ─── Глава 2 — Маршрут, которого нет ────────────────────────────────────────

writeChapter("ch02-route.json", {
  scene_ch02_cafe: scene("scene_ch02_cafe", {
    title: "Кафе «Минута» — 09:20",
    lines: [
      line("narration", "Тёплое кафе. За окном городская суета. У окна сидит Ника с камерой и ноутбуком."),
      line("dialogue", "Ты Артём?", "char_nika"),
      line("dialogue", "Зависит от того, кто спрашивает.", "char_artem"),
      line("dialogue", "Человек, который видел твоё фото в чужом телефоне.", "char_nika"),
      line("narration", "Она показывает снимок. На нём Артём стоит на перекрёстке вечером. Время на фото — 19:43."),
      line("dialogue", "Это невозможно. Сейчас утро.", "char_artem"),
      line("dialogue", "Вот поэтому я и позвала тебя.", "char_nika"),
      line("dialogue", "Ты меня не звала. Телефон отправил меня сюда.", "char_artem"),
      line("dialogue", "Тогда у нас проблема больше, чем я думала.", "char_nika"),
    ],
    choices: [
      choice("ch02a_tell_all", "Рассказать Нике всё", "scene_ch02_cafe_tell"),
      choice("ch02a_hide_truth", "Скрыть часть правды", "scene_ch02_cafe_hide"),
      choice("ch02a_take_photo", "Забрать фото и уйти", "scene_ch02_cafe_take"),
      choice("ch02a_cameras", "Попросить Нику проверить камеры", "scene_ch02_cafe_cameras"),
    ],
  }),
  scene_ch02_cafe_tell: scene("scene_ch02_cafe_tell", {
    lines: [line("dialogue", "Посылка, «Синхрон», повтор дня. Звучит безумно, но у меня есть улики.", "char_artem")],
    autoNextSceneId: "scene_ch03_evening",
  }),
  scene_ch02_cafe_hide: scene("scene_ch02_cafe_hide", {
    lines: [line("dialogue", "Странный заказ. Странный маршрут. Больше пока сказать не могу.", "char_artem")],
    autoNextSceneId: "scene_ch03_evening",
  }),
  scene_ch02_cafe_take: scene("scene_ch02_cafe_take", {
    lines: [line("narration", "Артём забирает фото и уходит. Ника не довольна.")],
    autoNextSceneId: "scene_ch03_evening",
  }),
  scene_ch02_cafe_cameras: scene("scene_ch02_cafe_cameras", {
    lines: [line("dialogue", "Проверь камеры на центральном перекрёстке. Особенно 19:43.", "char_artem")],
    autoNextSceneId: "scene_ch03_evening",
  }),

  scene_ch02_warehouse: scene("scene_ch02_warehouse", {
    title: "Склад доставки — 09:30",
    lines: [
      line("narration", "Ирина работает за компьютером."),
      line("dialogue", "Артём? У тебя маршрут уже изменён. Почему ты здесь?", "char_irina"),
      line("dialogue", "Пытаюсь понять, кто дал мне заказ без номера.", "char_artem"),
      line("dialogue", "Такого не бывает.", "char_irina"),
      line("dialogue", "Я тоже так думал полчаса назад.", "char_artem"),
      line("narration", "Ирина проверяет базу."),
      line("dialogue", "Заказ есть. Но он создан завтра.", "char_irina"),
      line("dialogue", "Прекрасно. Доставка из будущего. Надо поднять тариф.", "char_artem"),
      line("narration", "Поиск предметов — Склад доставки. Найдено 8 предметов:\n1. Складской жетон.\n2. Повреждённая накладная.\n3. Фирменная пломба коробки.\n4. Чужой пропуск.\n5. Мини-фонарик.\n6. Сканер с ошибкой.\n7. Кусок маршрутной карты.\n8. Визитка «Синхрон»."),
      line("dialogue", "Твой маршрут ведёт через пять мест, но система показывает только одно.", "char_irina"),
      line("dialogue", "Какое?", "char_artem"),
      line("dialogue", "Центральный перекрёсток. 19:43.", "char_irina"),
    ],
    choices: [
      choice("ch02b_docs", "Забрать документы", "scene_ch02_warehouse_docs"),
      choice("ch02b_help", "Попросить Ирину помочь", "scene_ch02_warehouse_help"),
      choice("ch02b_deliver", "Доставить посылку без вопросов", "scene_ch02_warehouse_deliver"),
      choice("ch02b_leave", "Оставить посылку на складе", "scene_ch02_warehouse_leave"),
    ],
  }),
  scene_ch02_warehouse_docs: scene("scene_ch02_warehouse_docs", {
    lines: [line("narration", "Артём забирает документы. Ещё две улики в кармане.")],
    autoNextSceneId: "scene_ch03_evening",
  }),
  scene_ch02_warehouse_help: scene("scene_ch02_warehouse_help", {
    lines: [line("dialogue", "Помоги мне разобраться. Я не хочу быть частью чужого эксперимента.", "char_artem")],
    autoNextSceneId: "scene_ch03_evening",
  }),
  scene_ch02_warehouse_deliver: scene("scene_ch02_warehouse_deliver", {
    lines: [line("narration", "Артём берёт посылку и едет по маршруту, не задавая вопросов.")],
    autoNextSceneId: "scene_ch03_evening",
  }),
  scene_ch02_warehouse_leave: scene("scene_ch02_warehouse_leave", {
    lines: [line("narration", "Посылка остаётся на складе. Телефон молчит слишком долго.")],
    autoNextSceneId: "scene_ch03_evening",
  }),

  scene_ch02_orlova: scene("scene_ch02_orlova", {
    title: "Кабинет Орловой — 10:05",
    lines: [
      line("dialogue", "Повторяющийся день, телефон сам отправляет маршруты, посылка из будущего.", "char_orlova"),
      line("dialogue", "Когда вы повторяете это вслух, я сам себе не верю.", "char_artem"),
      line("dialogue", "Это хорошо. Значит, связь с реальностью ещё есть.", "char_orlova"),
      line("narration", "Артём показывает квитанцию и фото."),
      line("dialogue", "Где вы это взяли?", "char_orlova"),
      line("dialogue", "У себя дома.", "char_artem"),
      line("dialogue", "На этом перекрёстке неделю назад уже была странная авария. Камеры отключились за сорок секунд до столкновения.", "char_orlova"),
      line("dialogue", "И это совпадение?", "char_artem"),
      line("dialogue", "Я не люблю совпадения. Они слишком часто оказываются чьей-то работой.", "char_orlova"),
    ],
    choices: [
      choice("ch02v_evidence", "Передать улики Орловой", "scene_ch02_orlova_evidence"),
      choice("ch02v_archive", "Попросить доступ к материалам дела", "scene_ch02_orlova_archive"),
      choice("ch02v_blame", "Сразу обвинить «Синхрон»", "scene_ch02_orlova_blame"),
      choice("ch02v_leave", "Уйти без объяснений", "scene_ch02_orlova_leave"),
    ],
  }),
  scene_ch02_orlova_evidence: scene("scene_ch02_orlova_evidence", {
    lines: [line("narration", "Орлова аккуратно раскладывает улики. Детективная линия открыта.")],
    autoNextSceneId: "scene_ch03_evening",
  }),
  scene_ch02_orlova_archive: scene("scene_ch02_orlova_archive", {
    lines: [line("dialogue", "Мне нужен доступ к материалам. Скоро.", "char_artem")],
    autoNextSceneId: "scene_ch03_evening",
  }),
  scene_ch02_orlova_blame: scene("scene_ch02_orlova_blame", {
    lines: [line("dialogue", "Это «Синхрон». Они управляют городом.", "char_artem")],
    autoNextSceneId: "scene_ch03_evening",
  }),
  scene_ch02_orlova_leave: scene("scene_ch02_orlova_leave", {
    lines: [line("narration", "Артём уходит, не объяснившись.")],
    autoNextSceneId: "scene_ch03_evening",
  }),

  scene_ch02_observe: scene("scene_ch02_observe", {
    title: "Городская улица — 09:15",
    lines: [
      line("narration", "Артём садится на остановке и наблюдает. Один и тот же мужчина роняет стакан кофе. Женщина в красном шарфе смотрит на часы. Светофор переключается на секунду раньше."),
      line("dialogue", "Город репетирует.", "char_artem"),
      line("narration", "На рекламном экране появляется текст:\n\nНе отклоняйтесь от маршрута."),
      line("dialogue", "А если отклонюсь?", "char_artem"),
      line("narration", "Экран меняется:\n\nПоследствия будут исправлены."),
    ],
    choices: [
      choice("ch02g_record", "Записать повторяющиеся события", "scene_ch02_observe_record"),
      choice("ch02g_help", "Нарушить повтор и помочь мужчине с кофе", "scene_ch02_observe_help"),
      choice("ch02g_follow", "Следовать подсказке экрана", "scene_ch02_observe_follow"),
      choice("ch02g_call_nika", "Позвонить Нике", "scene_ch02_observe_nika"),
    ],
  }),
  scene_ch02_observe_record: scene("scene_ch02_observe_record", {
    lines: [line("narration", "Артём записывает повторяющиеся события. Город ведёт себя как сценарий.")],
    autoNextSceneId: "scene_ch03_evening",
  }),
  scene_ch02_observe_help: scene("scene_ch02_observe_help", {
    lines: [line("narration", "Артём подхватывает стакан. Мужчина удивлён. Сценарий сбился.")],
    autoNextSceneId: "scene_ch03_evening",
  }),
  scene_ch02_observe_follow: scene("scene_ch02_observe_follow", {
    lines: [line("narration", "Артём следует подсказке экрана. Маршрут идеален — и пуст.")],
    autoNextSceneId: "scene_ch03_evening",
  }),
  scene_ch02_observe_nika: scene("scene_ch02_observe_nika", {
    lines: [line("dialogue", "Ника, мне кажется, город повторяет один и тот же день.", "char_artem")],
    autoNextSceneId: "scene_ch03_evening",
  }),
});

writeChapter("ch03-collapse.json", {
  scene_ch03_evening: scene("scene_ch03_evening", {
    title: "День продолжается",
    lines: [
      line("narration", "День тянется. Город живёт своей суетой. Часы приближаются к вечеру."),
      line("narration", "19:38. Центральный перекрёсток."),
    ],
    autoNextSceneId: "scene_ch03_crossroad",
  }),

  scene_ch03_crossroad: scene("scene_ch03_crossroad", {
    title: "Перекрёсток — 19:38",
    lines: [
      line("narration", "Вечер. Машины стоят у светофора. Люди идут домой. На билборде реклама «Синхрона»: «Город, который заботится о вас»."),
      line("narration", "Артём видит девушку с фото. Она идёт к переходу."),
      line("narration", "Телефон вибрирует.\n\nНе вмешивайтесь."),
      line("dialogue", "Вот теперь точно вмешаюсь.", "char_artem"),
      line("narration", "Светофор гаснет. Машины начинают двигаться не по правилам. Девушка замирает на переходе."),
    ],
    choices: [
      choice("ch03_save", "Броситься к девушке", "scene_ch03_action_save"),
      choice("ch03_deliver", "Защитить посылку и доставить её", "scene_ch03_action_deliver"),
      choice("ch03_film", "Снять происходящее на телефон", "scene_ch03_action_film"),
      choice("ch03_obey", "Следовать инструкции и не вмешиваться", "scene_ch03_action_obey"),
      choice("ch03_chaos", "Попытаться остановить всех хаотично", "scene_ch03_action_chaos"),
    ],
  }),

  scene_ch03_action_save: scene("scene_ch03_action_save", {
    lines: [line("narration", "Артём бросается к девушке. Мир сжимается до секунды перед ударом.")],
    autoNextSceneId: "scene_ch03_repeat",
  }),
  scene_ch03_action_deliver: scene("scene_ch03_action_deliver", {
    lines: [line("narration", "Артём прижимает посылку к груди и бежит по маршруту сквозь хаос.")],
    autoNextSceneId: "scene_ch03_repeat",
  }),
  scene_ch03_action_film: scene("scene_ch03_action_film", {
    lines: [line("narration", "Камера телефона фиксирует сбой светофора. Видео обрывается на 19:43.")],
    autoNextSceneId: "scene_ch03_repeat",
  }),
  scene_ch03_action_obey: scene("scene_ch03_action_obey", {
    lines: [line("narration", "Артём стоит неподвижно. Система довольна. Человек — нет.")],
    autoNextSceneId: "scene_ch03_repeat",
  }),
  scene_ch03_action_chaos: scene("scene_ch03_action_chaos", {
    lines: [line("narration", "Артём кричит, машет руками, пытается остановить поток. Хаос только растёт.")],
    autoNextSceneId: "scene_ch03_repeat",
  }),

  scene_ch03_repeat: scene("scene_ch03_repeat", {
    title: "Первый повтор",
    lines: [
      line("narration", "Звук тормозов. Вспышка. Чёрный экран."),
      line("dialogue", "Попытка неудачна. Повтор дня запущен.", "char_sync"),
      line("dialogue", "Нет. Подожди. Что случилось?", "char_artem"),
      line("dialogue", "Доброе утро, Артём Воронов.", "char_sync"),
      line("narration", "Переход к квартире. Снова 08:12."),
    ],
    actBreak: { enabled: true, title: "ГЛАВА 4 — ВТОРОЕ УТРО", backgroundKey: BG },
    autoNextSceneId: "scene_ch04_apartment",
  }),
});

buildRest(writeChapter, scene, line, choice, BG);
buildBranches(writeChapter, scene, line, choice, BG);
buildBranchesS(writeChapter, scene, line, choice, BG);

const sceneCount = fs
  .readdirSync(STORY_DIR)
  .filter((name) => name.endsWith(".json") && name !== "manifest.json")
  .reduce((sum, name) => {
    const data = JSON.parse(fs.readFileSync(path.join(STORY_DIR, name), "utf8"));
    return sum + Object.keys(data.scenes ?? {}).length;
  }, 0);

console.log(`Сборка завершена. Всего сцен: ${sceneCount}`);
