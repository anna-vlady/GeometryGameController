import { LevelConfig } from './levelConfig';

export const LEVEL_3_CONFIG: LevelConfig = {
  id: 3,
  name: 'Уровень 3: Enchanted Pastel Forest',
  artist: 'Botanical Cyber Artist',
  usePrimitives: false,
  targetAltitude: 5165,
  palette: {
    paper: '#D2E8D4',
    ink: '#3B593E',
    red: '#FFB7C5',
    ochre: '#FDFD96',
    blue: '#AEC6CF',
    cream: '#FAF0E6',
    paperLight: [230, 244, 232],
    paperDark: [190, 218, 192],
    energyColors: ['#FFB7C5', '#AEC6CF', '#FDFD96', '#C3B1E1']
  },
  audio: {
    rootNote: 49.0, // G1
    modes: [
      [0, 2, 4, 6, 8, 10],   // Whole tone
      [0, 3, 5, 6, 7, 10],   // Blues
      [0, 1, 4, 5, 7, 8, 11], // Harmonic minor
      [0, 2, 4, 7, 9]
    ],
    drive: [2.0, 1.5, 1.8, 1.1]
  },
  assetsDir: '/assets/levels/level-3/',
  description: 'Волшебный пастельный лесной уровень с ботаническими цветами и листьями.'
};
