import { LevelConfig } from './levelConfig';

export const LEVEL_2_CONFIG: LevelConfig = {
  id: 2,
  name: 'Уровень 2: Примитивы (Художник 1)',
  artist: 'Художник 1',
  usePrimitives: true,
  targetAltitude: 5165,
  palette: {
    paper: '#1A1A24',
    ink: '#EAEAEA',
    red: '#FF4757',
    ochre: '#FFA502',
    blue: '#2ED573',
    cream: '#2F3542',
    paperLight: [30, 30, 42],
    paperDark: [15, 15, 22],
    energyColors: ['#FF4757', '#EAEAEA', '#FFA502', '#2ED573']
  },
  audio: {
    rootNote: 43.654, // F1
    modes: [
      [0, 2, 4, 5, 7, 9, 11], // Мажор
      [0, 2, 3, 5, 7, 8, 10], // Минор
      [0, 2, 4, 7, 9],        // Пентатоника
      [0, 1, 3, 5, 7, 8, 10]  // Фригийский
    ],
    drive: [1.8, 1.2, 1.5, 1.0]
  },
  assetsDir: '/assets/levels/level-2/',
  description: 'Второй уровень. Мод от Художника 1.'
};
