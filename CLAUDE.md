# CLAUDE.md

Проектный контекст и архитектурный справочник для разработчиков и AI-ассистентов. Подробности — в [docs/DESIGN.md](docs/DESIGN.md).

## 🚀 Обзор Проекта
«ПРОУН — Заводная орнитология» — мультиплеерное аудио-визуальное PWA на базе TypeScript, Canvas 2D, Web Audio API и React.
Проект построен по принципам чистого монорепозитория (`npm workspaces`):
- `@proun/engine` — изолированный физико-аудио движок (Canvas 2D + Web Audio API, 0 зависимостей от React/DOM).
- `app` — клиентское React UI приложение (Vite, HUD, настройки, мобильный веб-джойстик `/controller`).
- `server` — Node.js WebSocket-сервер мультиплеера и реле джойстиков на порту 8080.

---

## 🛠 Команды Разработки

```bash
# Установка зависимостей
npm install

# Запуск WebSocket-сервера (мультиплеер + джойстики)
node packages/server/src/index.js

# Запуск локального сервера разработки Vite с доступом по Wi-Fi
npm run dev --workspace=app -- --host 0.0.0.0

# Проверка типов и сборка всех пакетов монорепозитория
set NODE_OPTIONS=--experimental-global-webcrypto && npm run build
```

---

## 🌐 Схема Сетевых Сообщений (WebSocket Event Protocol)

Сервер (`packages/server/src/index.js`) и клиент (`packages/app/src/network/multiplayer.ts`) обмениваются пакетами в формате JSON:

| Тип События | Отправитель | Содержание / Назначение |
|---|---|---|
| `controller_join` | Мобильный Джойстик | `{ type: 'controller_join', room: 'SLOT-1' }` — Регистрация джойстика в слоте |
| `controller_input` | Мобильный Джойстик | `{ type: 'controller_input', room: 'SLOT-1', vector: {x,y}, buttonTap: 'A' }` — Трансляция ввода (40 Hz) |
| `remote_input` | Сервер ➔ Игра | `{ type: 'remote_input', room, vector, buttonTap }` — Реле векторов и ритм-кликов игровому клиенту |
| `state` | Игровой Клиент | `{ type: 'state', state: { x, y, vx, vy, tanks, name } }` — Синхронизация состояния пилота |
| `player_update` | Сервер ➔ Игра | `{ type: 'player_update', id, state }` — Рассылка координат сетевых пилотов |
| `controller_status` | Сервер ➔ Игра | `{ type: 'controller_status', room, connected: true }` — Статус подключения смартфона |

---

## 🕹 Мобильный Джойстик (`MobileJoystick.tsx`) & Pointer Events
- Маршрут: `/controller`.
- 1-в-1 оригинальный векторный 2D-дизайн [GeometryGameController](https://github.com/anna-vlady/GeometryGameController).
- **Универсальные события:** Реализован с помощью `Pointer Events` (`pointerdown`, `pointermove`, `pointerup`, `setPointerCapture`), обеспечивая одинаково точный отклик на зажатие кнопки мыши на ПК и касания пальцами на смартфонах.
- **Двухэтапный выбор:** Промежуточная страница выбора слота `ИГРОК 1, 2, 3, 4` с автоматическим привязыванием к комнате `SLOT-1..4`.

---

## 🧲 Физика Сбора Частиц & 4 Орбиты
- **Формула захвата:** `d < maxOrbDist + 22px`. Зона сбора описывается динамическим выпуклым многоугольником, вписанным между 4 вращающимися орбами энергий игрока (`orbs[0..3]`).
- **Магнитный притяг:** При `d < maxOrbDist * 2.4` частицы притягиваются вектором `pullStrength = (1 - d/magnetRange) * 850 * dt`.
- **Плотность частиц:** `o.partN` сгенерирован до 80 штук на mech, управляется через `engine.particleFrac`.

---

## 📐 Архитектура HUD & Высотомер
- **Левый верхний угол:** Размещение плашки ритма PATA-PON (`comboFeedback`) для сохранения чистым центра экрана.
- **Правый край экрана:** Вертикальный супрематический высотомер (Altimeter) с маркером высоты от `-2600m` до `0m`.
- **Верхний центр экрана:** Кооперативный компас сожительства пилотов (`Peer Pilot Compass`) со стрелкой пеленга и дистанцией.

---

## 🎨 Соглашения Проекта
- **Модульность:** Движок `engine` принимает только `HTMLCanvasElement`. Не использует React-хуки или DOM-селекторы.
- **Супрематическая Палитра:** `#E7DFCC` (бумага), `#1E1B16` (уголь), `#BF3B2B` (супрематический красный), `#C99B3F` (золотая охра), `#3F5666` (синяя форманта).
- **Производительность:** `Renderer` и `GameLoop` работают без лишних GC-аллокаций в каждом кадре `requestAnimationFrame`.
