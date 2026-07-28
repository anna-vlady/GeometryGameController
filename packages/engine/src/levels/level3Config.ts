import { LevelConfig } from './levelConfig';

export const LEVEL_3_CONFIG: LevelConfig = {
  id: 3,
  name: 'Уровень 3: Примитивы (Художник 2)',
  artist: 'Художник 2',
  usePrimitives: true,
  targetAltitude: 5165,
  palette: {
    paper: '#0F172A',
    ink: '#F8FAFC',
    red: '#EC4899',
    ochre: '#F59E0B',
    blue: '#06B6D4',
    cream: '#1E293B',
    paperLight: [24, 35, 55],
    paperDark: [10, 16, 30],
    energyColors: ['#EC4899', '#F8FAFC', '#F59E0B', '#06B6D4']
  },
  audio: {
    rootNote: 49.0, // G1
    modes: [
      [0, 2, 4, 6, 8, 10],   // Целотонный лад
      [0, 3, 5, 6, 7, 10],   // Блюз
      [0, 1, 4, 5, 7, 8, 11], // Гармонический минор
      [0, 2, 4, 7, 9]
    ],
    drive: [2.0, 1.5, 1.8, 1.1]
  },
  assetsDir: '/assets/levels/level-3/',
  description: 'Третий уровень. Мод от Художника 2.'
};
