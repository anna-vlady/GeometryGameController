import { LevelConfig } from './levelConfig';

export const LEVEL_4_CONFIG: LevelConfig = {
  id: 4,
  name: 'Уровень 4: ASCII Aquarium Tank',
  artist: 'Anna Ghazaryan Vladimirskaya',
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
    rootNote: 65.406, // C2 - Aquatic Chiptune Pitch
    modes: [
      [0, 3, 5, 7, 10],      // Коралл Минор 7th (Коралловые рыбки)
      [0, 2, 4, 6, 8, 10],   // Подводные Пузыри Whole-Tone (Вода)
      [0, 4, 7, 9, 11],      // Золотая Рыбка Shimmer
      [0, 5, 7, 10, 12]      // Глубоководный Океан Sus4 (Ракушки)
    ],
    drive: [0.5, 0.3, 0.6, 0.2]
  },
  assetsDir: '/assets/levels/level-4/',
  description: 'Четвёртый уровень. Аквариумный мир рыбок и кораллов ASCII Fish Art.'
};
