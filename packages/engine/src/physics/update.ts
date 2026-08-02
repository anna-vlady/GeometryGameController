import type { ProunEngine } from '../core/engine';
import { MAXTANK, FUEL_COST, SUMMIT_Y, SPAWN, FLOOR_Y, ACCEL, MAX_SPEED, MAGNET_RHYTHM_MULT, TETHER_MAX_DIST, TETHER_SPRING_K, COMPOSITE_CORE_R, G_GRAV, GRAV_CAP, GRAV_SWIRL, CENTER_K, CAP_THRESH, REL_THRESH, SWITCH_FAC, RADIAL_DAMP, DRAG_THRUST, DRAG_COAST } from './constants';
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

  const activeSlots = engine.slots && engine.slots.length > 0
    ? engine.slots.filter(s => s.active)
    : [{
        slotId: 'SLOT-1', num: 1, name: 'PLAYER 1', color: '#BF3B2B', active: true, connected: false,
        player: engine.player, tanks: engine.tanks, collectFlash: engine.collectFlash,
        remoteStick: (engine as any).remoteStick || { x: 0, y: 0 },
        boostTimer: 0, magnetTimer: 0
      }];

  // Keyboard input for player 1
  let kbX = 0, kbY = 0;
  if (engine.keys.has('KeyW') || engine.keys.has('ArrowUp'))    kbY -= 1;
  if (engine.keys.has('KeyS') || engine.keys.has('ArrowDown'))  kbY += 1;
  if (engine.keys.has('KeyA') || engine.keys.has('ArrowLeft'))  kbX -= 1;
  if (engine.keys.has('KeyD') || engine.keys.has('ArrowRight')) kbX += 1;

  const pads = navigator.getGamepads ? navigator.getGamepads() : [];

  // 1. Process physics for each active slot
  for (const slot of activeSlots) {
    let inX = 0, inY = 0;

    if (slot.num === 1) {
      inX += kbX;
      inY += kbY;
      for (const gp of pads) {
        if (!gp) continue;
        const gx = gp.axes[0] || 0, gy = gp.axes[1] || 0;
        if (Math.abs(gx) > 0.18) inX += gx;
        if (Math.abs(gy) > 0.18) inY += gy;
      }
    }

    if (slot.remoteStick && (Math.abs(slot.remoteStick.x) > 0.05 || Math.abs(slot.remoteStick.y) > 0.05)) {
      inX += slot.remoteStick.x;
      inY += slot.remoteStick.y;
    }

    const inputMagRaw = Math.hypot(inX, inY);
    if (inputMagRaw > 1) { inX /= inputMagRaw; inY /= inputMagRaw; }
    const inputMag = Math.hypot(inX, inY);

    // Fuel economy
    const fuelTotal = slot.tanks[0] + slot.tanks[1] + slot.tanks[2] + slot.tanks[3];
    const thrustScale = fuelTotal > 0.1 ? 1 : 0.28;
    let ax = inX * ACCEL * thrustScale, ay = inY * ACCEL * thrustScale;

    // Boost & Magnet Timers
    if (slot.boostTimer && slot.boostTimer > 0) {
      slot.boostTimer -= dt;
      ax *= 2.2;
      ay *= 2.2;
    }
    if (slot.magnetTimer && slot.magnetTimer > 0) {
      slot.magnetTimer -= dt;
    }

    if (inputMag > 0 && fuelTotal > 0.1) {
      const cost = FUEL_COST * inputMag * dt;
      const k = Math.min(1, cost / fuelTotal);
      for (let i = 0; i < 4; i++) slot.tanks[i] -= slot.tanks[i] * k;
    }

    // Wind
    const prog = clamp01((SPAWN.y - slot.player.y) / (SPAWN.y - SUMMIT_Y));
    const gust = 0.78 + 0.34 * Math.sin(t * 0.37 + Math.sin(t * 0.131) * 2.1);
    const wind = (40 + 480 * Math.pow(prog, 1.3)) * gust;
    ay += wind;

    // Field at player position
    const [afx, afy] = fieldAt(slot.player.x, slot.player.y, engine.nearbyCache);
    ax += afx * 0.5; ay += afy * 0.5;

    // Gravity pull towards dominant mech
    if (engine.dominant) {
      const dx = engine.dominant.x - slot.player.x, dy = engine.dominant.y - slot.player.y;
      const d = Math.hypot(dx, dy) || 1;
      const ux = dx / d, uy = dy / d;
      const ringErr = d - engine.dominant.orbitR;
      ax += ux * ringErr * CENTER_K;
      ay += uy * ringErr * CENTER_K;
    }

    slot.player.vx += ax * dt; slot.player.vy += ay * dt;
    const drag = Math.exp(-(inputMag > 0 ? DRAG_THRUST : DRAG_COAST) * dt);
    slot.player.vx *= drag; slot.player.vy *= drag;

    let speed = Math.hypot(slot.player.vx, slot.player.vy);
    const currentMaxSpeed = (slot.boostTimer && slot.boostTimer > 0) ? MAX_SPEED * 1.55 : MAX_SPEED;
    if (speed > currentMaxSpeed) {
      slot.player.vx *= currentMaxSpeed / speed; slot.player.vy *= currentMaxSpeed / speed;
      speed = currentMaxSpeed;
    }
    slot.player.x += slot.player.vx * dt;
    slot.player.y += slot.player.vy * dt;

    // Floor clamp
    if (slot.player.y > FLOOR_Y) {
      slot.player.y = FLOOR_Y;
      if (slot.player.vy > 0) slot.player.vy = 0;
    }

    if (!engine.won && slot.player.y <= SUMMIT_Y) { engine.won = true; engine.finale(); }

    // Update 4 energy orbiting nodes
    for (let i = 0; i < 4; i++) {
      const orb = slot.player.orbs[i];
      const fill = slot.tanks[i] / MAXTANK;
      const wRot = (0.85 + i * 0.13) * (1.15 - 0.8 * fill);
      orb.phase += wRot * dt;
      if (orb.phase > Math.PI * 2) {
        orb.phase -= Math.PI * 2;
        orb.flashR = 1;
        if (engine.started && slot.num === 1) engine.playRev(i, orb);
      }
      orb.flashR *= Math.exp(-3 * dt);

      const baseR = 36 + fill * 14 + Math.sin(t * 2 + i * 1.7) * 3 + speed * 0.015;
      let bx = Math.cos(orb.phase + i * Math.PI / 2) * baseR;
      let by = Math.sin(orb.phase + i * Math.PI / 2) * baseR;

      let best = null, bestScore = 0;
      for (const o of engine.nearbyCache) {
        if (o.energy !== i) continue;
        const d = Math.hypot(o.x - slot.player.x, o.y - slot.player.y);
        if (d < o.R) {
          const s = 1 - d / o.R;
          if (s > bestScore) { bestScore = s; best = o; }
        }
      }
      orb.target = best;
      orb.score += (bestScore - orb.score) * (1 - Math.exp(-6 * dt));
      if (best) {
        const dx = best.x - slot.player.x, dy = best.y - slot.player.y;
        const d = Math.hypot(dx, dy);
        // Center ease: as player arrives at object center (d < 80px), fade lean smoothly to 0 to prevent 110px hyper-rotation!
        const centerEase = d < 80 ? Math.max(0, (d - 15) / 65) : 1.0;
        const lean = bestScore * (50 + 60 * fill) * centerEase;
        if (d > 3 && lean > 0.1) {
          bx += (dx / d) * lean;
          by += (dy / d) * lean;
        }
        best.act = Math.max(best.act, bestScore);
      }
      (orb as any).soloOx = bx;
      (orb as any).soloOy = by;

      const cBlend = (slot as any).coopBlend || 0;
      const k = 1 - Math.exp(-8 * dt);
      if (cBlend < 0.01) {
        orb.ox += (bx - orb.ox) * k;
        orb.oy += (by - orb.oy) * k;
      } else {
        orb.ox += (bx - orb.ox) * (1 - cBlend) * k;
        orb.oy += (by - orb.oy) * (1 - cBlend) * k;
      }
      orb.trail.push({ x: slot.player.x + orb.ox, y: slot.player.y + orb.oy });
      if (orb.trail.length > 26) orb.trail.shift();
    }

    for (let i = 0; i < 4; i++) slot.tanks[i] = Math.max(0, slot.tanks[i] - 0.04 * dt);
    for (let i = 0; i < 4; i++) slot.collectFlash[i] *= Math.exp(-2.2 * dt);
  }

  // Camera Centroid & Viewport Boundary Clamping
  const camX = activeSlots.reduce((acc, s) => acc + s.player.x, 0) / activeSlots.length;
  const camY = activeSlots.reduce((acc, s) => acc + s.player.y, 0) / activeSlots.length;
  const viewW = engine.canvas ? (engine.canvas.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1280)) : 1280;
  const viewH = engine.canvas ? (engine.canvas.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 720)) : 720;
  const marginX = Math.max(100, (viewW / 2) - 35);
  const marginY = Math.max(80, (viewH / 2) - 35);

  for (const slot of activeSlots) {
    if (slot.player.x < camX - marginX) {
      slot.player.x = camX - marginX;
      if (slot.player.vx < 0) slot.player.vx = 0;
    }
    if (slot.player.x > camX + marginX) {
      slot.player.x = camX + marginX;
      if (slot.player.vx > 0) slot.player.vx = 0;
    }
    if (slot.player.y < camY - marginY) {
      slot.player.y = camY - marginY;
      if (slot.player.vy < 0) slot.player.vy = 0;
    }
    if (slot.player.y > camY + marginY) {
      slot.player.y = camY + marginY;
      if (slot.player.vy > 0) slot.player.vy = 0;
    }
    // 2. Breakable Co-op Tether & Structured Composite Player Geometry
  engine.coopTandem = false;
  engine.coopBeam = false;

  if (activeSlots.length > 1) {
    for (let i = 0; i < activeSlots.length; i++) {
      for (let j = i + 1; j < activeSlots.length; j++) {
        const s1 = activeSlots[i], s2 = activeSlots[j];
        const dx = s2.player.x - s1.player.x;
        const dy = s2.player.y - s1.player.y;
        const dist = Math.hypot(dx, dy) || 1;
        const ux = dx / dist, uy = dy / dist;

        // Check player inputs
        const in1X = (s1.remoteStick?.x || 0) + (s1.num === 1 ? kbX : 0);
        const in1Y = (s1.remoteStick?.y || 0) + (s1.num === 1 ? kbY : 0);
        const in2X = (s2.remoteStick?.x || 0);
        const in2Y = (s2.remoteStick?.y || 0);

        // Calculate input projection along tether axis (ux, uy points from s1 to s2)
        const in1Dot = in1X * ux + in1Y * uy;
        const in2Dot = in2X * (-ux) + in2Y * (-uy);
        // Score for steering away from each other: positive when pulling apart
        const pullApartScore = Math.max(0, -in1Dot) + Math.max(0, -in2Dot);

        // Smooth steering tension accumulator for spring force easing
        const steerTension = Math.max(0, Math.min(1.0, pullApartScore * 0.45));
        if (!(s1 as any)._tetherTension) (s1 as any)._tetherTension = 0;
        (s1 as any)._tetherTension += (steerTension - (s1 as any)._tetherTension) * (1 - Math.exp(-3.6 * dt));
        const tetherTension = (s1 as any)._tetherTension;

        // Breakout ease factor: smoothly eases attraction spring force when players steer apart
        const breakoutEase = Math.max(0.08, Math.pow(1.0 - tetherTension, 1.4));

        // Check if pulled by different external mechs
        const mech1 = engine.nearbyCache.find(m => Math.hypot(m.x - s1.player.x, m.y - s1.player.y) < m.R * 1.2);
        const mech2 = engine.nearbyCache.find(m => Math.hypot(m.x - s2.player.x, m.y - s2.player.y) < m.R * 1.2);
        const isPulledByDifferentMechs = mech1 && mech2 && mech1 !== mech2;

        // Tether breaks ONLY when true max distance (3960px) is exceeded or pulled by different mechs
        const isTetherBroken = dist > TETHER_MAX_DIST || isPulledByDifferentMechs;

        if (!isTetherBroken && dist < TETHER_MAX_DIST) {
          engine.coopTandem = true;

          // Continuous smooth attraction force from docking distance (70px) to max tether (3960px)
          const targetDist = 70;
          if (dist > targetDist) {
            // Sinusoidal dome pull starting smoothly at 0 force at dist = 70px (zero force discontinuity!)
            const pullNorm = Math.sin(Math.PI * Math.min(1, (dist - targetDist) / (TETHER_MAX_DIST - targetDist)));
            const pullForce = pullNorm * 1.5 * TETHER_SPRING_K * breakoutEase;
            s1.player.vx += ux * pullForce * dt;
            s1.player.vy += uy * pullForce * dt;
            s2.player.vx -= ux * pullForce * dt;
            s2.player.vy -= uy * pullForce * dt;

            // Critical Damping on relative velocity along tether axis (eliminates snapping/recoil)
            const relVx = s1.player.vx - s2.player.vx;
            const relVy = s1.player.vy - s2.player.vy;
            const relDot = relVx * ux + relVy * uy;
            if (relDot > 0) { // Moving away from each other
              const dampF = relDot * 0.35 * breakoutEase * dt;
              s1.player.vx -= ux * dampF;
              s1.player.vy -= uy * dampF;
              s2.player.vx += ux * dampF;
              s2.player.vy += uy * dampF;
            }
          } else {
            // Docking equilibrium cushion (dist < 70px): soft spring pushes outwards without dampening engine thrust
            const springErr = dist - targetDist; // negative value
            const cushionForce = springErr * 0.8;
            s1.player.vx += ux * cushionForce * dt;
            s1.player.vy += uy * cushionForce * dt;
            s2.player.vx -= ux * cushionForce * dt;
            s2.player.vy -= uy * cushionForce * dt;
          }

          // No-overlap collision barrier (MIN_DIST = 55px)
          const MIN_DIST = 55;
          if (dist < MIN_DIST) {
            const overlap = MIN_DIST - dist;
            s1.player.x -= ux * (overlap * 0.5);
            s1.player.y -= uy * (overlap * 0.5);
            s2.player.x += ux * (overlap * 0.5);
            s2.player.y += uy * (overlap * 0.5);
          }

          // Fluid Organic Jellyfish Dynamics (active on 3960px distance threshold!)
          if (dist < TETHER_MAX_DIST) {
            engine.coopBeam = true;
            const cx = (s1.player.x + s2.player.x) / 2;
            const cy = (s1.player.y + s2.player.y) / 2;

            if (!(engine as any)._compositePhase) (engine as any)._compositePhase = 0;
            if (!(engine as any)._breathPhase) (engine as any)._breathPhase = 0;

            // Dynamic breathing rhythm ("замедляясь и ускоряясь")
            const breathRate = 1.8 + 1.2 * Math.cos(t * 0.35);
            (engine as any)._breathPhase += breathRate * dt;
            (engine as any)._currentBreathRate = breathRate;
            const bPhase = (engine as any)._breathPhase;

            // Slow floating drift angle
            (engine as any)._compositePhase += 0.28 * dt;
            const cPhase = (engine as any)._compositePhase;

            // Unit vectors along player-player axis and perpendicular
            const axisX = dist > 0.001 ? ux : 1;
            const axisY = dist > 0.001 ? uy : 0;
            const perpX = -axisY;
            const perpY = axisX;

            // Continuous Hydro-Propulsion Swimming Drift ("Всё время плыть")
            const strokePulse = Math.max(0, Math.sin(bPhase));
            const swimForce = 16 + strokePulse * 26;
            const swimFx = Math.cos(cPhase) * swimForce * dt;
            const swimFy = Math.sin(cPhase) * swimForce * dt;
            s1.player.vx += swimFx;
            s1.player.vy += swimFy;
            s2.player.vx += swimFx;
            s2.player.vy += swimFy;

            const avgVx = (s1.player.vx + s2.player.vx) / 2;
            const avgVy = (s1.player.vy + s2.player.vy) / 2;
            const moveSpeed = Math.hypot(avgVx, avgVy);
            const moveAngle = moveSpeed > 0.1 ? Math.atan2(avgVy, avgVx) : 0;

            // Wave undulation modulated by stroke pulse
            const waveJelly = Math.sin(bPhase) * 14 + Math.cos(t * 1.2) * 6;
            const stretchX = Math.cos(moveAngle) * Math.min(moveSpeed * 0.12, 32);
            const stretchY = Math.sin(moveAngle) * Math.min(moveSpeed * 0.12, 32);

            // Re-align orbs into Oval Stadium Envelope (encircling both cores as drawn on screenshot!)
            for (let k = 0; k < 4; k++) {
              const o1 = s1.player.orbs[k];
              const o2 = s2.player.orbs[k];
              if (o1 && o2) {
                // Occasional random fluid current drift ("если не занесло течением")
                const currentDrift = (Math.sin(t * 0.42 + k * 2.1) > 0.88) ? -35 : 0;

                const baseAngle1 = cPhase + k * (Math.PI / 2);
                const baseAngle2 = baseAngle1 + Math.PI;

                // Oval semi-axes: semiA along player axis, semiB perpendicular to player axis
                // Encircles both cores in a smooth stadium oval ring (matching user screenshot!)
                const semiA1 = (dist * 0.5) + 65 + k * 22 + Math.sin(baseAngle1) * 12;
                const semiB1 = 75 + k * 20 + Math.cos(baseAngle1) * 10 + waveJelly * 0.5 + currentDrift;

                const semiA2 = (dist * 0.5) + 65 + k * 22 + Math.sin(baseAngle2) * 12;
                const semiB2 = 75 + k * 20 + Math.cos(baseAngle2) * 10 + waveJelly * 0.5 + currentDrift;

                // External energy perturbation (warp trajectory when near external mechs/collectible nodes)
                let pertX1 = 0, pertY1 = 0, pertX2 = 0, pertY2 = 0;
                const extMech = engine.nearbyCache.find(m => Math.hypot(m.x - cx, m.y - cy) < 240);
                if (extMech) {
                  const mAng = Math.atan2(extMech.y - cy, extMech.x - cx);
                  const mForce = Math.min((240 - Math.hypot(extMech.x - cx, extMech.y - cy)) * 0.25, 45);
                  pertX1 = Math.cos(mAng) * mForce;
                  pertY1 = Math.sin(mAng) * mForce;
                  pertX2 = pertX1;
                  pertY2 = pertY1;
                }

                // Position on oval envelope encircling both player cores
                const ovalX1 = cx + (Math.cos(baseAngle1) * semiA1) * axisX + (Math.sin(baseAngle1) * semiB1) * perpX;
                const ovalY1 = cy + (Math.cos(baseAngle1) * semiA1) * axisY + (Math.sin(baseAngle1) * semiB1) * perpY;

                const ovalX2 = cx + (Math.cos(baseAngle2) * semiA2) * axisX + (Math.sin(baseAngle2) * semiB2) * perpX;
                const ovalY2 = cy + (Math.cos(baseAngle2) * semiA2) * axisY + (Math.sin(baseAngle2) * semiB2) * perpY;

                let coopTx1 = (ovalX1 + pertX1 - stretchX) - s1.player.x;
                let coopTy1 = (ovalY1 + pertY1 - stretchY) - s1.player.y;
                let coopTx2 = (ovalX2 + pertX2 - stretchX) - s2.player.x;
                let coopTy2 = (ovalY2 + pertY2 - stretchY) - s2.player.y;

                // Repulsion from inner core cluster gap
                const absOrb1X = s1.player.x + coopTx1;
                const absOrb1Y = s1.player.y + coopTy1;
                if (Math.hypot(absOrb1X - cx, absOrb1Y - cy) < semiB1 * 0.75 && currentDrift === 0) {
                  const pAng = Math.atan2(absOrb1Y - cy, absOrb1X - cx);
                  coopTx1 = (cx + Math.cos(pAng) * semiB1) - s1.player.x;
                  coopTy1 = (cy + Math.sin(pAng) * semiB1) - s1.player.y;
                }

                const absOrb2X = s2.player.x + coopTx2;
                const absOrb2Y = s2.player.y + coopTy2;
                if (Math.hypot(absOrb2X - cx, absOrb2Y - cy) < semiB2 * 0.75 && currentDrift === 0) {
                  const pAng = Math.atan2(absOrb2Y - cy, absOrb2X - cx);
                  coopTx2 = (cx + Math.cos(pAng) * semiB2) - s2.player.x;
                  coopTy2 = (cy + Math.sin(pAng) * semiB2) - s2.player.y;
                }

                // Smooth coopBlend ramp (0.0 solo -> 1.0 full composite over ~3-4s)
                const cBlend1 = (s1 as any).coopBlend || 0;
                const cBlend2 = (s2 as any).coopBlend || 0;
                const newBlend1 = cBlend1 + (1.0 - cBlend1) * (1 - Math.exp(-0.45 * dt));
                const newBlend2 = cBlend2 + (1.0 - cBlend2) * (1 - Math.exp(-0.45 * dt));
                (s1 as any).coopBlend = newBlend1;
                (s2 as any).coopBlend = newBlend2;

                // Target single-player orb offsets (default solo orbit)
                const soloAngle1 = ((s1.player as any)._rot || 0) + k * (Math.PI / 2);
                const soloAngle2 = ((s2.player as any)._rot || 0) + k * (Math.PI / 2);
                const soloR = 36 + k * 14;
                const soloTx1 = (o1 as any).soloOx !== undefined ? (o1 as any).soloOx : Math.cos(soloAngle1) * soloR;
                const soloTy1 = (o1 as any).soloOy !== undefined ? (o1 as any).soloOy : Math.sin(soloAngle1) * soloR;
                const soloTx2 = (o2 as any).soloOx !== undefined ? (o2 as any).soloOx : Math.cos(soloAngle2) * soloR;
                const soloTy2 = (o2 as any).soloOy !== undefined ? (o2 as any).soloOy : Math.sin(soloAngle2) * soloR;

                // Seamless lerp between solo and composite orbits (energies glide onto oval stadium tracks!)
                const targetTx1 = (1 - newBlend1) * soloTx1 + newBlend1 * coopTx1;
                const targetTy1 = (1 - newBlend1) * soloTy1 + newBlend1 * coopTy1;
                const targetTx2 = (1 - newBlend2) * soloTx2 + newBlend2 * coopTx2;
                const targetTy2 = (1 - newBlend2) * soloTy2 + newBlend2 * coopTy2;

                const blend = 1 - Math.exp(-4.2 * dt);
                o1.ox += (targetTx1 - o1.ox) * blend;
                o1.oy += (targetTy1 - o1.oy) * blend;
                o2.ox += (targetTx2 - o2.ox) * blend;
                o2.oy += (targetTy2 - o2.oy) * blend;
              }
            }

            // Energy sharing
            for (let k = 0; k < 4; k++) {
              if (s1.tanks[k] > s2.tanks[k] && s2.tanks[k] < MAXTANK) {
                const delta = Math.min(s1.tanks[k] - s2.tanks[k], 1.8 * dt);
                s2.tanks[k] += delta;
              } else if (s2.tanks[k] > s1.tanks[k] && s1.tanks[k] < MAXTANK) {
                const delta = Math.min(s2.tanks[k] - s1.tanks[k], 1.8 * dt);
                s1.tanks[k] += delta;
              }
            }
          }
        } else {
          (s1 as any).coopBlend = ((s1 as any).coopBlend || 0) * Math.exp(-2.5 * dt);
          (s2 as any).coopBlend = ((s2 as any).coopBlend || 0) * Math.exp(-2.5 * dt);
        }
      }
    }
  }

  if (!engine.coopTandem) {
    for (const slot of activeSlots) {
      (slot as any).coopBlend = ((slot as any).coopBlend || 0) * Math.exp(-2.5 * dt);
    }
  }

  // Orb-to-Orb Collision Exclusion (Prevent energy figures from overlapping each other!)
  const allActiveOrbs: Array<{ orb: any, p: any }> = [];
  for (const s of activeSlots) {
    if (s && s.player && s.player.orbs) {
      for (let k = 0; k < 4; k++) {
        if (s.player.orbs[k]) {
          allActiveOrbs.push({ orb: s.player.orbs[k], p: s.player });
        }
      }
    }
  }

  for (let i = 0; i < allActiveOrbs.length; i++) {
    for (let j = i + 1; j < allActiveOrbs.length; j++) {
      const a = allActiveOrbs[i];
      const b = allActiveOrbs[j];
      const ax = a.p.x + a.orb.ox;
      const ay = a.p.y + a.orb.oy;
      const bx = b.p.x + b.orb.ox;
      const by = b.p.y + b.orb.oy;

      const dx = bx - ax;
      const dy = by - ay;
      const distOrbs = Math.hypot(dx, dy);
      const MIN_ORB_SPACING = 38;

      if (distOrbs < MIN_ORB_SPACING && distOrbs > 0.001) {
        const overlap = (MIN_ORB_SPACING - distOrbs) * 0.5;
        const nx = (dx / distOrbs) * overlap;
        const ny = (dy / distOrbs) * overlap;

        a.orb.ox -= nx;
        a.orb.oy -= ny;
        b.orb.ox += nx;
        b.orb.oy += ny;
      }
    }
  }
  }

  // Update Dynamic Soundscape for all active slots
  if (engine.audio) {
    engine.audio.updatePlayerAudio(activeSlots, dt, t);
  }

  // 3. Nearby Cache for Camera Anchor
  const leaderPlayer = activeSlots[0].player;
  engine.nearbyCache = [];
  const pcx = Math.floor(leaderPlayer.x / 900), pcy = Math.floor(leaderPlayer.y / 900);
  for (let cy = pcy - 2; cy <= pcy + 2; cy++)
    for (let cx = pcx - 2; cx <= pcx + 2; cx++)
      for (const o of engine.world.getChunk(cx, cy, leaderPlayer.x, leaderPlayer.y).mechs) 
        engine.nearbyCache.push(o);

  // Shockwave propagation
  if (engine.comboFlash > 0) engine.comboFlash -= dt;
  for (let i = engine.shockwaves.length - 1; i >= 0; i--) {
    const wave = engine.shockwaves[i];
    wave.r += wave.speed * dt;
    wave.life -= dt;
    if (wave.r >= wave.maxR || wave.life <= 0) {
      engine.shockwaves.splice(i, 1);
    }
  }

  // Audible mechs
  const audible = engine.nearbyCache.filter(o => o._hear > 0.04)
                             .sort((a, b) => b._hear - a._hear)
                             .slice(0, 3);
  for (const o of audible)
    for (const ring of o.rings) engine.scheduleRing(o, ring, T);

  // Mech particles & multi-slot magnet/pickup
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
      // Smooth damped vector integration towards target force field
      p.vx += (fx2 * 0.75 - p.vx) * kf;
      p.vy += (fy2 * 0.75 - p.vy) * kf;
      p.vx *= Math.exp(-1.5 * dt);
      p.vy *= Math.exp(-1.5 * dt);

      // Find closest active player slot
      let closestSlot = activeSlots[0];
      let minD = Math.hypot(closestSlot.player.x - p.x, closestSlot.player.y - p.y);
      for (let si = 1; si < activeSlots.length; si++) {
        const dCandidate = Math.hypot(activeSlots[si].player.x - p.x, activeSlots[si].player.y - p.y);
        if (dCandidate < minD) {
          minD = dCandidate;
          closestSlot = activeSlots[si];
        }
      }

      // Local player magnet pull range (bounded to local pickup radius so co-op tethering does not inflate magnet to 2000px!)
      const LOCAL_MAX_ORB_R = 75;
      const dx = closestSlot.player.x - p.x;
      const dy = closestSlot.player.y - p.y;
      const d = Math.hypot(dx, dy);
      const magnetMult = (closestSlot.magnetTimer && closestSlot.magnetTimer > 0) ? MAGNET_RHYTHM_MULT : 1.0;
      const magnetRange = LOCAL_MAX_ORB_R * 2.4 * magnetMult;

      if (d < magnetRange && d > 1) {
        // Smooth cubic ease curve in micro-radius (<45px) to eliminate central 180-degree vector flip slingshots
        const microEase = d < 45 ? Math.pow(d / 45, 2.2) : 1.0;
        const pullStrength = (1 - d / magnetRange) * 850 * magnetMult * microEase;
        p.vx += (dx / d) * pullStrength * dt;
        p.vy += (dy / d) * pullStrength * dt;
      }

      // Micro-zone speed limit near origin (d < 40px) to prevent centrifuge angular acceleration
      const pSpeed = Math.hypot(p.vx, p.vy);
      let speedCap = 580;
      if (d < 40) {
        speedCap = 40 + d * 1.5;
      }
      if (pSpeed > speedCap) {
        p.vx *= speedCap / pSpeed;
        p.vy *= speedCap / pSpeed;
      }

      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) { Object.assign(p, spawnPart(o)); continue; }

      const pickupRadius = (LOCAL_MAX_ORB_R + 22) * (magnetMult > 1.0 ? 1.5 : 1.0);
      if (d < pickupRadius) {
        closestSlot.tanks[o.energy] = Math.min(MAXTANK, closestSlot.tanks[o.energy] + 1);
        closestSlot.collectFlash[o.energy] = 1;
        if (engine.started) engine.audio.chirp(o.energy, closestSlot.tanks[o.energy] / MAXTANK);
        Object.assign(p, spawnPart(o));
      }
    }
  }

  engine.fx.strobe *= Math.exp(-9 * dt);
  if (engine.fx.strobe < 0.01) engine.fx.strobe = 0;

  engine.fx.distort *= Math.exp(-4.5 * dt);
  if (engine.fx.distort < 0.01) engine.fx.distort = 0;
  for (const s of engine.fx.shocks) { s.r += s.v * dt; s.v *= Math.exp(-2 * dt); s.life -= dt * 1.4; }
  engine.fx.shocks = engine.fx.shocks.filter(s => s.life > 0);

  if (engine.audio.ac) {
    const leaderSlot = activeSlots[0];
    const sp = Math.hypot(leaderSlot.player.vx, leaderSlot.player.vy) / MAX_SPEED;
    const leaderFuelTotal = leaderSlot.tanks[0] + leaderSlot.tanks[1] + leaderSlot.tanks[2] + leaderSlot.tanks[3];
    const leaderProg = clamp01((SPAWN.y - leaderSlot.player.y) / (SPAWN.y - SUMMIT_Y));
    const starving = leaderFuelTotal <= 0.1;
    if (engine.audio.windGain)
      engine.audio.windGain.gain.setTargetAtTime(sp * 0.03 + leaderProg * 0.022, engine.audio.ac.currentTime, 0.25);
    if (engine.audio.thrust) {
      const on = Math.hypot(leaderSlot.remoteStick?.x || 0, leaderSlot.remoteStick?.y || 0) > 0.05 || (leaderSlot.num === 1 && (kbX !== 0 || kbY !== 0));
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
