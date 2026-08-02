import { LevelConfig } from './levelConfig';

export const LEVEL_1_CONFIG: LevelConfig = {
  id: 1,
  name: 'Уровень 1: Заводная Орнитология (Супрематизм)',
  artist: 'Misak Samokatian',
  usePrimitives: false,
  targetAltitude: 5165,
  palette: {
    paper: '#E7DFCC',
    ink: '#1E1B16',
    red: '#BF3B2B',
    ochre: '#C99B3F',
    blue: '#3F5666',
    cream: '#F2EBD9',
    paperLight: [241, 235, 222],
    paperDark: [217, 205, 178],
    energyColors: ['#BF3B2B', '#1E1B16', '#C99B3F', '#3F5666']
  },
  audio: {
    rootNote: 36.708, // D1
    modes: [
      [0, 1, 3, 4, 6, 7, 9, 10],     // лад 2 (октатоника) — красный
      [0, 2, 3, 4, 6, 7, 8, 10, 11], // лад 3 — чернильный
      [0, 2, 4, 5, 6, 8, 10, 11],    // лад 6 — охряный
      [0, 1, 5, 6, 7, 11]            // лад 5 — синий
    ],
    drive: [2.4, 1.6, 2.0, 1.2]
  },
  assetsDir: '/assets/levels/level-1/',
  description: 'Оригинальный каноничный супрематический стиль и мессиановские лады.'
};
