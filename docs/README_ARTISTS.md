# 🎨 Руководство для Художников Модов (Уровни 2–5)

Добро пожаловать в команду разработки уровня-мода для **«ПРОУН — Заводная орнитология»**!

Каждый из 4 художников работает над **своим отдельным уровнем** (Уровни 2, 3, 4 и 5). Архитектура проекта построена так, что работы разных художников полностью изолированы и не создают конфликтов слияния в Git.

---

## 🚀 Быстрый Старт

1. **Клонируйте репозиторий и установите зависимости:**
   ```bash
   git clone <URL_РЕПОЗИТОРИЯ>
   cd PROUN-HOSQ
   npm install
   ```

2. **Запустите локальный сервер разработки:**
   ```bash
   npm run dev --workspace=app
   ```
   Откройте `http://localhost:5173` в браузере.

3. **Выберите свой уровень в игре:**
   - Нажмите на кнопку **«Регуляторы»** в левом нижнем углу экрана.
   - В блоке **«Уровни & Моды»** нажмите на кнопку вашего уровня (например, `[Ур. 2]`).
   - Нажмите тумблер `✦ Стиль: Чистые Примитивы` / `🎨 Стиль: Кастомное Оформление` для переключения визуального режима.

---

## 📂 Карта Файлов для Каждого Художника

За каждым художником закреплена своя пара файлов и папка ресурсов:

| Уровень | Ответственный | Файл конфигурации стиля | Папка для ваших ресурсов (аудио, изображения) |
|---|---|---|---|
| **Уровень 2** | Художник 1 | [`packages/engine/src/levels/level2Config.ts`](../packages/engine/src/levels/level2Config.ts) | `packages/app/public/assets/levels/level-2/` |
| **Уровень 3** | Художник 2 | [`packages/engine/src/levels/level3Config.ts`](../packages/engine/src/levels/level3Config.ts) | `packages/app/public/assets/levels/level-3/` |
| **Уровень 4** | Художник 3 | [`packages/engine/src/levels/level4Config.ts`](../packages/engine/src/levels/level4Config.ts) | `packages/app/public/assets/levels/level-4/` |
| **Уровень 5** | Художник 4 | [`packages/engine/src/levels/level5Config.ts`](../packages/engine/src/levels/level5Config.ts) | `packages/app/public/assets/levels/level-5/` |

> ⚠️ **ВАЖНО:** Пожалуйста, редактируйте **ТОЛЬКО** ваш файл `levelXConfig.ts` и файлы в вашей папке `level-X/`. Это обеспечит чистый мердж в `main`.

---

## 🎨 Настройка Вашего Уровня в `levelXConfig.ts`

В вашем файле конфигурации вы можете изменить:

```typescript
export const LEVEL_2_CONFIG: LevelConfig = {
  id: 2,
  name: 'Уровень 2: Ваше Название',
  artist: 'Имя / Никнейм Художника',
  usePrimitives: false, // true = базовые примитивы, false = ваш кастомный стиль
  targetAltitude: 5165, // Высота завершения уровня в метрах

  palette: {
    paper: '#1A1A24',        // Основной фон бумаги
    ink: '#EAEAEA',          // Контуры и текст
    red: '#FF4757',          // Цвет энергии 1
    ochre: '#FFA502',        // Цвет энергии 2
    blue: '#2ED573',         // Цвет энергии 3
    cream: '#2F3542',        // Вспомогательные элементы
    paperLight: [30, 30, 42],
    paperDark: [15, 15, 22],
    energyColors: ['#FF4757', '#EAEAEA', '#FFA502', '#2ED573']
  },

  audio: {
    rootNote: 43.654, // Базовая тональность в Гц
    modes: [
      [0, 2, 4, 5, 7, 9, 11], // Музыкальные лады для 4 энергий
      [0, 2, 3, 5, 7, 8, 10],
      [0, 2, 4, 7, 9],
      [0, 1, 3, 5, 7, 8, 10]
    ],
    drive: [1.8, 1.2, 1.5, 1.0]
  },

  assetsDir: '/assets/levels/level-2/'
};
```

---

## 🌿 Процесс Работы в Git

1. **Создайте ветку для вашей работы:**
   ```bash
   git checkout -b feature/level-2-artist
   ```
2. **Коммитьте и пушьте в репозиторий:**
   ```bash
   git add .
   git commit -m "feat(level-2): добавлен кастомный стиль и палитра"
   git push origin feature/level-2-artist
   ```
3. Создайте Pull Request на GitHub в ветку `main`.
