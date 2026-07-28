# PROUN-HOSQ: HANDOVER DOSSIER & PROJECT CONTEXT

Этот файл содержит полный актуальный контекст проекта PROUN-HOSQ для бесшовного продолжения работы в новом чате.

---

## 1. Архитектура и Текущее Состояние

### Сервер и Мультиплеер
- **WebSocket Signaling Server:** [packages/server/src/index.js](file:///c:/Projects/hosq/Notations_2/PROUN-HOSQ/packages/server/src/index.js) (Порт **8085**).
- **Network Client:** [packages/app/src/network/multiplayer.ts](file:///c:/Projects/hosq/Notations_2/PROUN-HOSQ/packages/app/src/network/multiplayer.ts).
- Поддерживается подключаемый сингл-экран локальный/сетевой кооп до 4 игроков (Слоты 1–4).

### Мобильный Интерфейс Джойстика (UX)
- **Файл:** [MobileJoystick.tsx](file:///c:/Projects/hosq/Notations_2/PROUN-HOSQ/packages/app/src/pages/MobileJoystick.tsx).
- **Экран слотов:** По умолчанию при запуске открывается сет сетка выбора слотов (Слоты 1–4).
- **Кнопка Reset:** Кнопка `⚙ SLOT-X` в центре джойстика сбрасывает слот и очищает параметры URL.
- **Габариты джойстика:** Увеличен до **360px** (`maxRadius = 140px`). Кнопки A и B расположены горизонтально рядом (**120px**, шрифт `30px`). Safe area снизу от края экрана.

### Физика N-Тел и Элегантная Стыковка (Обновлено)
- **Файл:** [update.ts](file:///c:/Projects/hosq/Notations_2/PROUN-HOSQ/packages/engine/src/physics/update.ts).
- **Радиус связи:** **`3960px`** (`TETHER_MAX_DIST` = 3x 1320px).
- **Легкий выход из связи (`breakoutEase`):** Рассчитывается проекция векторов ввода игроков `pullApartScore` и накопитель натяжения `tetherTension`. Когда игроки разлетаются в разные стороны, притяжение плавно ослабляется `breakoutEase = Math.max(0.06, (1 - tension)^1.4)`, устраняя залипания и рывки.
- **Непрерывная тяга от точки равновесия ($70\text{px}$):** Куполообразная сила `pullNorm = sin(π * (dist - 70) / 3890)` гладко начинается с нуля на отметке 70px и гладко сходит в ноль на 3960px.
- **Критическое демпфирование:** Относительная скорость разлета гасится `dampF = relDot * 0.35 * breakoutEase * dt`.
- **Подушка стыковки ($D < 70\text{px}$):** Мягкая упругая выталкивающая пружина `springErr * 0.8` удерживает ядра на комфортном удалении без гашения движения пилотов.
- **Овальные стадионные орбиты энергий:** Орбиты энергий выстраиваются по эллипсу $(a_k, b_k)$ строго вдоль оси ядер, а в одиночном цикле взвешиваются фактором `(1 - cBlend)`.
- **Затухание `coopBlend`:** При разрыве связи `coopBlend` плавно угасает через `Math.exp(-2.5 * dt)`.
- **Мультипликационные шейпы (Squash & Stretch):** Глифы энергий вытягиваются по вектору движения и плющатся в поперечном направлении с изменением формы до $+42\%$.

### Отрисовка Волновых Мембран
- **Файл:** [renderer.ts](file:///c:/Projects/hosq/Notations_2/PROUN-HOSQ/packages/engine/src/renderer/renderer.ts).
- Отрисовывает овальные пульсирующие био-медузные полупрозрачные оболочки и волновые пунктирные мембраны вокруг центроида соединенных игроков при $D < 3960\text{px}$.

### Звуковой Движок (Web Audio API)
- **Файл:** [audioManager.ts](file:///c:/Projects/hosq/Notations_2/PROUN-HOSQ/packages/engine/src/audio/audioManager.ts).
- **4 Уникальных Тембра:** Слот 1 (Красный, FM суб-бас), Слот 2 (Черный, перкуссионный клик), Слот 3 (Золотой, колокольчики), Слот 4 (Синий, щипковый синтезатор).
- **Звук сбора энергий:** Бархатистый, мягкий, воздушный (`playParticlePickup`) с атакой $12\text{ms}$ и полосовым фильтром $2100\text{Hz}$.

---

## 2. Команды Движка и Сервера

```bash
# 1. Запуск WebSocket сервера (порт 8085)
node packages/server/src/index.js

# 2. Запуск Dev-сервера приложения
cmd.exe /c "set NODE_OPTIONS=--experimental-global-webcrypto && npm run dev --workspace=app -- --host 0.0.0.0"

# 3. Полная сборка проекта
cmd.exe /c "set NODE_OPTIONS=--experimental-global-webcrypto && npm run build"
```

---

## 3. Инструкция для Запуска Нового Чата

1. Откройте новый диалог.
2. Отправьте первое сообщение:
   > **«Продолжаем работу над проектом PROUN-HOSQ. Прочитай файл HANDOVER.md и жди моих указаний.»**
