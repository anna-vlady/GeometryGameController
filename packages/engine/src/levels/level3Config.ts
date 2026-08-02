import { LevelConfig } from './levelConfig';

export const LEVEL_3_CONFIG: LevelConfig = {
  id: 3,
  name: 'Уровень 3: Enchanted Pastel Forest',
  artist: 'Anna Ghazaryan Vladimirskaya',
  usePrimitives: false,
  targetAltitude: 5165,
  palette: {
    paper: '#121814',
    ink: '#8FA893',
    red: '#FFB7C5',
    ochre: '#FDFD96',
    blue: '#AEC6CF',
    cream: '#FAF0E6',
    paperLight: [30, 40, 32],
    paperDark: [12, 18, 14],
    energyColors: ['#FFB7C5', '#AEC6CF', '#FDFD96', '#C3B1E1']
  },
  audio: {
    rootNote: 52.325, // C2 - Bright Nature Key
    modes: [
      [0, 2, 3, 7, 8],        // Сакура / Hirajoshi (Розовый цвет)
      [0, 2, 4, 7, 9],        // Мажорная Пентатоника Леса (Голубой поток)
      [0, 2, 4, 6, 7, 9, 11], // Пасторальный Лидийский Солнечный Луч (Золотые лучи)
      [0, 3, 5, 7, 10]        // Мягкий Воздушный Лесной Минор (Лаванда)
    ],
    drive: [0.6, 0.4, 0.7, 0.3]
  },
  assetsDir: '/assets/levels/level-3/',
  description: 'Волшебный пастельный лесной уровень с ботаническими цветами и листьями.'
};
