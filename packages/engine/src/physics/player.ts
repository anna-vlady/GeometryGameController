import { SPAWN } from './constants';
import { Player, Orb } from './types';

export function createPlayer(): Player {
  return {
    x: SPAWN.x, y: SPAWN.y, vx: 0, vy: 0,
    orbs: [0, 1, 2, 3].map(i => ({
      energy: i,
      phase: i * Math.PI / 2,
      ox: Math.cos(i * Math.PI / 2) * 38,
      oy: Math.sin(i * Math.PI / 2) * 38,
      trail: [],
      score: 0,
      target: null,
      flashR: 0
    }))
  };
}
