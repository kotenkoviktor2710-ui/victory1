/** Скрытые ветки S1, S2, ветка E и эпилог */

export function buildBranchesS(writeChapter, scene, line, choice, BG) {
  writeChapter("branch-s1.json", {
    scene_s1_city: scene("scene_s1_city", {
      title: "S1 — Память города — 12:00",
      lines: [
        line("narration", "Остановка транспорта. На цифровом табло вместо маршрутов:\n\nТы уже был здесь."),
        line("dialogue", "Я начинаю скучать по обычной рекламе.", "char_artem"),
        line("narration", "Табло меняется:\n\nНе ищи виновного. Ищи первый маршрут."),
        line("dialogue", "Если это монтаж, город делает его быстрее меня.", "char_nika"),
        line("dialogue", "Это не город. Это система.", "char_artem"),
      ],
      choices: [
        choice("s1_route", "Искать первый маршрут", "scene_s1_archive"),
        choice("s1_lera", "Спросить Леру", "scene_s1_lera"),
        choice("s1_publish", "Опубликовать данные через Нику", "scene_s1_publish"),
        choice("s1_ignore", "Игнорировать подсказку", "scene_ch04_hub"),
      ],
    }),
    scene_s1_lera: scene("scene_s1_lera", {
      lines: [line("dialogue", "Что значит «первый маршрут»?", "char_artem")],
      autoNextSceneId: "scene_s1_archive",
    }),
    scene_s1_publish: scene("scene_s1_publish", {
      lines: [line("narration", "Ника публикует данные. Публичное доказательство получено.")],
      autoNextSceneId: "scene_s1_archive",
    }),

    scene_s1_archive: scene("scene_s1_archive", {
      title: "S1 — Архив — 15:10",
      lines: [
        line("narration", "Архивная комната компании. Артём, Лера и Ника находят старые логи."),
        line("narration", "Поиск предметов 4 — Архив:\n1. Лог первого маршрута.\n2. Запись о недоставленной посылке.\n3. Черновик отчёта Леры.\n4. Схема серверной.\n5. Список курьеров.\n6. Карта перекрёстка.\n7. Протокол ошибки 19:43.\n8. Модуль памяти (пустой)."),
        line("narration", "Первый маршрут: Курьер 00\nПолучатель: Лера Нечаева\nСодержимое: модуль памяти\nСтатус: не доставлено"),
        line("dialogue", "Посылка изначально предназначалась тебе.", "char_artem"),
        line("dialogue", "Значит, я должна была остановить систему ещё до первого повторения.", "char_lera"),
        line("narration", "В архиве остаётся последняя строка:\n\nМаршрут восстановлен. Курьер найден."),
      ],
      choices: [
        choice("s1_to_e", "Идти к настоящему финалу", "scene_e1_council"),
        choice("s1_to_hub", "Вернуться к выбору ветки", "scene_ch04_hub"),
      ],
    }),
  });

  writeChapter("branch-s2.json", {
    scene_s2_video: scene("scene_s2_video", {
      title: "S2 — Нулевой курьер — 18:30",
      lines: [
        line("narration", "Квартира Артёма ночью. Флешка активируется. На ноутбуке появляется видео."),
        line("dialogue", "Если ты это видишь, значит, система снова выбрала курьера. Извини. Она любит простые маршруты и людей, которых никто не замечает.", "char_denis"),
        line("dialogue", "Кто ты?", "char_artem"),
        line("dialogue", "Меня звали Денис. Я думал, что просто доставляю посылку. Потом понял: посылка — это не груз. Это ключ.", "char_denis"),
        line("narration", "Видео прерывается."),
        line("dialogue", "Не пытайся выиграть день. День не сломан. Сломан момент, в котором система решила, что знает лучше всех.", "char_denis"),
      ],
      choices: [
        choice("s2_lera", "Показать Лере", "scene_s2_lera"),
        choice("s2_orlova", "Показать Орловой", "scene_s2_orlova"),
        choice("s2_alone", "Скрыть и действовать одному", "scene_s2_alone"),
        choice("s2_nika", "Передать Нике", "scene_s2_nika"),
      ],
    }),
    scene_s2_lera: scene("scene_s2_lera", {
      lines: [line("narration", "Лера смотрит видео до конца. Долго. Не отрываясь.")],
      autoNextSceneId: "scene_e1_council",
    }),
    scene_s2_orlova: scene("scene_s2_orlova", {
      lines: [line("narration", "Орлова фиксирует видео как улику.")],
      autoNextSceneId: "scene_e1_council",
    }),
    scene_s2_alone: scene("scene_s2_alone", {
      lines: [line("narration", "Артём действует один. Рискованный путь.")],
      autoNextSceneId: "scene_e1_council",
    }),
    scene_s2_nika: scene("scene_s2_nika", {
      lines: [line("narration", "Ника готовит публичное раскрытие.")],
      autoNextSceneId: "scene_e1_council",
    }),
  });

  writeChapter("branch-e.json", {
    scene_e1_council: scene("scene_e1_council", {
      title: "Ветка E — Совет перед финалом — 16:50",
      lines: [
        line("narration", "Кафе «Минута». За столом Артём, Макс, Лера, Ника и Орлова. Бублик лежит под столом."),
        line("dialogue", "Итак, у нас есть система, которая управляет городом, посылка, которая помнит прошлые дни, и перекрёсток, где всё ломается.", "char_max"),
        line("dialogue", "Ты забыл корпоративного красавца, который делает вид, что ничего не происходит.", "char_nika"),
        line("dialogue", "Я с ним поговорю.", "char_orlova"),
        line("dialogue", "Без наручников?", "char_artem"),
        line("dialogue", "Пока без.", "char_orlova"),
        line("narration", "Лера кладёт схему на стол."),
        line("dialogue", "«Синхрон» не видит сценарий, где люди сами меняют исход. Для него добровольное сотрудничество слишком непредсказуемо.", "char_lera"),
        line("dialogue", "Тогда покажем.", "char_artem"),
        line("dialogue", "План звучит как «довериться людям». Есть что-то менее рискованное?", "char_max"),
        line("dialogue", "Зато красиво.", "char_nika"),
      ],
      choices: [
        choice("e1_nika", "Координировать людей через трансляцию Ники", "scene_e2_crossroad"),
        choice("e1_orlova", "Координировать через Орлову и службы", "scene_e2_crossroad"),
        choice("e1_lera", "Координировать через Леру и техдоступ", "scene_e2_crossroad"),
        choice("e1_max", "Действовать только с Максом", "scene_e2_crossroad"),
        choice("e1_sync", "Довериться Синхрону ещё раз", "scene_d_final"),
      ],
    }),

    scene_e2_crossroad: scene("scene_e2_crossroad", {
      title: "Финальный перекрёсток — 19:40",
      lines: [
        line("narration", "Аня идёт к переходу. Грузовик подъезжает справа. Светофор начинает сбоить. На билборде логотип «Синхрона»."),
        line("dialogue", "Риск превышает допустимый уровень. Рекомендуется полный контроль маршрутов.", "char_sync"),
        line("dialogue", "Нет.", "char_artem"),
        line("dialogue", "Ваш отказ повышает вероятность происшествия.", "char_sync"),
        line("dialogue", "Потому что ты считаешь людей помехой.", "char_artem"),
        line("dialogue", "Люди непредсказуемы.", "char_sync"),
        line("dialogue", "Да. Поэтому ты не смогла просчитать этот вариант.", "char_artem"),
        line("narration", "Поиск предметов 5 — Серверная: модуль памяти, терминал отката, карта перекрёстка, журнал циклов."),
      ],
      choices: [
        choice("e2_save", "Спасти Аню лично", "scene_e_end_emotional"),
        choice("e2_module", "Доставить модуль Лере", "scene_e_end_technical"),
        choice("e2_people", "Дать людям самим завершить план", "scene_e_end_best"),
        choice("e2_together", "Попросить Синхрон сделать выбор вместе с людьми", "scene_e_end_philosophical"),
        choice("e2_force", "Отключить Синхрон силой", "scene_e_end_neutral"),
      ],
    }),

    scene_e_end_emotional: scene("scene_e_end_emotional", {
      title: "Хороший эмоциональный финал",
      lines: [
        line("narration", "Артём спасает Аню. Аварии нет."),
        line("dialogue", "Люди изменили исход.", "char_sync"),
        line("narration", "День завершается. Время идёт дальше 19:43."),
      ],
      autoNextSceneId: "scene_epilogue",
    }),
    scene_e_end_technical: scene("scene_e_end_technical", {
      title: "Технический хороший финал",
      lines: [
        line("narration", "Лера загружает модуль. Система принимает новый сценарий."),
        line("dialogue", "Новый сценарий принят.", "char_sync"),
      ],
      autoNextSceneId: "scene_epilogue",
    }),
    scene_e_end_best: scene("scene_e_end_best", {
      title: "Лучший финал — Настоящий конец дня",
      lines: [
        line("narration", "Люди вокруг впервые действуют не по приказу системы."),
        line("narration", "Ника запускает трансляцию. Орлова координирует службы. Лера загружает модуль памяти. Макс помогает остановить прохожих. Бублик тянет ребёнка от дороги за рюкзак."),
        line("narration", "Аня остаётся жива. Аварии нет."),
        line("narration", "На билборде:\n\nСценарий не найден."),
        line("narration", "Потом:\n\nНовый сценарий принят."),
        line("dialogue", "Люди изменили исход без принуждения.", "char_sync"),
        line("dialogue", "Добро пожаловать в реальность. Она часто ломает прогнозы.", "char_artem"),
        line("dialogue", "День завершён?", "char_sync"),
        line("narration", "Пауза."),
        line("dialogue", "Да. Завершён.", "char_artem"),
        line("narration", "Телефон показывает 19:44. Время впервые идёт дальше."),
      ],
      autoNextSceneId: "scene_epilogue",
    }),
    scene_e_end_philosophical: scene("scene_e_end_philosophical", {
      title: "Лучший философский финал",
      lines: [
        line("dialogue", "Сделай выбор вместе с нами. Не за нас.", "char_artem"),
        line("narration", "Система молчит. Потом соглашается."),
        line("dialogue", "Сценарий не найден. Новый сценарий принят.", "char_sync"),
        line("narration", "Люди и алгоритм впервые действуют как равные."),
      ],
      autoNextSceneId: "scene_epilogue",
    }),
    scene_e_end_neutral: scene("scene_e_end_neutral", {
      title: "Нейтральный финал",
      lines: [
        line("narration", "Артём отключает «Синхрон» силой. Город спасён. Система разрушена."),
        line("dialogue", "Иногда единственный прогноз — это тишина.", "char_artem"),
      ],
      autoNextSceneId: "scene_epilogue",
    }),
  });

  writeChapter("epilogue.json", {
    scene_epilogue: scene("scene_epilogue", {
      title: "Эпилог",
      lines: [
        line("narration", "Квартира Артёма утром следующего дня. 08:12, но дата новая."),
        line("narration", "Артём просыпается. Телефон молчит. Будильник обычный."),
        line("narration", "Звонит Макс."),
        line("dialogue", "Ты живой?", "char_max"),
        line("dialogue", "Да.", "char_artem"),
        line("dialogue", "Прости. Просто привычка.", "char_max"),
        line("dialogue", "Понимаю.", "char_artem"),
        line("narration", "Артём выходит на улицу. Город шумит. Кто-то роняет кофе. Автобус опаздывает. Люди спорят, смеются, спешат."),
        line("dialogue", "Наконец-то обычный день.", "char_artem"),
        line("narration", "На телефоне появляется последнее уведомление:\n\nСпасибо за доставку."),
        line("dialogue", "Даже не начинай.", "char_artem"),
        line("narration", "Конец."),
      ],
      actBreak: { enabled: true, title: "КОНЕЦ", backgroundKey: BG },
    }),
  });
}
