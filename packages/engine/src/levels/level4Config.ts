import { LevelConfig } from './levelConfig';

export const LEVEL_4_CONFIG: LevelConfig = {
  id: 4,
  name: 'Уровень 4: Примитивы (Художник 3)',
  artist: 'Художник 3',
  usePrimitives: true,
  targetAltitude: 5165,
  palette: {
    paper: '#18181B',
    ink: '#FAFAFA',
    red: '#EF4444',
    ochre: '#10B981',
    blue: '#6366F1',
    cream: '#27272A',
    paperLight: [35, 35, 40],
    paperDark: [18, 18, 22],
    energyColors: ['#EF4444', '#FAFAFA', '#10B981', '#6366F1']
  },
  audio: {
    rootNote: 32.703, // C1
    modes: [
      [0, 2, 3, 5, 7, 9, 10], // Дорийский
      [0, 1, 3, 5, 7, 8, 10], // Фригийский
      [0, 2, 4, 6, 7, 9, 10], // Лидийский
      [0, 2, 4, 5, 7, 9, 10]  // Миксолидийский
    ],
    drive: [1.6, 1.4, 1.9, 1.3]
  },
  assetsDir: '/assets/levels/level-4/',
  description: 'Четвёртый уровень. Мод от Художника 3.'
};
