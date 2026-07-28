import { levelRegistry } from '../levels/levelRegistry';
import { MODES, ROOT } from '../world/constants';

export function modeFreq(e: number, deg: number, oct: number) {
  const activeAudio = levelRegistry.getActiveConfig()?.audio;
  const root = activeAudio?.rootNote ?? ROOT;
  const modesList = activeAudio?.modes ?? MODES;
  const m = modesList[e % modesList.length] || MODES[0];
  const n = m.length;
  const o = Math.floor(deg / n);
  const d = ((deg % n) + n) % n;
  return root * Math.pow(2, oct + o + m[d] / 12);
}
