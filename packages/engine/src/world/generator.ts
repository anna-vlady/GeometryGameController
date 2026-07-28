import { DUR_POOL, OCT, RING_RATIO } from './constants';
import { SPAWN, FLOOR_Y, SUMMIT_Y } from '../physics/constants';
import { hash2, mulberry32 } from '../core/utils';
import { Voice, Mech, Particle, Chunk, FarDecor, Decor } from './types';

const CHUNK = 900;

/**
 * Макроформа горы Арарат:
 *   0–1000 м:   широкое плотное подножие       (density ≈ 1.0)
 *   1000–2500 м: постепенное сужение          (density ≈ 0.7–0.4)
 *   2500–4000 м: крутой склон, разреженность   (density ≈ 0.35–0.15)
 *   4000–5165 м: снежная вершина, единицы      (density ≈ 0.12–0.05)
 *
 * t = 0 на вершине (SUMMIT_Y), t = 1 у подножия (FLOOR_Y)
 */
export function densityAt(y: number): number {
  const t = Math.max(0, Math.min(1, (y - SUMMIT_Y) / (FLOOR_Y - SUMMIT_Y)));

  if (t < 0.22) {
    // Снежная вершина — минимум объектов
    const s = t / 0.22;
    return 0.05 + 0.07 * s;
  } else if (t < 0.52) {
    // Крутой склон — объекты постепенно появляются
    const s = (t - 0.22) / 0.30;
    return 0.12 + 0.23 * s * s;
  } else if (t < 0.80) {
    // Среднегорье — увеличение плотности
    const s = (t - 0.52) / 0.28;
    return 0.35 + 0.40 * s;
  } else {
    // Широкое подножие — максимальная плотность объектов
    const s = (t - 0.80) / 0.20;
    return 0.75 + 0.25 * s;
  }
}

function makeNRR(rnd: () => number, half: number): number[] {
  const a: number[] = [];
  for (let i = 0; i < half; i++) a.push(DUR_POOL[(rnd() * DUR_POOL.length) | 0]);
  const c = DUR_POOL[(rnd() * DUR_POOL.length) | 0];
  return a.concat([c], a.slice().reverse());
}

export function newVoice(rnd: () => number, o: Partial<Mech>, pulseMul: number, octShift: number): Voice {
  const talea = makeNRR(rnd, 1 + ((rnd() * 3) | 0));
  const cum: number[] = [];
  let acc = 0;
  for (const d of talea) { cum.push(acc); acc += d; }
  const colorLen = talea.length + (rnd() < 0.5 ? 1 : 2);
  const colorSeq: number[] = [];
  let dg = (rnd() * 6) | 0;
  for (let i = 0; i < colorLen; i++) { colorSeq.push(dg); dg += ((rnd() * 5) | 0) - 2; }
  return {
    talea, cum, total: acc,
    colorSeq, colorPos: 0,
    pulse: (o.pulse || 1) * pulseMul,
    tempoMul: 1,
    persona: ((rnd() * 3) | 0) - 1,
    refT: rnd() * 200,
    oct: OCT[o.energy || 0] + (octShift | 0),
    nextIdx: 0,
    pending: [],
    flash: Array(talea.length).fill(0),
    headPulse: 0
  };
}

// позиция кольца — чистая функция времени, точная (учитывает tempoMul
// ритмического персонажа); общая для планировщика звука и рендерера
export function ringPos(ring: Voice, T: number): number {
  const spp = ring.pulse / ring.tempoMul;
  let p = ((T - ring.refT) / spp) % ring.total;
  return p < 0 ? p + ring.total : p;
}

export function spawnPart(o: Mech): Particle {
  const ring = o.rings[(Math.random() * o.rings.length) | 0];
  const a = Math.random() * Math.PI * 2;
  const sp = 8 + Math.random() * 14;
  return {
    x: o.x + Math.cos(a) * (ring.r || 0),
    y: o.y + Math.sin(a) * (ring.r || 0),
    vx: -Math.sin(a) * sp * (ring.dir || 1),
    vy:  Math.cos(a) * sp * (ring.dir || 1),
    life: 4 + Math.random() * 7
  };
}

function makeOrbital(o: Mech, rnd: () => number) {
  const sc = o.scale;
  const elliptic = rnd() < 0.55;
  let r = (o.coreSize + 24 + rnd() * 22) * (0.6 + sc * 0.4);
  const nRings = 2 + ((rnd() * 4) | 0);
  for (let k = 0; k < nRings; k++) {
    const v = newVoice(rnd, o, RING_RATIO[Math.min(k, 3)], (k === 0 ? 1 : 0) - (k >= 2 ? 1 : 0));
    v.kind = 'ring'; v.instr = 'creature';
    v.r = r;
    v.ecc = elliptic ? 0.52 + rnd() * 0.4 : 1;
    v.tilt = o.tilt + (rnd() - 0.5) * 0.5;
    v.dir = (k % 2 === 0 ? 1 : -1) * o.spin;
    v.phase0 = rnd() * Math.PI * 2;
    v.wavy = v.talea.indexOf(1.5) >= 0;
    o.rings.push(v);
    r += (26 + rnd() * 42) * sc;
  }
  o.outerR = r;
}

function makeProun(o: Mech, rnd: () => number) {
  o.archetype = 'proun';
  const subKinds = [
    'proun-1e', 'proun-93', 'proun-5a', 'proun-12e',
    'proun-grid', 'proun-thrust', 'proun-concentric', 'proun-arc',
    'proun-hatch', 'proun-wedge-bar', 'proun-trap', 'proun-frame'
  ];
  const subKind = subKinds[(rnd() * subKinds.length) | 0];
  o.subKind = subKind;

  const axis = (rnd() < 0.5 ? -1 : 1) * (Math.PI * 0.16 + rnd() * Math.PI * 0.17);
  o.axis = axis;
  const ux = Math.cos(axis), uy = Math.sin(axis);
  const nx = -uy, ny = ux;
  const U = (24 + rnd() * 16) * o.scale;
  const side = rnd() < 0.5 ? 1 : -1;
  let reach = o.coreSize;

  const el = (cfg: any) => {
    const v = newVoice(rnd, o, cfg.pulseMul, cfg.octShift);
    const u = cfg.u * U, w = cfg.v * U;
    v.bx = u * ux + w * nx;
    v.by = u * uy + w * ny;
    v.kind = cfg.kind; v.instr = cfg.instr || 'plane';
    v.len = cfg.len * U; v.wid = (cfg.wid || 0.14) * U;
    v.rot = cfg.rot != null ? cfg.rot : axis;
    v.motion = cfg.motion || 'none'; v.amp = (cfg.amp || 0) * U;
    v.mfreq = cfg.mfreq || 0.2; v.mphase = rnd() * Math.PI * 2;
    v.depth = cfg.depth || 0.5; v.col = cfg.col || 0;
    v.dir = (rnd() < 0.5 ? -1 : 1) * o.spin;
    v.r = Math.hypot(v.bx, v.by) + (v.len || 0) * 0.35;
    reach = Math.max(reach, v.r);
    o.rings.push(v);
  };

  switch (subKind) {
    case 'proun-1e': // Central big disc + long needles + floating planes
      el({ kind: 'ring-disc', instr: 'plane', u: 0, v: 0, len: 2.8, wid: 2.8, motion: 'bob', amp: 0.2, mfreq: 0.15, depth: 0.9, col: 0, pulseMul: 3, octShift: -1 });
      el({ kind: 'needle', instr: 'needle', u: -1.8 * side, v: 0.2, len: 4.2, wid: 0.08, rot: axis + Math.PI * 0.15, motion: 'spin', amp: 0, mfreq: 0.1, depth: 0.4, col: 1, pulseMul: 1, octShift: 1 });
      el({ kind: 'parallelogram', instr: 'bar', u: 1.4 * side, v: -0.6 * side, len: 2.2, wid: 0.8, rot: axis - Math.PI * 0.2, motion: 'slide', amp: 0.4, mfreq: 0.2, depth: 0.6, col: 0, pulseMul: 2, octShift: 0 });
      break;

    case 'proun-93': // Diagonal main truss + angled wedges & striped planes
      el({ kind: 'bar', instr: 'bar', u: 0, v: 0, len: 4.8, wid: 0.2, rot: axis, motion: 'seesaw', amp: 0.08, mfreq: 0.1, depth: 0.3, col: 1, pulseMul: 1, octShift: -1 });
      el({ kind: 'striped-plane', instr: 'plane', u: -1.2 * side, v: 0.6 * side, len: 2.4, wid: 1.1, rot: axis + Math.PI * 0.25, motion: 'slide', amp: 0.5, mfreq: 0.2, depth: 0.8, col: 0, pulseMul: 2, octShift: 0 });
      el({ kind: 'wedge', instr: 'wedge', u: 1.8 * side, v: -0.4 * side, len: 1.2, wid: 1.2, rot: axis + Math.PI * 0.5, motion: 'drift', amp: 0.3, mfreq: 0.3, depth: 0.9, col: 0, pulseMul: 1.5, octShift: 1 });
      break;

    case 'proun-5a': // Light grid cross + floating frame box + dots
      el({ kind: 'grid-cross', instr: 'needle', u: 0, v: 0, len: 3.6, wid: 0.25, rot: axis, motion: 'none', amp: 0, mfreq: 0, depth: 0.2, col: 1, pulseMul: 1, octShift: 0 });
      el({ kind: 'frame-box', instr: 'bar', u: 1.1 * side, v: 0.8 * side, len: 2.1, wid: 1.4, rot: axis + Math.PI * 0.1, motion: 'bob', amp: 0.3, mfreq: 0.25, depth: 0.5, col: 0, pulseMul: 2, octShift: 1 });
      el({ kind: 'disc', instr: 'disc', u: -1.5 * side, v: -0.9 * side, len: 0.8, wid: 0.8, motion: 'bob', amp: 0.4, mfreq: 0.3, depth: 0.7, col: 0, pulseMul: 1.5, octShift: 2 });
      break;

    case 'proun-12e': // Dynamic wedge arrow + curved arc segments
      el({ kind: 'wedge', instr: 'wedge', u: 0, v: -0.5 * side, len: 2.5, wid: 2.5, rot: axis, motion: 'slide', amp: 0.6, mfreq: 0.25, depth: 0.95, col: 0, pulseMul: 3, octShift: -1 });
      el({ kind: 'arc-segment', instr: 'disc', u: 0.5 * side, v: 0.9 * side, len: 3.2, wid: 0.2, rot: axis + Math.PI * 0.3, motion: 'spin', amp: 0, mfreq: 0.12, depth: 0.5, col: 1, pulseMul: 1.5, octShift: 0 });
      el({ kind: 'needle', instr: 'needle', u: -1.3 * side, v: -0.8 * side, len: 2.0, wid: 0.06, rot: axis - Math.PI * 0.4, motion: 'drift', amp: 0.2, mfreq: 0.3, depth: 0.3, col: 0, pulseMul: 1, octShift: 1 });
      break;

    case 'proun-grid': // Dual intersecting grids with small accent discs
      el({ kind: 'grid-cross', instr: 'needle', u: -0.8 * side, v: 0.2, len: 4.0, wid: 0.3, rot: axis, motion: 'seesaw', amp: 0.05, mfreq: 0.18, depth: 0.3, col: 1, pulseMul: 1, octShift: 0 });
      el({ kind: 'trapezoid', instr: 'plane', u: 1.2 * side, v: -0.7 * side, len: 1.9, wid: 1.0, rot: axis + Math.PI * 0.2, motion: 'slide', amp: 0.3, mfreq: 0.22, depth: 0.8, col: 0, pulseMul: 2, octShift: 1 });
      break;

    case 'proun-thrust': // Slanted parallelograms creating 3D thrust feel
      el({ kind: 'parallelogram', instr: 'plane', u: -1.2 * side, v: 0.3 * side, len: 3.1, wid: 1.2, rot: axis, motion: 'slide', amp: 0.7, mfreq: 0.2, depth: 0.85, col: 0, pulseMul: 3, octShift: -1 });
      el({ kind: 'bar', instr: 'bar', u: 1.5 * side, v: -0.8 * side, len: 2.8, wid: 0.15, rot: axis + Math.PI * 0.5, motion: 'seesaw', amp: 0.12, mfreq: 0.35, depth: 0.4, col: 1, pulseMul: 1.5, octShift: 0 });
      break;

    case 'proun-concentric': // Nested ring-discs and bars
      el({ kind: 'ring-disc', instr: 'disc', u: -0.5 * side, v: 0, len: 2.6, wid: 2.6, motion: 'bob', amp: 0.25, mfreq: 0.15, depth: 0.9, col: 0, pulseMul: 2, octShift: -1 });
      el({ kind: 'disc', instr: 'disc', u: 1.6 * side, v: -0.8 * side, len: 1.1, wid: 1.1, motion: 'bob', amp: 0.4, mfreq: 0.28, depth: 0.7, col: 1, pulseMul: 1.5, octShift: 1 });
      break;

    case 'proun-arc': // Big sweeping arc-segment with wedge indicator
      el({ kind: 'arc-segment', instr: 'plane', u: 0, v: 0, len: 4.2, wid: 0.25, rot: axis, motion: 'spin', amp: 0, mfreq: 0.08, depth: 0.5, col: 1, pulseMul: 1, octShift: -1 });
      el({ kind: 'wedge', instr: 'wedge', u: -1.5 * side, v: 0.6 * side, len: 1.4, wid: 1.4, rot: axis - Math.PI * 0.3, motion: 'drift', amp: 0.3, mfreq: 0.3, depth: 0.85, col: 0, pulseMul: 2, octShift: 0 });
      break;

    case 'proun-hatch': // Hatching striped plane with grid cross
      el({ kind: 'striped-plane', instr: 'plane', u: 0.4 * side, v: -0.2 * side, len: 3.4, wid: 1.3, rot: axis, motion: 'slide', amp: 0.4, mfreq: 0.18, depth: 0.8, col: 0, pulseMul: 2.5, octShift: -1 });
      el({ kind: 'grid-cross', instr: 'needle', u: -1.6 * side, v: 0.7 * side, len: 2.6, wid: 0.2, rot: axis + Math.PI * 0.4, motion: 'none', amp: 0, mfreq: 0, depth: 0.3, col: 1, pulseMul: 1, octShift: 1 });
      break;

    case 'proun-wedge-bar': // Multiple intersecting bars with sharp wedge head
      el({ kind: 'wedge', instr: 'wedge', u: 1.9 * side, v: 0, len: 1.8, wid: 1.8, rot: axis + Math.PI * 0.5, motion: 'drift', amp: 0.4, mfreq: 0.25, depth: 0.9, col: 0, pulseMul: 2, octShift: 0 });
      el({ kind: 'bar', instr: 'bar', u: -0.6 * side, v: -0.4 * side, len: 3.8, wid: 0.18, rot: axis, motion: 'seesaw', amp: 0.1, mfreq: 0.15, depth: 0.4, col: 1, pulseMul: 1, octShift: -1 });
      break;

    case 'proun-trap': // Large trapezoid with needle and small ring-disc
      el({ kind: 'trapezoid', instr: 'plane', u: -0.8 * side, v: -0.3 * side, len: 2.9, wid: 1.5, rot: axis, motion: 'slide', amp: 0.5, mfreq: 0.2, depth: 0.85, col: 0, pulseMul: 2.5, octShift: -1 });
      el({ kind: 'ring-disc', instr: 'disc', u: 1.4 * side, v: 0.8 * side, len: 1.2, wid: 1.2, motion: 'bob', amp: 0.35, mfreq: 0.25, depth: 0.6, col: 1, pulseMul: 1.5, octShift: 1 });
      break;

    case 'proun-frame': // Large structural frame-box with floating planes
    default:
      el({ kind: 'frame-box', instr: 'bar', u: 0, v: 0, len: 3.5, wid: 2.2, rot: axis, motion: 'bob', amp: 0.2, mfreq: 0.15, depth: 0.5, col: 1, pulseMul: 1, octShift: -1 });
      el({ kind: 'plane', instr: 'plane', u: -1.4 * side, v: 0.8 * side, len: 2.0, wid: 0.9, rot: axis + Math.PI * 0.2, motion: 'slide', amp: 0.4, mfreq: 0.25, depth: 0.8, col: 0, pulseMul: 2, octShift: 0 });
      break;
  }

  if (rnd() < 0.75) {
    const fu = -0.6 * side * U, fv = -1.9 * side * U;
    const fw = (1.4 + rnd() * 0.7) * U, fh = (1.0 + rnd() * 0.5) * U;
    o.frames.push({ bx: fu * ux + fv * nx, by: fu * uy + fv * ny, w: fw, h: fh, rot: axis + (rnd() - 0.5) * 0.5 });
    reach = Math.max(reach, Math.hypot(fu, fv) + Math.max(fw, fh) * 0.6);
  }

  o.outerR = reach + 24;
}

export function makeMech(rnd: () => number, x: number, y: number): Mech {
  let scale = 0.85 + Math.pow(rnd(), 1.8) * 1.6;
  if (rnd() < 0.12) scale += 0.6 + rnd() * 1.4;
  const o: Mech = {
    x, y, scale,
    energy: (rnd() * 4) | 0,
    spin: rnd() < 0.5 ? -1 : 1,
    coreSize: (26 + rnd() * 36) * (0.5 + scale * 0.5),
    coreRot: (rnd() < 0.5 ? -1 : 1) * (Math.PI / 12 + rnd() * Math.PI / 4),
    tilt: (rnd() - 0.5) * Math.PI,
    pulse: 0.40 + rnd() * 0.42,
    rootDeg: (rnd() * 8) | 0,
    act: 0, corePulse: 0,
    _hear: 0, _w: 0, _wf: -1, _colCd: 0,
    archetype: 'orbital', axis: 0,
    rings: [], frames: [], parts: [],
    orbitR: 0, R: 0, outerR: 0, partN: 0
  };
  if (rnd() < 0.45) makeProun(o, rnd); else makeOrbital(o, rnd);
  o.orbitR = o.outerR * 0.8;
  o.R = o.outerR + 170 + rnd() * 70;
  o.partN = Math.min(80, Math.round((24 + rnd() * 28) * (0.8 + scale * 0.5)));
  for (let p = 0; p < o.partN; p++) o.parts.push(spawnPart(o));
  return o;
}

const DECOR_KINDS = ['cross', 'arc', 'outline', 'dots'];

export class WorldGenerator {
  chunks = new Map<string, Chunk>();
  farChunks = new Map<string, FarDecor[]>();
  FAR_CHUNK = 1500;
  FAR_FACTOR = 0.35;

  constructor(public seed: number) {}

  getChunk(cx: number, cy: number, playerX: number, playerY: number): Chunk {
    const key = cx + ',' + cy;
    let c = this.chunks.get(key);
    if (c) return c;
    const rnd = mulberry32(hash2(cx, cy, 1013, this.seed));
    const yMid = (cy + 0.5) * CHUNK;
    const dens = densityAt(yMid);
    c = { mechs: [], decor: [] };
    let n = Math.round(dens * (0.8 + rnd() * 1.5));
    if (yMid > 3200 && rnd() < 0.4) n++;
    n = Math.min(n, 3);
    for (let i = 0; i < n; i++) {
      const qx = (i % 2) * 0.5, qy = ((i / 2) | 0) * 0.5;
      const mx = cx * CHUNK + (qx + 0.08 + rnd() * 0.34) * CHUNK;
      const my = cy * CHUNK + (qy + 0.08 + rnd() * 0.34) * CHUNK;
      if (Math.hypot(mx - SPAWN.x, my - SPAWN.y) > 650) {
        c.mechs.push(makeMech(rnd, mx, my));
      }
    }
    const nd = Math.round((0.3 + rnd() * 1.8) * (0.35 + 0.65 * dens));
    for (let i = 0; i < nd; i++) {
      c.decor.push({
        kind: DECOR_KINDS[(rnd() * 4) | 0],
        x: cx * CHUNK + rnd() * CHUNK,
        y: cy * CHUNK + rnd() * CHUNK,
        size: 22 + rnd() * 55,
        rot: (rnd() - 0.5) * Math.PI
      });
    }
    this.chunks.set(key, c);
    
    // Garbage collection
    if (this.chunks.size > 280) {
      for (const [k] of this.chunks) {
        const [kx, ky] = k.split(',').map(Number);
        if (Math.abs(kx * CHUNK - playerX) > CHUNK * 6 ||
            Math.abs(ky * CHUNK - playerY) > CHUNK * 6) this.chunks.delete(k);
        if (this.chunks.size <= 160) break;
      }
    }
    return c;
  }

  getFarChunk(cx: number, cy: number): FarDecor[] {
    const key = cx + ',' + cy;
    let arr = this.farChunks.get(key);
    if (arr) return arr;
    const rnd = mulberry32(hash2(cx, cy, 7717, this.seed));
    arr = [];
    const dens = densityAt(cy * this.FAR_CHUNK / this.FAR_FACTOR);
    const n = Math.round((0.6 + rnd() * 1.6) * (0.25 + 0.75 * dens));
    for (let i = 0; i < n; i++) {
      arr.push({
        x: cx * this.FAR_CHUNK + rnd() * this.FAR_CHUNK,
        y: cy * this.FAR_CHUNK + rnd() * this.FAR_CHUNK,
        size: 180 + rnd() * 320,
        rot: (rnd() - 0.5) * Math.PI,
        kind: (rnd() * 3) | 0
      });
    }
    this.farChunks.set(key, arr);
    if (this.farChunks.size > 200) this.farChunks.clear();
    return arr;
  }
  
  clear() {
    this.chunks.clear();
    this.farChunks.clear();
  }
}
