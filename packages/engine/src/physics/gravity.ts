import { Mech } from '../world/types';

export function fieldAt(x: number, y: number, nearbyCache: Mech[]): [number, number] {
  let fx_ = Math.sin(y * 0.0011 + x * 0.0007) * 16;
  let fy_ = Math.cos(x * 0.0009 - y * 0.0006) * 16;
  for (const o of nearbyCache) {
    const dx = x - o.x, dy = y - o.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > o.R * 1.35) continue;
    const wgt = Math.exp(-d / (o.R * 0.55));
    const radNorm = Math.max(-1, Math.min(1, (d - o.orbitR) / (o.orbitR || 1)));
    const radForce = radNorm * (radNorm > 0 ? 20 : 10) * Math.min(1.0, d / 50);
    // Soften spin force on small mechs (R < 100px) and near object core
    const rScale = Math.min(1.0, o.R / 90);
    const spinScale = Math.min(1.0, Math.pow(d / 75, 1.4)) * rScale;
    const spinForce = o.spin * 28 * spinScale;
    fx_ += (-dy / d * spinForce - dx / d * radForce) * wgt;
    fy_ += ( dx / d * spinForce - dy / d * radForce) * wgt;
  }
  return [fx_, fy_];
}
