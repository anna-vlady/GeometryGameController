import { ProunEngine } from '../core/engine';
import { MAXTANK, FUEL_COST, SUMMIT_Y, SPAWN, ACCEL, MAX_SPEED, G_GRAV, GRAV_CAP, GRAV_SWIRL, CENTER_K, CAP_THRESH, REL_THRESH, SWITCH_FAC, RADIAL_DAMP, DRAG_THRUST, DRAG_COAST } from './constants';
import { fieldAt } from './gravity';
import { spawnPart } from '../world/generator';
import { modeFreq } from '../audio/utils';
import { OCT } from '../world/constants';

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export function updateEngine(engine: ProunEngine, dt: number) {
  engine.frameId++;
  engine.notesBudget = 14;
  const t = performance.now() / 1000;
  const T = engine.audio.clockNow();
  
  // Input
  let inX = 0, inY = 0;
  if (engine.keys.has('KeyW') || engine.keys.has('ArrowUp'))    inY -= 1;
  if (engine.keys.has('KeyS') || engine.keys.has('ArrowDown'))  inY += 1;
  if (engine.keys.has('KeyA') || engine.keys.has('ArrowLeft'))  inX -= 1;
  if (engine.keys.has('KeyD') || engine.keys.has('ArrowRight')) inX += 1;
  
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of pads) {
    if (!gp) continue;
    const gx = gp.axes[0] || 0, gy = gp.axes[1] || 0;
    if (Math.abs(gx) > 0.18) inX += gx;
    if (Math.abs(gy) > 0.18) inY += gy;
  }
  const inputMagRaw = Math.hypot(inX, inY);
  if (inputMagRaw > 1) { inX /= inputMagRaw; inY /= inputMagRaw; }
  const inputMag = Math.hypot(inX, inY);

  // Neighbors
  engine.nearbyCache = [];
  const pcx = Math.floor(engine.player.x / 900), pcy = Math.floor(engine.player.y / 900);
  for (let cy = pcy - 2; cy <= pcy + 2; cy++)
    for (let cx = pcx - 2; cx <= pcx + 2; cx++)
      for (const o of engine.world.getChunk(cx, cy, engine.player.x, engine.player.y).mechs) 
        engine.nearbyCache.push(o);

  // Fuel economy
  const fuelTotal = engine.tanks[0] + engine.tanks[1] + engine.tanks[2] + engine.tanks[3];
  const thrustScale = fuelTotal > 0.1 ? 1 : 0.28;
  let ax = inX * ACCEL * thrustScale, ay = inY * ACCEL * thrustScale;
  if (inputMag > 0 && fuelTotal > 0.1) {
    const cost = FUEL_COST * inputMag * dt;
    const k = Math.min(1, cost / fuelTotal);
    for (let i = 0; i < 4; i++) engine.tanks[i] -= engine.tanks[i] * k;
  }

  // Wind
  const prog = clamp01((SPAWN.y - engine.player.y) / (SPAWN.y - SUMMIT_Y));
  const gust = 0.78 + 0.34 * Math.sin(t * 0.37 + Math.sin(t * 0.131) * 2.1);
  const wind = (40 + 1080 * Math.pow(prog, 1.55)) * gust;
  ay += wind;

  const [afx, afy] = fieldAt(engine.player.x, engine.player.y, engine.nearbyCache);
  ax += afx * 0.5; ay += afy * 0.5;

  // Gravity
  let domBest = null, domW = 0, domUx = 0, domUy = 0, domD = 1;
  for (const o of engine.nearbyCache) {
    const dx = o.x - engine.player.x, dy = o.y - engine.player.y;
    const d = Math.hypot(dx, dy) || 1;
    o._hear = Math.max(0, 1 - d / (o.R * 1.5));
    o._w = 0; o._wf = engine.frameId;
    if (o._colCd > 0) o._colCd -= dt;

    const reach = o.R * 1.45;
    if (d < reach) {
      const mass = o.outerR;
      const soft = o.coreSize * 1.1 + 46;
      const fill = engine.tanks[o.energy] / MAXTANK;
      let a = G_GRAV * mass / (d * d + soft * soft);
      a *= 0.55 + 0.7 * fill;
      if (a > GRAV_CAP) a = GRAV_CAP;
      a *= smoothstep(reach, reach * 0.66, d);
      const ux = dx / d, uy = dy / d;
      ax += ux * a; ay += uy * a;
      const sw = a * GRAV_SWIRL;
      ax += -uy * o.spin * sw; ay += ux * o.spin * sw;
      o._w = a;
      if (a > domW) { domW = a; domBest = o; domUx = ux; domUy = uy; domD = d; }
    }

    const collR = o.coreSize * 0.85 + 12;
    const safe = collR * 2.3;
    if (d < safe) {
      const push = 1 - d / safe;
      ax -= dx / d * push * push * 3000;
      ay -= dy / d * push * push * 3000;
    }
    if (d < collR && o._colCd <= 0) {
      const nx = -dx / d, ny = -dy / d;
      engine.player.x = o.x + nx * collR;
      engine.player.y = o.y + ny * collR;
      const dot = engine.player.vx * nx + engine.player.vy * ny;
      if (dot < 0) {
        engine.player.vx = (engine.player.vx - 2 * dot * nx) * 0.6;
        engine.player.vy = (engine.player.vy - 2 * dot * ny) * 0.6;
      }
      o._colCd = 0.5;
      engine.gestureCollision(o);
    }
  }

  if (domBest) {
    const ringErr = domD - domBest.orbitR;
    ax += domUx * ringErr * CENTER_K;
    ay += domUy * ringErr * CENTER_K;
  }

  engine.evCd -= dt;
  const wOf = (m: any) => (m && m._wf === engine.frameId) ? m._w : 0;
  if (engine.evCd <= 0) {
    if (!engine.dominant && domW > CAP_THRESH && domBest) {
      engine.dominant = domBest; engine.gestureCapture(domBest); engine.evCd = 0.3;
    } else if (engine.dominant) {
      const wd = wOf(engine.dominant);
      if (wd < REL_THRESH) { engine.dominant = null; engine.gestureRelease(); engine.evCd = 0.22; }
      else if (domBest && domBest !== engine.dominant && domW > wd * SWITCH_FAC && domW > CAP_THRESH) {
        engine.dominant = domBest; engine.gestureSwitch(domBest); engine.evCd = 0.3;
      }
    }
  }

  engine.player.vx += ax * dt; engine.player.vy += ay * dt;
  if (domBest) {
    const vr = engine.player.vx * domUx + engine.player.vy * domUy;
    const f = RADIAL_DAMP * dt;
    engine.player.vx -= domUx * vr * f; engine.player.vy -= domUy * vr * f;
  }
  const drag = Math.exp(-(inputMag > 0 ? DRAG_THRUST : DRAG_COAST) * dt);
  engine.player.vx *= drag; engine.player.vy *= drag;
  let speed = Math.hypot(engine.player.vx, engine.player.vy);
  if (speed > MAX_SPEED) {
    engine.player.vx *= MAX_SPEED / speed; engine.player.vy *= MAX_SPEED / speed;
    speed = MAX_SPEED;
  }
  engine.player.x += engine.player.vx * dt;
  engine.player.y += engine.player.vy * dt;

  if (!engine.won && engine.player.y <= SUMMIT_Y) { engine.won = true; engine.finale(); }

  for (let i = 0; i < 4; i++) {
    const orb = engine.player.orbs[i];
    const fill = engine.tanks[i] / MAXTANK;
    const wRot = (0.85 + i * 0.13) * (1.15 - 0.8 * fill);
    orb.phase += wRot * dt;
    if (orb.phase > Math.PI * 2) {
      orb.phase -= Math.PI * 2;
      orb.flashR = 1;
      if (engine.started) engine.playRev(i, orb);
    }
    orb.flashR *= Math.exp(-3 * dt);

    const baseR = 36 + fill * 14 + Math.sin(t * 2 + i * 1.7) * 3 + speed * 0.015;
    let bx = Math.cos(orb.phase + i * Math.PI / 2) * baseR;
    let by = Math.sin(orb.phase + i * Math.PI / 2) * baseR;

    let best = null, bestScore = 0;
    for (const o of engine.nearbyCache) {
      if (o.energy !== i) continue;
      const d = Math.hypot(o.x - engine.player.x, o.y - engine.player.y);
      if (d < o.R) {
        const s = 1 - d / o.R;
        if (s > bestScore) { bestScore = s; best = o; }
      }
    }
    orb.target = best;
    orb.score += (bestScore - orb.score) * (1 - Math.exp(-6 * dt));
    if (best) {
      const dx = best.x - engine.player.x, dy = best.y - engine.player.y;
      const d = Math.hypot(dx, dy) || 1;
      const lean = bestScore * (50 + 60 * fill);
      bx += (dx / d) * lean;
      by += (dy / d) * lean;
      best.act = Math.max(best.act, bestScore);
    }
    const k = 1 - Math.exp(-8 * dt);
    orb.ox += (bx - orb.ox) * k;
    orb.oy += (by - orb.oy) * k;
    orb.trail.push({ x: engine.player.x + orb.ox, y: engine.player.y + orb.oy });
    if (orb.trail.length > 26) orb.trail.shift();

    if (engine.audio.ac && engine.audio.sus[i]) {
      const v = engine.audio.sus[i];
      const eased = orb.score * orb.score * (3 - 2 * orb.score);
      v.g.gain.setTargetAtTime(v.def.g * eased, engine.audio.ac.currentTime, 0.12);
      if (best) {
        v.o1.frequency.setTargetAtTime(modeFreq(i, best.rootDeg, OCT[i]), engine.audio.ac.currentTime, 0.2);
      }
    }
    engine.collectFlash[i] *= Math.exp(-2.2 * dt);
  }

  for (let i = 0; i < 4; i++) engine.tanks[i] = Math.max(0, engine.tanks[i] - 0.04 * dt);

  const audible = engine.nearbyCache.filter(o => o._hear > 0.04)
                             .sort((a, b) => b._hear - a._hear)
                             .slice(0, 3);
  for (const o of audible)
    for (const ring of o.rings) engine.scheduleRing(o, ring, T);

  for (const o of engine.nearbyCache) {
    o.corePulse *= Math.exp(-4 * dt);
    o.act *= Math.exp(-1.2 * dt);
    for (const ring of o.rings) {
      while (ring.pending.length && ring.pending[0].at <= T) {
        const ev = ring.pending.shift()!;
        ring.flash[ev.idx] = 1;
        ring.headPulse = 1;
        if (ev.idx === 0) o.corePulse = 1;
      }
      for (let i = 0; i < ring.flash.length; i++) ring.flash[i] *= Math.exp(-5 * dt);
      ring.headPulse *= Math.exp(-5 * dt);
    }
    const kf = 1 - Math.exp(-2.2 * dt);
    const activeN = Math.round(o.parts.length * engine.particleFrac);
    for (let pi = 0; pi < activeN; pi++) {
      const p = o.parts[pi];
      if (!p) continue;
      const [fx2, fy2] = fieldAt(p.x, p.y, engine.nearbyCache);
      p.vx += (fx2 - p.vx) * kf;
      p.vy += (fy2 - p.vy) * kf;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) { Object.assign(p, spawnPart(o)); continue; }
      const d = Math.hypot(p.x - engine.player.x, p.y - engine.player.y);
      if (d < 30) { engine.collect(o.energy); Object.assign(p, spawnPart(o)); }
    }
  }

  engine.fx.strobe *= Math.exp(-9 * dt);
  engine.fx.distort *= Math.exp(-4.5 * dt);
  for (const s of engine.fx.shocks) { s.r += s.v * dt; s.v *= Math.exp(-2 * dt); s.life -= dt * 1.4; }
  engine.fx.shocks = engine.fx.shocks.filter(s => s.life > 0);

  if (engine.audio.ac) {
    const sp = speed / MAX_SPEED;
    const starving = fuelTotal <= 0.1;
    if (engine.audio.windGain)
      engine.audio.windGain.gain.setTargetAtTime(sp * 0.03 + prog * 0.022, engine.audio.ac.currentTime, 0.25);
    if (engine.audio.thrust) {
      const on = inputMag > 0;
      const lvl = on ? (starving ? 0.05 : 0.07 + sp * 0.08) : sp * 0.02;
      engine.audio.thrust.amp.gain.setTargetAtTime(lvl, engine.audio.ac.currentTime, on ? 0.05 : 0.3);
      engine.audio.thrust.tremD.gain.setTargetAtTime(lvl * (0.22 + sp * 0.5), engine.audio.ac.currentTime, 0.1);
      engine.audio.thrust.trem.frequency.setTargetAtTime((starving ? 8 : 3) + sp * 9, engine.audio.ac.currentTime, 0.15);
      engine.audio.thrust.lp.frequency.setTargetAtTime(300 + sp * 3200, engine.audio.ac.currentTime, 0.1);
      engine.audio.thrust.glide.frequency.setTargetAtTime(36.708 * 2 * (1.5 + sp * 1.5) * (starving ? 0.5 : 1), engine.audio.ac.currentTime, 0.12);
      engine.audio.thrust.glide.detune.setTargetAtTime(starving ? 30 : 0, engine.audio.ac.currentTime, 0.2);
      engine.audio.thrust.glideG.gain.setTargetAtTime(
        (on ? 0.35 + sp * 0.55 : sp * 0.3) * (starving ? 0.5 : 1), engine.audio.ac.currentTime, 0.15);
    }
  }
}
