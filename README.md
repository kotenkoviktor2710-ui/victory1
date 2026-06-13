# Yandex Games Template

Vue 3 + Vite шаблон для игр под Яндекс.Игры. Содержит готовую обёртку
над Yandex Games SDK, модуль рекламы и облачные сохранения.

## Что включено

- **`src/yandex/sdk.ts`** — инициализация SDK, `getLang()`, серверное время,
  reference-counted `gameplayPause()` / `gameplayResume()`, оценка игры.
- **`src/yandex/appReady.ts`** — `LoadingAPI.ready()` и `gameplayInit()`.
- **`src/yandex/playerStorage.ts`** — облачные сохранения через `getPlayer().setData()`.
- **`src/yandex/leaderboard.ts`** — отправка и загрузка таблицы лидеров.
- **`src/yandex/reviewPrompt.ts`** — безопасный показ окна оценки.
- **`src/yandex/progressLifecycle.ts`** — flush сохранений при сворачивании.
- **`src/ads/ads.ts`** — interstitial и rewarded с кулдаунами и событиями
  `ads:pause` / `ads:resume`.
- **`index.html`** — подключает `/sdk.js` (в проде его отдаёт Яндекс,
  в dev работают dev-стабы).

## Быстрый старт

```sh
npm install
npm run dev
```

## Сборка

```sh
npm run build
```

## Деплой

Проект автоматически публикуется на GitHub Pages при push в `main`.

- Репозиторий: https://github.com/KotoFeelGood72/yandex-games-template
- Сайт: https://kotofeelgood72.github.io/yandex-games-template/

## Настройка под свою игру

1. Замените `DEFAULT_SAVE_KEY` в `src/yandex/playerStorage.ts`.
2. Замените `LEADERBOARD_NAME` в `src/yandex/leaderboard.ts`.
3. Удалите демо-экран `src/views/HomeView.vue` и подключите свою игру.
