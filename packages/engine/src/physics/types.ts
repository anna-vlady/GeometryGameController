import { Mech } from '../world/types';

export interface Orb {
  energy: number;
  phase: number;
  ox: number;
  oy: number;
  trail: { x: number; y: number }[];
  score: number;
  target: Mech | null;
  flashR: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  orbs: Orb[];
}

export interface FxState {
  strobe: number;
  distort: number;
  stutter: number;
  shocks: Array<{ x: number; y: number; r: number; v: number; life: number }>;
}
