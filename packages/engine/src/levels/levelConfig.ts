export interface LevelPalette {
  paper: string;
  ink: string;
  red: string;
  ochre: string;
  blue: string;
  cream: string;
  paperLight: [number, number, number];
  paperDark: [number, number, number];
  energyColors: string[];
}

export interface LevelAudioConfig {
  rootNote: number;
  modes: number[][];
  drive: number[];
  ambienceUrl?: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  artist: string;
  usePrimitives: boolean;
  targetAltitude: number;
  palette: LevelPalette;
  audio: LevelAudioConfig;
  assetsDir: string;
  description?: string;
}
