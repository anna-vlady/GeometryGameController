import { LevelConfig } from './levelConfig';

export const LEVEL_4_CONFIG: LevelConfig = {
  id: 4,
  name: 'Уровень 4: ASCII Art Terminal',
  artist: 'ASCII Terminal',
  usePrimitives: false,
  targetAltitude: 5165,
  palette: {
    paper: '#0D1117',
    ink: '#00FF66',
    red: '#FF5555',
    ochre: '#FFB000',
    blue: '#50FA7B',
    cream: '#161B22',
    paperLight: [20, 28, 38],
    paperDark: [13, 17, 23],
    energyColors: ['#FF5555', '#50FA7B', '#FFB000', '#BD93F9']
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
  description: 'Четвёртый уровень. Винтажная терминальная эстетика ASCII Art.'
};
