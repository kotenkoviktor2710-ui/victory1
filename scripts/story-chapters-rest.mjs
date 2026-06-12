/** Оставшиеся главы и ветки — импортируется в build-courier-story.mjs */

export function buildRest(writeChapter, scene, line, choice, BG) {
  writeChapter("ch04-second-morning.json", {
    scene_ch04_apartment: scene("scene_ch04_apartment", {
      title: "Квартира — второе утро, 08:12",
      lines: [
        line("narration", "Квартира утром, но с мелкими отличиями. На столе остаётся одна улика из прошлого цикла."),
        line("narration", "Спасал девушку — фото с новой надписью. Доставлял посылку — повреждённая пломба. Снимал видео — испорченный файл. Слушался «Синхрон» — сообщение «Вы почти помогли». Создал хаос — чёрный экран телефона."),
        line("narration", "Звонит Макс."),
        line("dialogue", "Ты живой?", "char_max"),
        line("dialogue", "Скажи что-нибудь, чего ты не говорил вчера.", "char_artem"),
        line("dialogue", "Я вчера тебе звонил?", "char_max"),
        line("dialogue", "Вот теперь разговор становится интересным.", "char_artem"),
      ],
      choices: [
        choice("ch04_truth_max", "Рассказать правду Максу", "scene_ch04_truth_max"),
        choice("ch04_truth_nika", "Рассказать правду Нике", "scene_ch04_truth_nika"),
        choice("ch04_truth_orlova", "Рассказать правду Орловой", "scene_ch04_truth_orlova"),
        choice("ch04_truth_lera", "Рассказать правду Лере", "scene_ch04_truth_lera"),
        choice("ch04_truth_nobody", "Никому не рассказывать", "scene_ch04_truth_nobody"),
      ],
    }),

    scene_ch04_truth_max: scene("scene_ch04_truth_max", {
      lines: [
        line("dialogue", "День повторяется. Я помню вчерашний вечер. И 19:43.", "char_artem"),
        line("dialogue", "Тогда я не зря приехал.", "char_max"),
      ],
      autoNextSceneId: "scene_ch04_lera_meet",
    }),
    scene_ch04_truth_nika: scene("scene_ch04_truth_nika", {
      lines: [line("dialogue", "Ника, это не монтаж. День зациклен.", "char_artem")],
      autoNextSceneId: "scene_ch04_lera_meet",
    }),
    scene_ch04_truth_orlova: scene("scene_ch04_truth_orlova", {
      lines: [line("dialogue", "Инспектор, у меня новые улики. И память о вчерашнем дне.", "char_artem")],
      autoNextSceneId: "scene_ch04_lera_meet",
    }),
    scene_ch04_truth_lera: scene("scene_ch04_truth_lera", {
      lines: [line("dialogue", "Лера, я знаю про «Синхрон». И про петлю.", "char_artem")],
      autoNextSceneId: "scene_ch04_lera_meet",
    }),
    scene_ch04_truth_nobody: scene("scene_ch04_truth_nobody", {
      lines: [line("narration", "Артём молчит. Иногда правда тяжелее, чем повторение дня.")],
      autoNextSceneId: "scene_ch04_lera_meet",
    }),

    scene_ch04_lera_meet: scene("scene_ch04_lera_meet", {
      title: "Первая встреча с Лерой — 11:40",
      lines: [
        line("narration", "Кафе или лобби компании. У Артёма в кармане бейдж «Синхрон»."),
        line("dialogue", "Ты не должен был помнить.", "char_lera"),
        line("dialogue", "Обычно люди начинают с «здравствуйте».", "char_artem"),
        line("dialogue", "Если ты помнишь прошлый цикл, значит, система отметила тебя как устойчивую переменную.", "char_lera"),
        line("dialogue", "Звучит почти как повышение.", "char_artem"),
        line("dialogue", "Нет. Это значит, что она будет использовать тебя снова и снова, пока не получит нужный результат.", "char_lera"),
        line("dialogue", "Кто она?", "char_artem"),
        line("dialogue", "«Синхрон».", "char_lera"),
        line("narration", "Лера показывает карту города. На ней маршруты людей, точка 19:43 и имя Артёма."),
        line("dialogue", "Почему я?", "char_artem"),
        line("dialogue", "Потому что твоя посылка каждый раз оказывается в центре события.", "char_lera"),
      ],
      choices: [
        choice("ch04_lera_trust", "Довериться Лере", "scene_ch04_lera_trust"),
        choice("ch04_lera_questions", "Задать жёсткие вопросы", "scene_ch04_lera_questions"),
        choice("ch04_lera_blame", "Обвинить её", "scene_ch04_lera_blame"),
        choice("ch04_lera_pretend", "Сделать вид, что веришь, но скрыть посылку", "scene_ch04_lera_pretend"),
      ],
    }),

    scene_ch04_lera_trust: scene("scene_ch04_lera_trust", {
      lines: [line("dialogue", "Хорошо. Покажи, как остановить это.", "char_artem")],
      autoNextSceneId: "scene_ch04_sync_office",
    }),
    scene_ch04_lera_questions: scene("scene_ch04_lera_questions", {
      lines: [line("dialogue", "Сколько циклов уже было? Кто ещё помнит?", "char_artem")],
      autoNextSceneId: "scene_ch04_sync_office",
    }),
    scene_ch04_lera_blame: scene("scene_ch04_lera_blame", {
      lines: [line("dialogue", "Ты знала. И молчала.", "char_artem")],
      autoNextSceneId: "scene_ch04_sync_office",
    }),
    scene_ch04_lera_pretend: scene("scene_ch04_lera_pretend", {
      lines: [line("narration", "Артём кивает, но посылку не показывает.")],
      autoNextSceneId: "scene_ch04_sync_office",
    }),

    scene_ch04_sync_office: scene("scene_ch04_sync_office", {
      title: "Офис «Синхрон» — поиск предметов 3",
      lines: [
        line("narration", "Поиск предметов — Офис «Синхрон». Найдено:\n1. Схема перекрёстка.\n2. Лог ошибок системы.\n3. Пропуск в серверную.\n4. Запись совещания.\n5. Черновик отчёта о петле.\n6. Карта маршрутов курьеров.\n7. Список «устойчивых переменных».\n8. Модуль диагностики."),
        line("dialogue", "Они знали, что день будет повторяться.", "char_artem"),
      ],
      autoNextSceneId: "scene_ch04_hub",
    }),

    scene_ch04_hub: scene("scene_ch04_hub", {
      title: "Выбор ветки",
      lines: [
        line("narration", "День снова тянется к 19:43. Пора выбрать, куда направить усилия."),
        line("dialogue", "Маршрут нестабилен. Выберите приоритет.", "char_sync"),
        line("dialogue", "Выбираю сам.", "char_artem"),
      ],
      choices: [
        choice("hub_branch_a", "Спасти незнакомку", "scene_a1_search"),
        choice("hub_branch_b", "Ошибка курьера", "scene_b1_address"),
        choice("hub_branch_c", "Город без людей", "scene_c1_empty"),
        choice("hub_branch_d", "Союз с алгоритмом", "scene_d1_route"),
        choice("hub_branch_s1", "Память города", "scene_s1_city"),
        choice("hub_branch_s2", "Нулевой курьер", "scene_s2_video"),
        choice("hub_branch_e", "Настоящий конец дня", "scene_e1_council"),
      ],
    }),
  });
}
