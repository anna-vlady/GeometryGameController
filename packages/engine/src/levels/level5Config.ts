import { LevelConfig } from './levelConfig';

export const LEVEL_5_CONFIG: LevelConfig = {
  id: 5,
  name: 'Уровень 5: Unicode Art Matrix',
  artist: 'Unicode Matrix',
  usePrimitives: false,
  targetAltitude: 5165,
  palette: {
    paper: '#0A0E1A',
    ink: '#00F3FF',
    red: '#FF0055',
    ochre: '#FFD700',
    blue: '#00F3FF',
    cream: '#131A2D',
    paperLight: [16, 24, 40],
    paperDark: [10, 14, 26],
    energyColors: ['#FF0055', '#00F3FF', '#FFD700', '#BD00FF']
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
  description: 'Пятый уровень. Футуристическая матрица символов Unicode Art.'
};
