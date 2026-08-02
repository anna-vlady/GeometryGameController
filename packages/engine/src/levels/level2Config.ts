import { LevelConfig } from './levelConfig';

export const LEVEL_2_CONFIG: LevelConfig = {
  id: 2,
  name: 'Уровень 2: Neon Night Club',
  artist: 'Anna Ghazaryan Vladimirskaya',
  usePrimitives: true,
  targetAltitude: 5165,
  palette: {
    paper: '#0A0A16',
    ink: '#00F0FF',
    red: '#FF007F',
    ochre: '#FFE600',
    blue: '#7928CA',
    cream: '#12122A',
    paperLight: [18, 18, 38],
    paperDark: [8, 8, 18],
    energyColors: ['#FF007F', '#00F0FF', '#FFE600', '#7928CA']
  },
  audio: {
    rootNote: 41.203, // E1 - Deep Club Bass
    modes: [
      [0, 2, 3, 5, 7, 8, 10], // Эоловый / Синтвейн минор (Розовый)
      [0, 2, 4, 7, 9],        // Неоновая Пентатоника (Голубой)
      [0, 2, 4, 6, 7, 9, 10], // Лидийский Клуб (Золотой)
      [0, 1, 3, 5, 7, 8, 10]  // Фригийский Клуб (Фиолетовый)
    ],
    drive: [2.5, 1.8, 2.2, 1.5]
  },
  assetsDir: '/assets/levels/level-2/',
  description: 'Электрический неоновый клуб в полуночных тонах, наполненный розовыми, голубыми и золотыми огнями.'
};
