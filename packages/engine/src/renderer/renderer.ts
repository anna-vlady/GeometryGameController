import { Mech, Voice } from '../world/types';
import { Player, FxState } from '../physics/types';
import { mixColor, smoothstep, clamp01 } from '../core/utils';
import { ENERGY_COLOR, CREAM, RED, INK, PAPER, PAPER_LIGHT, PAPER_DARK } from '../world/constants';
import { SPAWN, SUMMIT_Y } from '../physics/constants';
import { shadowAnd, drawGlyph, drawBead, prounShape, drawDecor, drawFar } from './shapes';

const FAR_FACTOR = 0.35;
const FAR_CHUNK = 1500;
const CHUNK = 900;
const TAU = Math.PI * 2;

export class Renderer {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  DPR: number;
  grainPattern: CanvasPattern | null = null;
  post: HTMLCanvasElement;

  constructor(public canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.DPR = window.devicePixelRatio || 1;
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    canvas.width = this.W * this.DPR;
    canvas.height = this.H * this.DPR;
    
    this.post = document.createElement('canvas');
    this.post.width = this.W * this.DPR;
    this.post.height = this.H * this.DPR;
  }

  resize(w: number, h: number) {
    this.W = w;
    this.H = h;
    this.canvas.width = w * this.DPR;
    this.canvas.height = h * this.DPR;
    this.post.width = w * this.DPR;
    this.post.height = h * this.DPR;
  }

  setGrain(pattern: CanvasPattern) {
    this.grainPattern = pattern;
  }

  drawProunEl(o: Mech, el: any, t: number, px: number, py: number) {
    const ctx = this.ctx;
    const c = ENERGY_COLOR[o.energy || 0];
    const col = el.col === 0 ? c : INK;
    const ax = Math.cos(o.axis || 0), ay = Math.sin(o.axis || 0);
    const nx = -ay, ny = ax;
    
    let ox = el.bx, oy = el.by, rot = el.rot, sc = 1;
    const m = Math.sin(t * el.mfreq * TAU + el.mphase);
    if (el.motion === 'slide') { ox += ax * m * el.amp; oy += ay * m * el.amp; rot += m * 0.03; }
    else if (el.motion === 'bob') { ox += nx * m * el.amp; oy += ny * m * el.amp; sc = 1 + el.headPulse * 0.18; }
    else if (el.motion === 'seesaw') { rot += m * el.amp; }
    else if (el.motion === 'drift') {
      const m2 = Math.sin(t * el.mfreq * 0.7 * TAU + el.mphase * 1.7);
      ox += (ax * m + nx * m2 * 0.7) * el.amp;
      oy += (ay * m + ny * m2 * 0.7) * el.amp;
    } else if (el.motion === 'spin') { rot += t * el.mfreq * (el.dir || 1); }
    sc *= 1 + el.headPulse * 0.12;

    const ddx = px - ox, ddy = py - oy, dd = Math.hypot(ddx, ddy);
    if (dd < 220 && dd > 1) { const k = (1 - dd / 220) * 10; ox += ddx / dd * k; oy += ddy / dd * k; }

    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(rot);
    ctx.scale(sc, sc);

    ctx.save();
    ctx.translate((5 + el.depth * 11) * 0.6, 5 + el.depth * 11);
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = INK; ctx.strokeStyle = INK;
    prounShape(ctx, el, true);
    ctx.restore();

    ctx.globalAlpha = 1;
    ctx.fillStyle = col; ctx.strokeStyle = col;
    prounShape(ctx, el, el.kind !== 'needle');

    if (el.kind === 'plane') {
      ctx.globalAlpha = 0.5; ctx.strokeStyle = INK; ctx.lineWidth = 1.3;
      ctx.strokeRect(-el.len / 2 - 6, -el.wid / 2 + 6, el.len, el.wid);
      ctx.globalAlpha = 1;
    }

    if (el.headPulse > 0.03) {
      ctx.globalAlpha = el.headPulse * 0.7; ctx.strokeStyle = c; ctx.lineWidth = 2;
      const rr = Math.max(el.len, el.wid) * 0.6 + (1 - el.headPulse) * 12;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  drawMechCore(o: Mech) {
    const ctx = this.ctx;
    const c = ENERGY_COLOR[o.energy || 0];
    ctx.save();
    ctx.rotate(o.coreRot);
    const sc = 1 + o.corePulse * 0.1;
    ctx.scale(sc, sc);
    ctx.fillStyle = c; ctx.strokeStyle = c;
    const cs = o.coreSize;
    switch (o.energy) {
      case 0:
        shadowAnd(ctx, () => ctx.fillRect(-cs / 2, -cs * 0.4, cs, cs * 0.8));
        ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
        ctx.strokeRect(-cs / 2 - 7, -cs * 0.4 + 7, cs, cs * 0.8);
        break;
      case 1:
        shadowAnd(ctx, () => {
          ctx.lineWidth = cs * 0.22;
          ctx.beginPath(); ctx.arc(0, 0, cs * 0.72, 0, TAU); ctx.stroke();
        });
        ctx.beginPath(); ctx.arc(0, 0, cs * 0.16, 0, TAU); ctx.fill();
        break;
      case 2:
        shadowAnd(ctx, () => {
          ctx.beginPath();
          ctx.moveTo(0, -cs * 0.7);
          ctx.lineTo(cs * 0.62, cs * 0.46);
          ctx.lineTo(-cs * 0.62, cs * 0.46);
          ctx.closePath(); ctx.fill();
        });
        break;
      case 3:
        shadowAnd(ctx, () => ctx.fillRect(-cs * 1.5, -cs * 0.14, cs * 3, cs * 0.28));
        ctx.globalAlpha *= 0.5;
        ctx.fillRect(-cs, cs * 0.14 + 8, cs * 2, 2.5);
        ctx.globalAlpha *= 2;
        break;
    }
    ctx.restore();
  }

  drawOrbitalBody(o: Mech, T: number, t: number, player: Player) {
    const ctx = this.ctx;
    const c = ENERGY_COLOR[o.energy || 0];
    const px = player.x - o.x, py = player.y - o.y;
    
    for (const ring of o.rings) {
      const breath = ring.persona === 0 ? 1 : 1 + (1 - (ring.tempoMul || 1)) * 0.10;
      const rr = (ring.r || 0) * breath;
      const ecc = ring.ecc || 1, ct = Math.cos(ring.tilt || 0), st = Math.sin(ring.tilt || 0);
      const pt = (ang: number, rad: number) => {
        const ex = Math.cos(ang) * rad, ey = Math.sin(ang) * rad * ecc;
        return [ex * ct - ey * st, ex * st + ey * ct];
      };

      ctx.strokeStyle = INK;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let a = 0; a <= 72; a++) {
        const ang = a / 72 * TAU;
        const rad = ring.wavy ? rr + Math.sin(ang * 7 + t * 1.5 * ring.dir!) * 5 : rr;
        const [wx, wy] = pt(ang, rad);
        if (a === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Beads
      for (let i = 0; i < ring.talea.length; i++) {
        const a = (ring.phase0 || 0) + ring.dir! * (ring.cum[i] / ring.total) * TAU;
        let [bx, by] = pt(a, rr);
        const ddx = px - bx, ddy = py - by, dd = Math.hypot(ddx, ddy);
        if (dd < 240 && dd > 1) { const m = (1 - dd / 240) * 12; bx += ddx / dd * m; by += ddy / dd * m; }
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(a + (ring.tilt || 0) + Math.PI / 2);
        ctx.globalAlpha = i === 0 ? 0.95 : 0.7;
        drawBead(ctx, ring.talea[i], i === 0 ? c : INK);
        if (ring.flash[i] > 0.03) {
          ctx.strokeStyle = c;
          ctx.globalAlpha = ring.flash[i] * 0.8;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 8 + (1 - ring.flash[i]) * 14, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // Head
      // TODO: need ringPos equivalent logic here
      const p = ((T - ring.refT) / ring.pulse) % ring.total; // Approximated ringPos
      const ha = (ring.phase0 || 0) + ring.dir! * (p / ring.total) * TAU;
      let [hx, hy] = pt(ha, rr);
      const hdx = px - hx, hdy = py - hy, hd = Math.hypot(hdx, hdy);
      if (hd < 240 && hd > 1) { const m = (1 - hd / 240) * 12; hx += hdx / hd * m; hy += hdy / hd * m; }
      const [tx, ty] = pt(ha - ring.dir! * 0.42, rr);
      ctx.strokeStyle = c; ctx.globalAlpha = 0.3; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(ha + (ring.tilt || 0));
      ctx.fillStyle = c; ctx.strokeStyle = c;
      drawGlyph(ctx, o.energy || 0, 6 + ring.headPulse * 3.5);
      ctx.restore();
    }
    this.drawMechCore(o);
  }

  drawProunBody(o: Mech, T: number, t: number, player: Player) {
    const ctx = this.ctx;
    const px = player.x - o.x, py = player.y - o.y;
    ctx.strokeStyle = INK; ctx.globalAlpha = 0.07; ctx.lineWidth = 1;
    const ax = Math.cos(o.axis || 0), ay = Math.sin(o.axis || 0), L = o.outerR * 0.95;
    ctx.beginPath(); ctx.moveTo(-ax * L, -ay * L); ctx.lineTo(ax * L, ay * L); ctx.stroke();
    ctx.globalAlpha = 1;

    for (const fr of o.frames || []) {
      ctx.save(); ctx.translate(fr.bx, fr.by); ctx.rotate(fr.rot);
      ctx.strokeStyle = INK; ctx.globalAlpha = 0.13; ctx.lineWidth = 1.4;
      ctx.strokeRect(-fr.w / 2, -fr.h / 2, fr.w, fr.h);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    const els = o.rings.slice().sort((a: any, b: any) => a.depth - b.depth);
    for (const el of els) this.drawProunEl(o, el, t, px, py);

    const pv = 3.5 + o.corePulse * 3;
    ctx.beginPath(); ctx.arc(0, 0, pv, 0, TAU);
    ctx.fillStyle = CREAM; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke();
  }

  drawMech(o: Mech, T: number, t: number, player: Player, dominant: Mech | null) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(o.x, o.y);
    const c = ENERGY_COLOR[o.energy || 0];

    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    ctx.globalAlpha = 0.05;
    ctx.setLineDash([2, 7]);
    ctx.beginPath(); ctx.arc(0, 0, o.R, 0, TAU); ctx.stroke();
    ctx.globalAlpha = dominant === o ? 0.22 : 0.09;
    ctx.strokeStyle = c;
    ctx.beginPath(); ctx.arc(0, 0, o.orbitR, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    if (o.archetype === 'proun') this.drawProunBody(o, T, t, player);
    else this.drawOrbitalBody(o, T, t, player);

    if (o.act > 0.02) {
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.globalAlpha = o.act * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, o.outerR * (1.04 + 0.05 * Math.sin(t * 6)), 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  draw(t: number, T: number, player: Player, fx: FxState, chunks: Map<string, any>, farChunks: Map<string, any>, dominant: Mech | null, tanks: number[], collectFlash: number[], worldSeed: number) {
    const { ctx, W, H, DPR } = this;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = 1;

    const altN = Math.max(-1, Math.min(1, player.y / 7000));
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, mixColor(PAPER_LIGHT, PAPER_DARK, clamp01(0.5 + altN * 0.5 - 0.18)));
    bg.addColorStop(1, mixColor(PAPER_LIGHT, PAPER_DARK, clamp01(0.5 + altN * 0.5 + 0.18)));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    
    if (this.grainPattern) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = this.grainPattern;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // Far architecture
    ctx.save();
    ctx.translate(W / 2 - player.x * FAR_FACTOR, H / 2 - player.y * FAR_FACTOR);
    ctx.strokeStyle = 'rgba(30,27,22,0.07)';
    const fx0 = Math.floor((player.x * FAR_FACTOR - W / 2) / FAR_CHUNK) - 1;
    const fx1 = Math.floor((player.x * FAR_FACTOR + W / 2) / FAR_CHUNK) + 1;
    const fy0 = Math.floor((player.y * FAR_FACTOR - H / 2) / FAR_CHUNK) - 1;
    const fy1 = Math.floor((player.y * FAR_FACTOR + H / 2) / FAR_CHUNK) + 1;
    for (let cy = fy0; cy <= fy1; cy++) {
      for (let cx = fx0; cx <= fx1; cx++) {
        const arr = farChunks.get(cx + ',' + cy) || [];
        for (const f of arr) {
          ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
          drawFar(ctx, f.kind, f.size);
          ctx.restore();
        }
      }
    }
    ctx.restore();

    // World
    ctx.save();
    if (fx.distort > 0.02)
      ctx.translate((Math.random() - 0.5) * 7 * fx.distort, (Math.random() - 0.5) * 7 * fx.distort);
    ctx.translate(W / 2 - player.x, H / 2 - player.y);

    const x0 = Math.floor((player.x - W / 2 - 500) / CHUNK);
    const x1 = Math.floor((player.x + W / 2 + 500) / CHUNK);
    const y0 = Math.floor((player.y - H / 2 - 500) / CHUNK);
    const y1 = Math.floor((player.y + H / 2 + 500) / CHUNK);
    
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++) {
        const ch = chunks.get(cx + ',' + cy);
        if (ch) for (const d of ch.decor) drawDecor(ctx, d);
      }
      
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++) {
        const ch = chunks.get(cx + ',' + cy);
        if (ch) for (const o of ch.mechs) this.drawMech(o, T, t, player, dominant);
      }

    // Particles
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++) {
        const ch = chunks.get(cx + ',' + cy);
        if (!ch) continue;
        for (const o of ch.mechs) {
          const col = ENERGY_COLOR[o.energy || 0];
          ctx.fillStyle = col; ctx.strokeStyle = col;
          const activeN = Math.round(o.parts.length * 0.5);
          for (let pi = 0; pi < activeN; pi++) {
            const p = o.parts[pi];
            const fade = Math.min(1, p.life * 1.5);
            ctx.globalAlpha = 0.75 * fade;
            ctx.beginPath(); ctx.arc(p.x, p.y, 2.4, 0, TAU); ctx.fill();
            ctx.globalAlpha = 0.28 * fade;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 0.08, p.y - p.vy * 0.08);
            ctx.stroke();
          }
        }
      }
    ctx.globalAlpha = 1;

    // Shocks
    for (const s of fx.shocks) {
      ctx.strokeStyle = INK;
      ctx.globalAlpha = s.life * 0.45;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = CREAM;
      ctx.globalAlpha = s.life * 0.3;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(s.x, s.y, Math.max(1, s.r - 7), 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Orbs targets
    for (const orb of player.orbs) {
      if (!orb.target || orb.score < 0.03) continue;
      ctx.strokeStyle = ENERGY_COLOR[orb.energy];
      ctx.globalAlpha = orb.score * 0.75;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([7, 7]);
      ctx.lineDashOffset = -t * 60;
      ctx.beginPath();
      ctx.moveTo(player.x + orb.ox, player.y + orb.oy);
      ctx.lineTo(orb.target.x, orb.target.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // Trails
    for (const orb of player.orbs) {
      const n = orb.trail.length;
      ctx.strokeStyle = ENERGY_COLOR[orb.energy];
      for (let j = 1; j < n; j++) {
        ctx.globalAlpha = (j / n) * 0.35;
        ctx.lineWidth = (j / n) * 3;
        ctx.beginPath();
        ctx.moveTo(orb.trail[j - 1].x, orb.trail[j - 1].y);
        ctx.lineTo(orb.trail[j].x, orb.trail[j].y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Player core
    ctx.beginPath();
    ctx.arc(player.x, player.y, 7, 0, TAU);
    ctx.fillStyle = CREAM; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();

    for (let i = 0; i < 4; i++) {
      if (collectFlash[i] < 0.04) continue;
      ctx.strokeStyle = ENERGY_COLOR[i];
      ctx.globalAlpha = collectFlash[i] * 0.6;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 14 + (1 - collectFlash[i]) * 34, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Four energies
    for (let i = 0; i < 4; i++) {
      const orb = player.orbs[i];
      const x = player.x + orb.ox, y = player.y + orb.oy;
      const s = (9 + tanks[i] * 0.5) * (1 + orb.score * 0.4);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(orb.phase * 1.4 + i);
      ctx.fillStyle = ENERGY_COLOR[i];
      ctx.strokeStyle = ENERGY_COLOR[i];
      drawGlyph(ctx, i, s);
      if (orb.score > 0.05) {
        ctx.globalAlpha = orb.score * 0.35;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, s * 2.1, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (orb.flashR > 0.04) {
        ctx.globalAlpha = orb.flashR * 0.5;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, s * (1.4 + (1 - orb.flashR) * 1.6), 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    ctx.restore(); // Restore World transform

    // Vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(30,27,22,0)');
    vg.addColorStop(1, 'rgba(30,27,22,0.10)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Minimap
    this.drawMinimap(player, chunks, dominant);

    // Post-effects
    if (fx.distort > 0.025) {
      const pc = this.post.getContext('2d')!;
      pc.clearRect(0, 0, this.post.width, this.post.height);
      pc.drawImage(this.canvas, 0, 0);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = Math.min(0.3, fx.distort * 0.28);
      ctx.drawImage(this.post, 7 * fx.distort * DPR, 0);
      ctx.drawImage(this.post, -7 * fx.distort * DPR, 0);
      ctx.globalAlpha = 1;
      const bands = 22, bh = Math.ceil(this.post.height / bands);
      const ph = performance.now() * 0.045;
      for (let i = 0; i < bands; i++) {
        const off = Math.sin(i * 1.7 + ph) * 15 * fx.distort * DPR;
        ctx.drawImage(this.post, 0, i * bh, this.post.width, bh, off, i * bh, this.post.width, bh);
      }
      ctx.restore();
    }

    if (fx.strobe > 0.03) {
      ctx.fillStyle = (Math.floor(t * 60) % 2 === 0) ? CREAM : INK;
      ctx.globalAlpha = fx.strobe * 0.8;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  drawMinimap(player: Player, chunks: Map<string, any>, dominant: Mech | null) {
    const { ctx, W } = this;
    const size = 156, pad = 16;
    const x0 = W - pad - size, y0 = 16;
    const cx = x0 + size / 2, cy = y0 + size / 2;
    const RANGE = 2600;
    const sc = (size / 2 - 8) / RANGE;

    ctx.save();
    ctx.fillStyle = 'rgba(242,235,217,0.82)';
    ctx.strokeStyle = 'rgba(30,27,22,0.3)';
    ctx.lineWidth = 1;
    ctx.fillRect(x0, y0, size, size);
    ctx.strokeRect(x0, y0, size, size);
    ctx.fillStyle = 'rgba(30,27,22,0.5)';
    ctx.font = '700 9px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('КАРТА', x0 + 9, y0 + 13);

    ctx.beginPath(); ctx.rect(x0 + 1, y0 + 1, size - 2, size - 2); ctx.clip();

    const pcx = Math.floor(player.x / CHUNK), pcy = Math.floor(player.y / CHUNK);
    for (let gy = pcy - 3; gy <= pcy + 3; gy++) {
      for (let gx = pcx - 3; gx <= pcx + 3; gx++) {
        const ch = chunks.get(gx + ',' + gy);
        if (!ch) continue;
        for (const o of ch.mechs) {
          const rx = (o.x - player.x) * sc, ry = (o.y - player.y) * sc;
          if (Math.abs(rx) > size / 2 || Math.abs(ry) > size / 2) continue;
          const mxp = cx + rx, myp = cy + ry;
          const rad = Math.max(1.3, Math.min(13, o.outerR * sc));
          ctx.globalAlpha = o === dominant ? 0.95 : 0.65;
          ctx.fillStyle = ENERGY_COLOR[o.energy || 0];
          ctx.beginPath(); ctx.arc(mxp, myp, rad, 0, TAU); ctx.fill();
          if (o === dominant) {
            ctx.globalAlpha = 0.5; ctx.strokeStyle = ENERGY_COLOR[o.energy || 0]; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(mxp, myp, rad + 3, 0, TAU); ctx.stroke();
          }
        }
      }
    }
    ctx.globalAlpha = 1;

    const sumRel = (SUMMIT_Y - player.y) * sc;
    ctx.fillStyle = RED;
    if (sumRel < -(size / 2 - 4)) {
      ctx.beginPath();
      ctx.moveTo(cx, y0 + 5); ctx.lineTo(cx - 5, y0 + 13); ctx.lineTo(cx + 5, y0 + 13);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillRect(cx - 4, cy + sumRel - 4, 8, 8);
    }

    const sp = Math.hypot(player.vx, player.vy);
    if (sp > 5) {
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + player.vx / sp * 10, cy + player.vy / sp * 10); ctx.stroke();
    }
    ctx.fillStyle = CREAM; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, 3.6, 0, TAU); ctx.fill(); ctx.stroke();

    ctx.restore();
  }
}
