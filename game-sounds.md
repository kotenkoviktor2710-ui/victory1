# Звуки для «Последний День Курьера»

Список для поиска на [Freesound](https://freesound.org). В проекте **пока нет аудиофайлов** — только слайдеры «Музыка» и «Звуковые эффекты» в настройках. Ниже — что понадобится при подключении звука.

**Формат:** предпочтительно `.ogg` или `.mp3`, короткие SFX — моно, музыка — стерео, loop-friendly для BGM.

**Лицензия на Freesound:** CC0 или CC BY (с указанием автора в credits).

---

## 1. Музыка (BGM) — ~12 треков

Фоновая музыка по локациям (`backgroundKey`). Каждый трек — **2–4 мин**, seamless loop, без резких концовок.

| ID | Локация | Настроение | Поиск на Freesound |
|----|---------|------------|-------------------|
| `bgm_menu` | Главное меню | Тревожный глитч, город, ночь, лёгкая пульсация | `dark ambient city loop`, `glitch atmospheric`, `dystopian menu` |
| `bgm_apartment` | Квартира (BG_01) | Утро, тихий быт, лёгкая тревога | `morning apartment ambient`, `soft piano uneasy`, `domestic calm loop` |
| `bgm_yard` | Двор (BG_02) | Двор, ветер, далёкий город | `courtyard ambient`, `suburban morning`, `birds distant traffic` |
| `bgm_cafe` | Кафе «Минута» (BG_03) | Уютное кафе, приглушённые разговоры | `cafe ambience loop`, `coffee shop background`, `warm jazz soft` |
| `bgm_warehouse` | Склад (BG_04) | Промзона, эхо, гул вентиляции | `warehouse ambient`, `industrial hum loop`, `storage room` |
| `bgm_office` | Кабинет / офис Орловой (BG_05) | Деловой, холодный, напряжение | `office tension ambient`, `investigation subtle`, `paper clock tick` |
| `bgm_street` | Улица (BG_06) | Городской день, шаги, машины | `city street day loop`, `urban pedestrian ambient` |
| `bgm_evening` | Вечер / переход к финалу (BG_07) | Закат, нарастающее напряжение | `evening city tension`, `sunset urban ambient` |
| `bgm_crossroad` | Перекрёсток 19:38–19:43 (BG_08) | Драма, тиканье, светофор, петля | `suspense countdown ambient`, `traffic light tension`, `time loop dark` |
| `bgm_sync_office` | Офис «Синхрон» (BG_10) | Холодный техно, серверный гул, стерильность | `server room ambient`, `sci-fi corporate`, `digital cold loop` |
| `bgm_server` | Серверная (ветки B, E) | Низкий гул, вентиляторы, пульс системы | `data center hum`, `computer room loop`, `cyber basement` |
| `bgm_epilogue` | Эпилог (BG_16) | Облегчение, живой город, тёплый финал | `hopeful city morning`, `relief ambient`, `new day calm` |

**Дополнительно (варианты финалов):**

| ID | Когда | Настроение | Поиск |
|----|-------|------------|-------|
| `bgm_ending_good` | Лучшие концовки E | Тёплый, человечный | `bittersweet resolution`, `emotional hopeful` |
| `bgm_ending_bad` | Финал C (тишина) | Пустота, стерильная тишина | `empty sterile ambient`, `void silence drone` |
| `bgm_ending_neutral` | Нейтральный / технический финал | Ровный, системный | `neutral digital end`, `machine shutdown soft` |

---

## 2. UI и интерфейс — ~15 SFX

| ID | Событие в игре | Поиск на Freesound |
|----|----------------|-------------------|
| `ui_click` | Клик по кнопке меню, HUD, настройкам | `ui click soft`, `button press subtle` |
| `ui_click_primary` | «Новая игра», выбор ветки | `ui confirm`, `button important` |
| `ui_click_disabled` | Недоступная кнопка («Продолжить» без сейва) | `ui error soft`, `disabled beep` |
| `ui_hover` | Наведение (опционально) | `ui hover`, `soft whoosh short` |
| `ui_open_overlay` | Настройки, сюжет-карта, игровое меню | `panel open`, `modal slide` |
| `ui_close_overlay` | Закрытие панели | `panel close`, `whoosh out` |
| `ui_slider` | Слайдер громкости музыки / SFX | `slider tick`, `ui drag` |
| `ui_save` | Автосохранение (опционально, тихо) | `soft save ping`, `checkpoint subtle` |
| `ui_notification` | Уведомление «новая ветка» (`path-notice`) | `soft notification`, `story unlock` |
| `ui_dialog_open` | Диалог подтверждения | `dialog appear` |
| `ui_dialog_confirm` | OK в диалоге | `confirm click` |
| `ui_dialog_cancel` | Отмена | `cancel soft` |
| `ui_ad_countdown_tick` | Отсчёт 3–2–1 перед рекламой | `countdown beep`, `timer tick` |
| `ui_ad_countdown_end` | Конец отсчёта | `timer end`, `short buzz` |

---

## 3. Новелла — текст и выборы — ~8 SFX

| ID | Событие | Поиск на Freesound |
|----|---------|-------------------|
| `vn_text_advance` | Переход к следующей реплике (клик по экрану) | `page turn soft`, `text advance`, `soft tap` |
| `vn_text_blip` | Посимвольный «блип» при наборе текста (если добавите typewriter) | `text blip`, `dialogue beep soft`, `vn cursor` |
| `vn_choices_appear` | Появление вариантов выбора | `choices reveal`, `soft rise`, `option appear` |
| `vn_choice_select` | Выбор варианта | `choice select`, `decision click` |
| `vn_thought` | Внутренний монолог (легче обычной реплики) | `thought echo soft`, `inner voice filter` |
| `vn_scene_transition` | Смена фона (crossfade 600 ms) | `scene transition whoosh`, `soft sweep` |
| `vn_act_break` | Заставка главы («ГЛАВА 0», «ГЛАВА 4», «КОНЕЦ») | `chapter title sting`, `act break cinematic`, `title card` |
| `vn_ending` | Экран концовки | `ending fanfare short`, `conclusion sting` |

---

## 4. СИНХРОН (система) — ~10 SFX

Реплики идут от персонажа `char_sync` + визуал орба (`sync-silhouette.js`).

| ID | Событие | Поиск на Freesound |
|----|---------|-------------------|
| `sync_speak` | Появление реплики СИНХРОНА (короткий стинг) | `synthetic voice UI`, `AI speak blip`, `computer voice short` |
| `sync_notify` | Системное уведомление («Маршрут нестабилен…») | `system notification`, `alert digital soft` |
| `sync_warning` | Предупреждение («Вы опаздываете», «Риск превышает…») | `warning beep`, `alert soft digital` |
| `sync_orb_idle` | Орб СИНХРОНА на экране (тонкий loop) | `sci-fi orb hum`, `digital sphere drone` |
| `sync_glitch` | Глитч при сбое / петле | `glitch short`, `digital corruption`, `static burst` |
| `sync_loop_reset` | «Повтор дня запущен» / «Повтор запущен» | `time rewind`, `loop reset`, `system reboot` |
| `sync_route_change` | «Изменение маршрута» на телефоне | `GPS reroute`, `navigation update` |
| `sync_route_deviation` | «Вы отклонились от маршрута» | `error route`, `deviation alert` |
| `sync_accept` | «Новый сценарий принят» / «День сохранён» | `system confirm`, `data accepted` |
| `sync_shutdown` | Отключение системы (финал E) | `power down computer`, `system offline` |

---

## 5. Телефон и уведомления — ~6 SFX

В сюжете часто: звонки Макса, вибрация, push-уведомления.

| ID | Событие в сюжете | Поиск на Freesound |
|----|------------------|-------------------|
| `phone_ring` | «Звонит Макс» | `phone ring modern`, `mobile call` |
| `phone_vibrate` | Телефон вибрирует / загорается экран | `phone vibration`, `mobile buzz` |
| `phone_notification` | Push («Сегодня важный день», «Не вмешивайтесь») | `notification soft`, `message ping ios` |
| `phone_lock` | Экран гаснет / чёрный экран телефона | `screen off`, `phone lock` |
| `phone_camera` | Съёмка на перекрёстке | `camera shutter phone`, `record start` |
| `phone_glitch` | Испорченный файл / сбой видео в 19:43 | `digital glitch audio`, `corrupted file` |

---

## 6. Сюжетные ключевые моменты — `city.mp3`

Один файл `src/assets/audio/city.mp3` (loop) вместо отдельных SFX. Модуль `story-sounds.js`, громкость — слайдер **«Эффекты»**.

| ID | Сцена / текст | Файл |
|----|---------------|------|
| `story_city_ambient` | Пролог: «Шум города…» | `city.mp3` |
| `story_white_flash` | Эффект `white_flash` + «Белая вспышка» | `city.mp3` |
| `story_brakes` | «Звук тормозов» (авария / перекрёсток) | `city.mp3` |
| `story_truck` | Грузовик на перекрёстке (ветка E) | `city.mp3` |
| `story_traffic_glitch` | Светофор гаснет / сбоит | `city.mp3` |
| `story_dog_bark` | Бублик лает на телефон | `city.mp3` |
| `story_dog_happy` | Бублик подбегает | `city.mp3` |
| `story_clock_1943` | Часы / момент 19:43 | `city.mp3` |
| `story_coffee_drop` | «Кто-то роняет кофе» (эпилог, ch02) | `city.mp3` |
| `story_bus` | «Автобус опаздывает» (эпилог) | `city.mp3` |
| `story_sirens_distant` | Город в хаосе | `city.mp3` |
| `story_silence` | Финал C / «тишина» — **остановка** `city.mp3` | — |

---

## 7. Поиск предметов (anomaly scan) — ~5 SFX

Механика `anomaly-scan.js`: луч сканирует экран, предметы «всплывают».

| ID | Событие | Поиск на Freesound |
|----|---------|-------------------|
| `scan_beam_loop` | Луч сканирования (loop пока идёт скан) | `scanner beam`, `sonar ping loop`, `radar sweep` |
| `scan_item_found` | Найден предмет (`scan-zone--hit`) | `discovery ping`, `item collect soft`, `positive blip` |
| `scan_item_reveal` | Предмет раскрыт в списке | `unlock item`, `reveal chime` |
| `scan_reset` | Луч возвращается вверх | `scan reset`, `swoosh up` |
| `scan_complete` | Все 8 предметов найдены | `puzzle complete`, `success short` |

---

## 8. Главное меню — глитч и атмосфера — ~4 SFX

`menu-bg-cycle.js`: шум, scanlines, глитч заголовка, смена фона.

| ID | Событие | Поиск на Freesound |
|----|---------|-------------------|
| `menu_glitch_burst` | Вспышка глитча на тайтле | `glitch burst`, `VHS static hit` |
| `menu_static_loop` | ТВ-шум на canvas (очень тихий loop) | `TV static loop`, `white noise low` |
| `menu_bg_shift` | Смена фона каждые 6 с | `analog switch`, `channel change soft` |
| `menu_ambient` | Общий гул меню под музыку | `city night drone`, `neon hum` |

---

## 9. Локационный эмбиент (слой под музыку) — ~8 SFX

Короткие **ambience loops** — можно тише BGM или вместо него на слабых устройствах.

| ID | Локация | Поиск на Freesound |
|----|---------|-------------------|
| `amb_apartment` | Квартира: чайник, часы, тихий город за окном | `apartment room tone`, `kettle distant` |
| `amb_cafe` | Кафе: посуда, разговоры (без слов) | `cafe chatter loop`, `espresso machine` |
| `amb_warehouse` | Склад: вентиляция, металл | `warehouse room tone` |
| `amb_server` | Серверная: вентиляторы, HDD | `server fans loop` |
| `amb_street_rain` | Улица (если на фоне дождь на art) | `rain urban`, `wet street` |
| `amb_office` | Офис: клавиатура, принтер | `office ambience` |
| `amb_night_city` | Вечерний перекрёсток | `night traffic loop` |
| `amb_park` | Парк с Бубликом | `park birds`, `leaves wind` |

---

## Сводка по количеству

| Категория | Штук |
|-----------|------|
| Музыка (BGM) | 12–15 |
| UI | ~15 |
| Новелла | ~8 |
| СИНХРОН | ~10 |
| Телефон | ~6 |
| Сюжетные SFX | ~12 |
| Скан предметов | ~5 |
| Меню | ~4 |
| Эмбиент | ~8 |
| **Итого** | **~80–85** |

**Минимальный MVP** (если не хочется качать всё сразу):  
`bgm_menu`, `bgm_apartment`, `bgm_crossroad`, `bgm_epilogue` + `ui_click`, `ui_click_primary`, `vn_text_advance`, `vn_choices_appear`, `vn_choice_select`, `sync_notify`, `sync_loop_reset`, `story_white_flash`, `story_brakes`, `phone_notification`, `scan_item_found`, `vn_act_break` — **~16 файлов**.

---

## Папка в проекте (когда появятся файлы)

```
public/audio/
  bgm/
  sfx/ui/
  sfx/vn/
  sfx/sync/
  sfx/story/
  sfx/scan/
  sfx/phone/
  amb/
```

## Технические заметки

- Реклама и пауза SDK уже глушат геймплей через `ads:pause` / `gameplayPause` — музыку нужно **ducking** (приглушать на 30–50 %), не обрывать резко.
- На `visibilitychange` (сворачивание вкладки) — **pause all audio** (требование платформы).
- Слайдеры в настройках: `music` и `sfx` уже есть в сохранении (`novel_settings`).
