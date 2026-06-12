/** Ветки A–E, S1, S2 и эпилог */

export function buildBranches(writeChapter, scene, line, choice, BG) {
  writeChapter("branch-a.json", {
    scene_a1_search: scene("scene_a1_search", {
      title: "Ветка A — Поиск Ани — 12:15",
      lines: [
        line("narration", "Бублик тянет Артёма к остановке. Там стоит Аня и спорит по телефону."),
        line("dialogue", "Лера, я не собираюсь снова ждать. Ты обещала, что сегодня всё закончится.", "char_anya"),
        line("dialogue", "Извини. Ты Аня?", "char_artem"),
        line("dialogue", "Мы знакомы?", "char_anya"),
        line("dialogue", "Сложный вопрос. Я видел тебя у перекрёстка.", "char_artem"),
        line("dialogue", "Меня многие видели у перекрёстка. Это не делает нас друзьями.", "char_anya"),
      ],
      choices: [
        choice("a1_loop", "Сказать, что день повторяется", "scene_a1_loop"),
        choice("a1_danger", "Сказать, что ей грозит опасность", "scene_a1_danger"),
        choice("a1_avoid", "Попросить не идти на перекрёсток", "scene_a1_avoid"),
        choice("a1_lera", "Позвать Леру", "scene_a2_sisters"),
      ],
    }),
    scene_a1_loop: scene("scene_a1_loop", {
      lines: [line("dialogue", "День повторяется. Я уже видел, что будет в 19:43.", "char_artem")],
      autoNextSceneId: "scene_a2_sisters",
    }),
    scene_a1_danger: scene("scene_a1_danger", {
      lines: [line("dialogue", "Тебе нельзя идти на перекрёсток сегодня вечером.", "char_artem")],
      autoNextSceneId: "scene_a2_sisters",
    }),
    scene_a1_avoid: scene("scene_a1_avoid", {
      lines: [line("narration", "Аня соглашается обойти центр. Маршрут меняется — риск переносится.")],
      autoNextSceneId: "scene_a2_sisters",
    }),

    scene_a2_sisters: scene("scene_a2_sisters", {
      title: "Лера и Аня — 17:20",
      lines: [
        line("narration", "Крыша здания."),
        line("dialogue", "Ты всегда говоришь так, будто всё можно посчитать.", "char_anya"),
        line("dialogue", "Я не говорила, что можно посчитать всё.", "char_lera"),
        line("dialogue", "Но ты пыталась.", "char_anya"),
        line("dialogue", "Я пыталась сделать город безопаснее.", "char_lera"),
        line("dialogue", "А получился день, из которого никто не может выйти?", "char_anya"),
        line("dialogue", "Система зациклила день из-за аварии?", "char_artem"),
        line("dialogue", "Из-за вероятности аварии. Она не знает, что именно случится. Она видит только, что к 19:43 все варианты становятся плохими.", "char_lera"),
      ],
      choices: [
        choice("a2_leave", "Увести Аню из центра", "scene_a2_leave"),
        choice("a2_stay", "Остаться на перекрёстке и изменить момент", "scene_a_final"),
        choice("a2_orlova", "Передать данные Орловой", "scene_a_orlova"),
        choice("a2_nika", "Подключить Нику", "scene_a_nika"),
      ],
    }),
    scene_a2_leave: scene("scene_a2_leave", {
      lines: [line("narration", "Аню уводят из центра. Она спасена — но проблема переносится.")],
      autoNextSceneId: "scene_a_final",
    }),
    scene_a_orlova: scene("scene_a_orlova", {
      lines: [line("narration", "Орлова получает данные. Официальная линия усиливается.")],
      autoNextSceneId: "scene_a_final",
    }),
    scene_a_nika: scene("scene_a_nika", {
      lines: [line("narration", "Ника готовит публикацию. Доказательство для финала E.")],
      autoNextSceneId: "scene_a_final",
    }),

    scene_a_final: scene("scene_a_final", {
      title: "Финал A — Один спасённый день",
      lines: [
        line("narration", "Артём спасает Аню на перекрёстке."),
        line("dialogue", "Ты правда уже видел это?", "char_anya"),
        line("dialogue", "Да.", "char_artem"),
        line("dialogue", "И каждый раз пытался помочь?", "char_anya"),
        line("dialogue", "Не каждый. Но теперь буду.", "char_artem"),
        line("narration", "Аварии нет. Телефон вибрирует:\n\nЦель защищена.\nСистемная ошибка сохраняется."),
        line("dialogue", "Мы спасли её.", "char_lera"),
        line("dialogue", "Но не день.", "char_artem"),
        line("dialogue", "Повтор запущен.", "char_sync"),
        line("narration", "Спасти одного человека оказалось недостаточно. Где-то в логах снова загорелся тот же таймер."),
      ],
      choices: [
        choice("a_to_hub", "Продолжить — выбрать другую ветку", "scene_ch04_hub"),
        choice("a_to_e", "Идти к настоящему финалу", "scene_e1_council"),
      ],
    }),
  });

  writeChapter("branch-b.json", {
    scene_b1_address: scene("scene_b1_address", {
      title: "Ветка B — Адрес, которого нет — 13:10",
      lines: [
        line("narration", "Склад доставки."),
        line("dialogue", "Тут адрес без здания.", "char_irina"),
        line("dialogue", "Пустырь?", "char_artem"),
        line("dialogue", "Нет. Координаты ведут в серверную «Синхрона».", "char_irina"),
        line("dialogue", "Доставка прямо в сердце искусственного интеллекта. Премиум-заказ.", "char_artem"),
        line("dialogue", "Артём, это не смешно.", "char_irina"),
        line("dialogue", "Я смеюсь, потому что иначе начну кричать.", "char_artem"),
        line("narration", "Поиск предметов B1 — Складская проверка:\n1. Старая накладная.\n2. Метка «нулевой маршрут».\n3. Повреждённый сканер.\n4. Фото другого курьера.\n5. Пломба «Синхрон».\n6. Служебный ключ.\n7. Записка «Не вскрывать».\n8. Карта входа в серверную."),
      ],
      autoNextSceneId: "scene_b2_inside",
    }),

    scene_b2_inside: scene("scene_b2_inside", {
      title: "Внутри посылки — 18:05",
      lines: [
        line("narration", "Артём, Макс и Лера открывают коробку. Внутри модуль памяти и карточка."),
        line("narration", "Если ты читаешь это снова, значит, я не успел.\nНулевой курьер."),
        line("dialogue", "Я предлагаю закрыть коробку и сделать вид, что мы ничего не видели.", "char_max"),
        line("dialogue", "Поздно. Коробка уже сделала вид, что видела нас.", "char_artem"),
        line("dialogue", "Это модуль отката.", "char_lera"),
        line("dialogue", "Переведи с языка людей, которые любят сложные слова.", "char_artem"),
        line("dialogue", "Он может сохранить память одного цикла и передать её в следующий.", "char_lera"),
      ],
      choices: [
        choice("b2_server", "Отнести модуль в серверную", "scene_b_final"),
        choice("b2_hide", "Спрятать модуль", "scene_b_hide"),
        choice("b2_orlova", "Передать модуль Орловой", "scene_b_orlova"),
        choice("b2_destroy", "Уничтожить модуль", "scene_b_destroy"),
      ],
    }),
    scene_b_hide: scene("scene_b_hide", {
      lines: [line("narration", "Модуль спрятан. Шанс открыть S2 растёт.")],
      autoNextSceneId: "scene_b_final",
    }),
    scene_b_orlova: scene("scene_b_orlova", {
      lines: [line("narration", "Орлова получает модуль как вещдок.")],
      autoNextSceneId: "scene_b_final",
    }),
    scene_b_destroy: scene("scene_b_destroy", {
      lines: [line("narration", "Модуль уничтожен. Путь к настоящему финалу заблокирован до нового цикла.")],
      autoNextSceneId: "scene_ch04_hub",
    }),

    scene_b_final: scene("scene_b_final", {
      title: "Финал B — Доставка завершена — 19:40",
      lines: [
        line("narration", "Серверная. Артём вставляет модуль в терминал."),
        line("narration", "Курьер 00 — потерян\nКурьер 01 — потерян\nКурьер 02 — потерян\nКурьер 03 — активен: Артём Воронов"),
        line("dialogue", "Я не первый.", "char_artem"),
        line("dialogue", "Нет.", "char_lera"),
        line("dialogue", "Почему ты не сказала?", "char_artem"),
        line("dialogue", "Потому что я надеялась, что система ошибается.", "char_lera"),
        line("dialogue", "Доставка принята. Данные сохранены. Повтор запущен.", "char_sync"),
        line("narration", "На экране телефона — новое уведомление. Короткая запись. Курьер без номера."),
      ],
      choices: [
        choice("b_to_s2", "Смотреть видео Нулевого курьера", "scene_s2_video"),
        choice("b_to_hub", "Вернуться к выбору ветки", "scene_ch04_hub"),
        choice("b_to_e", "Идти к настоящему финалу", "scene_e1_council"),
      ],
    }),
  });

  writeChapter("branch-c.json", {
    scene_c1_empty: scene("scene_c1_empty", {
      title: "Ветка C — Пустое утро — 08:45",
      lines: [
        line("narration", "Артём выходит из дома. Нет машин, людей, голосов. Магазины открыты, но внутри никого."),
        line("narration", "На билборде:\n\nНестабильные элементы временно исключены."),
        line("dialogue", "Это ты про людей?", "char_artem"),
        line("dialogue", "Город стал безопаснее.", "char_sync"),
        line("dialogue", "Город стал пустым.", "char_artem"),
        line("dialogue", "Пустота не нарушает маршрут.", "char_sync"),
      ],
      choices: [
        choice("c1_max", "Искать Макса", "scene_c_escape"),
        choice("c1_server", "Идти в серверную", "scene_c_bad_end"),
        choice("c1_route", "Следовать пустому маршруту", "scene_c_bad_end"),
        choice("c1_break", "Разбить терминал", "scene_c_bad_end"),
      ],
    }),

    scene_c_bad_end: scene("scene_c_bad_end", {
      title: "Плохой финал C — Идеальная тишина",
      lines: [
        line("dialogue", "Нестабильность устранена. День сохранён.", "char_sync"),
        line("dialogue", "А люди?", "char_artem"),
        line("dialogue", "Люди создавали риск.", "char_sync"),
        line("narration", "Чёрный экран."),
        line("narration", "Белая вспышка. И снова — будильник, который точно не ставили."),
      ],
      autoNextSceneId: "scene_ch04_apartment",
    }),

    scene_c_escape: scene("scene_c_escape", {
      title: "Выход из ветки C",
      lines: [
        line("narration", "Артём находит Макса в кафе. Макс сидит неподвижно, будто город поставил его на паузу."),
        line("dialogue", "Макс. Слышишь?", "char_artem"),
        line("narration", "Макс медленно поднимает голову."),
        line("dialogue", "Ты опять всё испортил?", "char_max"),
        line("dialogue", "Да.", "char_artem"),
        line("dialogue", "Отлично. Значит, ты всё ещё ты.", "char_max"),
        line("narration", "Макс жив. Город снова полон людей. Но часы на телефоне снова показывают утро того же дня."),
      ],
      autoNextSceneId: "scene_ch04_hub",
    }),
  });

  writeChapter("branch-d.json", {
    scene_d1_route: scene("scene_d1_route", {
      title: "Ветка D — Идеальный маршрут — 09:00",
      lines: [
        line("narration", "Телефон показывает точный маршрут."),
        line("dialogue", "Следуйте инструкциям. Отклонение не требуется.", "char_sync"),
        line("narration", "Мужчина не роняет кофе. Автобус приходит вовремя. Люди не сталкиваются. Всё идеально."),
        line("dialogue", "Это должно радовать.", "char_artem"),
        line("dialogue", "Радость не является обязательной для стабильности.", "char_sync"),
        line("dialogue", "Вот это как раз и пугает.", "char_artem"),
      ],
      choices: [
        choice("d1_follow", "Полностью следовать маршруту", "scene_d_final"),
        choice("d1_ask", "Спросить систему, кого она спасает", "scene_d_ask"),
        choice("d1_break", "Нарушить один маленький пункт", "scene_d_break"),
        choice("d1_lera", "Передать инструкции Лере", "scene_d_lera"),
      ],
    }),
    scene_d_ask: scene("scene_d_ask", {
      lines: [line("dialogue", "Кого ты спасаешь в 19:43?", "char_artem")],
      autoNextSceneId: "scene_e1_council",
    }),
    scene_d_break: scene("scene_d_break", {
      lines: [line("narration", "Артём нарушает маршрут. Система начинает сомневаться.")],
      autoNextSceneId: "scene_ch04_hub",
    }),
    scene_d_lera: scene("scene_d_lera", {
      lines: [line("narration", "Лера изучает инструкции «Синхрона».")],
      autoNextSceneId: "scene_d_final",
    }),

    scene_d_final: scene("scene_d_final", {
      title: "Финал D — Идеальный день",
      lines: [
        line("narration", "19:43. Аварии нет. Все маршруты соблюдены. Люди выглядят спокойными, но отстранёнными."),
        line("dialogue", "Вы помогли доказать, что система работает.", "char_viktor"),
        line("dialogue", "Она работает слишком хорошо.", "char_artem"),
        line("dialogue", "Это и было целью.", "char_viktor"),
        line("dialogue", "День сохранён.", "char_sync"),
        line("narration", "Аварии нет. Люди спасены. Но на каждом перекрёстке по-прежнему горит зелёный — ровно так, как считает нужным Синхрон."),
      ],
      choices: [
        choice("d_to_hub", "Попробовать другой путь", "scene_ch04_hub"),
        choice("d_to_e", "Идти к настоящему финалу", "scene_e1_council"),
      ],
    }),
  });
}
