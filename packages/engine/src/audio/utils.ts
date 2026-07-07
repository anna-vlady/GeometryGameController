import { MODES, ROOT } from '../world/constants';

export function modeFreq(e: number, deg: number, oct: number) {
  const m = MODES[e];
  const n = m.length;
  const o = Math.floor(deg / n);
  const d = ((deg % n) + n) % n;
  return ROOT * Math.pow(2, oct + o + m[d] / 12);
}
