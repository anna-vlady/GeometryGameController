import { Mech } from '../world/types';

export function fieldAt(x: number, y: number, nearbyCache: Mech[]): [number, number] {
  let fx_ = Math.sin(y * 0.0011 + x * 0.0007) * 16;
  let fy_ = Math.cos(x * 0.0009 - y * 0.0006) * 16;
  for (const o of nearbyCache) {
    const dx = x - o.x, dy = y - o.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > o.R * 1.35) continue;
    const wgt = Math.exp(-d / (o.R * 0.55));
    const radK = Math.max(-1, Math.min(1, (d - o.orbitR) / o.orbitR));
    fx_ += (-dy / d * o.spin * 55 - dx / d * radK * 38) * wgt;
    fy_ += ( dx / d * o.spin * 55 - dy / d * radK * 38) * wgt;
  }
  return [fx_, fy_];
}
