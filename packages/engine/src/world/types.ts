export interface Voice {
  kind?: string;
  instr?: string;
  talea: number[];
  cum: number[];
  total: number;
  colorSeq: number[];
  colorPos: number;
  pulse: number;
  tempoMul: number;
  persona: number;
  refT: number;
  oct: number;
  nextT?: number;
  nextIdx: number;
  pending: Array<{ at: number; idx: number }>;
  flash: number[];
  headPulse: number;

  // For Orbital (ring)
  r?: number;
  ecc?: number;
  tilt?: number;
  dir?: number;
  phase0?: number;
  wavy?: boolean;

  // For Proun
  bx?: number;
  by?: number;
  len?: number;
  wid?: number;
  rot?: number;
  motion?: string;
  amp?: number;
  mfreq?: number;
  mphase?: number;
  depth?: number;
  col?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface Frame {
  bx: number;
  by: number;
  w: number;
  h: number;
  rot: number;
}

export interface Mech {
  x: number;
  y: number;
  scale: number;
  energy: number;
  spin: number;
  coreSize: number;
  coreRot: number;
  tilt: number;
  pulse: number;
  rootDeg: number;
  act: number;
  corePulse: number;
  _hear: number;
  _w: number;
  _wf: number;
  _colCd: number;
  archetype: 'orbital' | 'proun';
  axis: number;
  rings: Voice[];
  frames: Frame[];
  parts: Particle[];
  orbitR: number;
  R: number;
  outerR: number;
  partN?: number;
}

export interface Decor {
  kind: string;
  x: number;
  y: number;
  size: number;
  rot: number;
}

export interface Chunk {
  mechs: Mech[];
  decor: Decor[];
}

export interface FarDecor {
  x: number;
  y: number;
  size: number;
  rot: number;
  kind: number;
}
