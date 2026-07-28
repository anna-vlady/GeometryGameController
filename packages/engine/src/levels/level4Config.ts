import { LevelConfig } from './levelConfig';

export const LEVEL_4_CONFIG: LevelConfig = {
  id: 4,
  name: 'Уровень 4: ASCII Aquarium Tank',
  artist: 'ASCII Aquarium',
  usePrimitives: false,
  targetAltitude: 5165,
  palette: {
    paper: '#04101A',
    ink: '#00F0FF',
    red: '#FF4081',
    ochre: '#FFD700',
    blue: '#00E5FF',
    cream: '#0B2236',
    paperLight: [10, 30, 50],
    paperDark: [4, 16, 26],
    energyColors: ['#FF4081', '#00E5FF', '#FFD700', '#B388FF']
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
  description: 'Четвёртый уровень. Аквариумный мир рыбок и кораллов ASCII Fish Art.'
};
