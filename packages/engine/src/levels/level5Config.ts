import { LevelConfig } from './levelConfig';

export const LEVEL_5_CONFIG: LevelConfig = {
  id: 5,
  name: 'Уровень 5: Примитивы (Художник 4)',
  artist: 'Художник 4',
  usePrimitives: true,
  targetAltitude: 5165,
  palette: {
    paper: '#022C22',
    ink: '#F0FDF4',
    red: '#F43F5E',
    ochre: '#FACC15',
    blue: '#38BDF8',
    cream: '#064E3B',
    paperLight: [10, 60, 45],
    paperDark: [2, 35, 25],
    energyColors: ['#F43F5E', '#F0FDF4', '#FACC15', '#38BDF8']
  },
  audio: {
    rootNote: 55.0, // A1
    modes: [
      [0, 2, 4, 5, 7, 9, 11],
      [0, 1, 4, 5, 7, 8, 10],
      [0, 3, 5, 7, 10],
      [0, 2, 5, 7, 9]
    ],
    drive: [2.2, 1.7, 2.1, 1.4]
  },
  assetsDir: '/assets/levels/level-5/',
  description: 'Пятый уровень. Мод от Художника 4.'
};
