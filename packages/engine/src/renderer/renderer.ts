import { Mech, Voice } from '../world/types';
import { Player, FxState } from '../physics/types';
import { mixColor, clamp01 } from '../core/utils';
import { ENERGY_COLOR, CREAM, RED, INK, PAPER_LIGHT, PAPER_DARK } from '../world/constants';
import { SUMMIT_Y } from '../physics/constants';
import { ringPos } from '../world/generator';
import { shadowAnd, drawGlyph, drawBead, prounShape, drawDecor, drawFar } from './shapes';
import { levelRegistry } from '../levels';


const FAR_FACTOR = 0.35;
const FAR_CHUNK = 1500;
const CHUNK = 900;
const TAU = Math.PI * 2;

export class Renderer {
  ctx: CanvasRenderingContext2D;
  W: number = 0;
  H: number = 0;
  DPR: number;
  grainPattern: CanvasPattern | null = null;
  post: HTMLCanvasElement;

  constructor(public canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.DPR = Math.min(window.devicePixelRatio || 1, 2);
    this.post = document.createElement('canvas');
    this.resize();
  }

  resize(w?: number, h?: number) {
    this.DPR = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = w || this.canvas.clientWidth || window.innerWidth;
    const targetH = h || this.canvas.clientHeight || window.innerHeight;
    if (targetW <= 0 || targetH <= 0) return;

    this.W = targetW;
    this.H = targetH;

    const bw = Math.round(targetW * this.DPR);
    const bh = Math.round(targetH * this.DPR);

    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    if (this.post.width !== bw || this.post.height !== bh) {
      this.post.width = bw;
      this.post.height = bh;
    }
  }

  setGrain(pattern: CanvasPattern) {
    this.grainPattern = pattern;
  }

  get pal() { return levelRegistry.getActiveConfig().palette; }
  get ink() { return this.pal.ink || INK; }
  get red() { return this.pal.red || RED; }
  get cream() { return this.pal.cream || CREAM; }
  get energyColors() { return this.pal.energyColors || ENERGY_COLOR; }

  drawProunEl(o: Mech, el: any, t: number, px: number, py: number) {
    const ctx = this.ctx;
    const isNeonGlow = levelRegistry.getActiveLevelId() === 2 || this.pal.paper === '#0A0A16';
    const c = this.energyColors[o.energy || 0];
    const col = el.col === 0 ? c : this.ink;
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

    if (isNeonGlow) {
      ctx.shadowColor = col;
      ctx.shadowBlur = 12;
    }

    const activeLevelId = levelRegistry.getActiveLevelId();
    ctx.save();
    ctx.translate((5 + el.depth * 11) * 0.6, 5 + el.depth * 11);
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = this.ink; ctx.strokeStyle = this.ink;
    prounShape(ctx, el, true, isNeonGlow, activeLevelId);
    ctx.restore();

    ctx.globalAlpha = 1;
    ctx.fillStyle = col; ctx.strokeStyle = col;
    prounShape(ctx, el, el.kind !== 'needle', isNeonGlow, activeLevelId);

    if (el.kind === 'plane') {
      ctx.globalAlpha = 0.5; ctx.strokeStyle = this.ink; ctx.lineWidth = 1.3;
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
    const activeLevelId = levelRegistry.getActiveLevelId();
    const isNeonGlow = activeLevelId === 2 || this.pal.paper === '#0A0A16';
    const c = this.energyColors[o.energy || 0];
    ctx.save();
    ctx.rotate(o.coreRot);
    const sc = 1 + o.corePulse * 0.1;
    ctx.scale(sc, sc);
    ctx.fillStyle = c; ctx.strokeStyle = c;
    const cs = o.coreSize;

    if (activeLevelId === 3) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowOffsetY = cs * 0.12;
      ctx.shadowBlur = cs * 0.22;

      switch (o.energy) {
        case 0: { // 🌸 Organic Detailed Sakura Rose Planet
          const petN = 14;
          for (let p = 0; p < petN; p++) {
            const a = p * (TAU / petN);
            ctx.save();
            ctx.rotate(a);
            const petGrad = ctx.createLinearGradient(0, 0, 0, -cs * 1.15);
            petGrad.addColorStop(0, '#FFE4E8');
            petGrad.addColorStop(0.5, '#FF80AB');
            petGrad.addColorStop(1, '#C2185B');
            ctx.fillStyle = petGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(cs * 0.45, -cs * 0.6, 0, -cs * 1.15);
            ctx.quadraticCurveTo(-cs * 0.45, -cs * 0.6, 0, 0);
            ctx.fill();
            // Fine Petal Rib Line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, -cs * 0.2); ctx.lineTo(0, -cs * 0.95); ctx.stroke();
            ctx.restore();
          }

          // Center Stamen Filaments & Pistil Core
          ctx.beginPath(); ctx.arc(0, 0, cs * 0.38, 0, TAU);
          const coreGrad = ctx.createRadialGradient(-cs * 0.1, -cs * 0.1, 1, 0, 0, cs * 0.38);
          coreGrad.addColorStop(0, '#FFFFFF');
          coreGrad.addColorStop(0.6, '#FFF59D');
          coreGrad.addColorStop(1, '#FBC02D');
          ctx.fillStyle = coreGrad; ctx.fill();

          ctx.strokeStyle = '#E65100';
          ctx.lineWidth = 1.2;
          for (let s = 0; s < 12; s++) {
            const sa = s * (TAU / 12);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(sa) * cs * 0.32, Math.sin(sa) * cs * 0.32);
            ctx.stroke();
            ctx.beginPath(); ctx.arc(Math.cos(sa) * cs * 0.32, Math.sin(sa) * cs * 0.32, 2, 0, TAU);
            ctx.fillStyle = '#E65100'; ctx.fill();
          }
          break;
        }
        case 1: { // 🪷 Organic Detailed Blue Lotus Planet
          const petN = 10;
          for (let layer = 2; layer >= 1; layer--) {
            const lScale = layer === 2 ? 1.0 : 0.72;
            for (let p = 0; p < petN; p++) {
              const a = p * (TAU / petN) + (layer === 1 ? Math.PI / petN : 0);
              ctx.save();
              ctx.rotate(a);
              const petGrad = ctx.createLinearGradient(0, 0, 0, -cs * 1.2 * lScale);
              petGrad.addColorStop(0, '#E0F7FA');
              petGrad.addColorStop(0.5, '#4DD0E1');
              petGrad.addColorStop(1, '#006064');
              ctx.fillStyle = petGrad;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.quadraticCurveTo(cs * 0.38 * lScale, -cs * 0.6 * lScale, 0, -cs * 1.2 * lScale);
              ctx.quadraticCurveTo(-cs * 0.38 * lScale, -cs * 0.6 * lScale, 0, 0);
              ctx.fill();
              ctx.restore();
            }
          }
          ctx.beginPath(); ctx.arc(0, 0, cs * 0.32, 0, TAU);
          ctx.fillStyle = '#E0F7FA'; ctx.fill();
          break;
        }
        case 2: { // 🌻 Organic Detailed Giant Sunflower Planet
          const petN = 20;
          for (let p = 0; p < petN; p++) {
            const a = p * (TAU / petN);
            ctx.save();
            ctx.rotate(a);
            const petGrad = ctx.createLinearGradient(0, 0, 0, -cs * 1.25);
            petGrad.addColorStop(0, '#FFF9C4');
            petGrad.addColorStop(0.4, '#FBC02D');
            petGrad.addColorStop(1, '#E65100');
            ctx.fillStyle = petGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(cs * 0.28, -cs * 0.6, 0, -cs * 1.25);
            ctx.quadraticCurveTo(-cs * 0.28, -cs * 0.6, 0, 0);
            ctx.fill();
            ctx.restore();
          }

          // Fibonacci Spiral Sunflower Seed Core
          ctx.beginPath(); ctx.arc(0, 0, cs * 0.52, 0, TAU);
          const seedGrad = ctx.createRadialGradient(-cs * 0.15, -cs * 0.15, 2, 0, 0, cs * 0.52);
          seedGrad.addColorStop(0, '#5D4037');
          seedGrad.addColorStop(0.8, '#261C14');
          seedGrad.addColorStop(1, '#1B5E20');
          ctx.fillStyle = seedGrad; ctx.fill();

          ctx.fillStyle = '#FFB300';
          for (let n = 1; n < 35; n++) {
            const r = Math.sqrt(n) * (cs * 0.08);
            const theta = n * 137.5 * (Math.PI / 180);
            const sx = Math.cos(theta) * r, sy = Math.sin(theta) * r;
            ctx.beginPath(); ctx.arc(sx, sy, 2.2, 0, TAU); ctx.fill();
          }
          break;
        }
        case 3: { // 🪻 Organic Detailed Violet Orchid Planet
          const petN = 6;
          for (let p = 0; p < petN; p++) {
            const a = p * (TAU / petN);
            ctx.save();
            ctx.rotate(a);
            const petGrad = ctx.createLinearGradient(0, 0, 0, -cs * 1.2);
            petGrad.addColorStop(0, '#F3E5F5');
            petGrad.addColorStop(0.5, '#BA68C8');
            petGrad.addColorStop(1, '#4A148C');
            ctx.fillStyle = petGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(cs * 0.42, -cs * 0.6, 0, -cs * 1.2);
            ctx.quadraticCurveTo(-cs * 0.42, -cs * 0.6, 0, 0);
            ctx.fill();
            ctx.restore();
          }
          ctx.beginPath(); ctx.arc(0, 0, cs * 0.35, 0, TAU);
          ctx.fillStyle = '#FFFFFF'; ctx.fill();
          break;
        }
      }
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.restore();
      return;
    }
    if (activeLevelId === 4) {
      ctx.fillStyle = c;
      ctx.font = `900 ${Math.max(12, Math.round(cs * 0.45))}px "Courier New", Consolas, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = [
        ' .---. ',
        '| ASCII |',
        ' \'---\' '
      ];
      lines.forEach((line, idx) => {
        ctx.fillText(line, 0, (idx - 1) * 14);
      });
      ctx.restore();
      return;
    }
    if (activeLevelId === 5) {
      ctx.fillStyle = c;
      ctx.font = `900 ${Math.max(14, Math.round(cs * 0.5))}px "Segoe UI Symbol", "Arial Unicode MS", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = [
        ' ╭───╮ ',
        '│ ☸ ☯ │',
        ' ╰───╯ '
      ];
      lines.forEach((line, idx) => {
        ctx.fillText(line, 0, (idx - 1) * 16);
      });
      ctx.restore();
      return;
    }
    if (isNeonGlow) {
      ctx.shadowColor = c;
      ctx.shadowBlur = 16;
      switch (o.energy) {
        case 0:
          ctx.beginPath();
          for (let p = 0; p < 8; p++) {
            const ang = p * (TAU / 8);
            const pr = (p % 2 === 0) ? cs * 0.85 : cs * 0.4;
            const px = Math.cos(ang) * pr, py = Math.sin(ang) * pr;
            if (p === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.fill(); ctx.stroke();
          break;
        case 1:
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, cs * 0.8, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, cs * 0.5, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, cs * 0.2, 0, TAU); ctx.fill();
          break;
        case 2:
          ctx.beginPath();
          ctx.moveTo(0, -cs * 0.85); ctx.lineTo(cs * 0.6, 0); ctx.lineTo(0, cs * 0.85); ctx.lineTo(-cs * 0.6, 0);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          break;
        case 3:
          ctx.fillRect(-cs * 1.2, -cs * 0.25, cs * 2.4, cs * 0.5);
          for (let i = -3; i <= 3; i++) {
            ctx.fillRect(i * 6 - 1.5, -cs * 0.55, 3, cs * 0.25);
          }
          break;
      }
      ctx.shadowBlur = 0;
      ctx.restore();
      return;
    }
    switch (o.energy) {
      case 0:
        shadowAnd(ctx, () => ctx.fillRect(-cs / 2, -cs * 0.4, cs, cs * 0.8));
        ctx.strokeStyle = this.ink; ctx.lineWidth = 1.5;
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
    const c = this.energyColors[o.energy || 0];
    const px = player.x - o.x, py = player.y - o.y;
    
    for (const ring of o.rings) {
      const breath = ring.persona === 0 ? 1 : 1 + (1 - (ring.tempoMul || 1)) * 0.10;
      const rr = (ring.r || 0) * breath;
      const ecc = ring.ecc || 1, ct = Math.cos(ring.tilt || 0), st = Math.sin(ring.tilt || 0);
      const pt = (ang: number, rad: number) => {
        const ex = Math.cos(ang) * rad, ey = Math.sin(ang) * rad * ecc;
        return [ex * ct - ey * st, ex * st + ey * ct];
      };

      const activeLvlTrackId = levelRegistry.getActiveLevelId();
      const isNeonGlowTrack = activeLvlTrackId === 2 || this.pal.paper === '#0A0A16';
      if (activeLvlTrackId === 3) {
        ctx.save();
        ctx.strokeStyle = '#388E3C';
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        const petals = 6;
        for (let a = 0; a <= 120; a++) {
          const ang = (a / 120) * TAU;
          const vineWave = Math.sin(ang * 16 + t * 2) * 5;
          const petalR = rr + Math.sin(ang * petals) * (rr * 0.15) + vineWave;
          const [wx, wy] = pt(ang, petalR);
          if (a === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
        }
        ctx.closePath();
        ctx.stroke();

        // Tiny Sprouting Leaf Buds along Vine Track
        ctx.fillStyle = '#A5D6A7';
        for (let l = 0; l < 12; l++) {
          const lang = l * (TAU / 12);
          const petalR = rr + Math.sin(lang * petals) * (rr * 0.15);
          const [lx, ly] = pt(lang, petalR);
          ctx.beginPath(); ctx.ellipse(lx, ly, 4, 2, lang + Math.PI / 4, 0, TAU); ctx.fill();
        }
        ctx.restore();
      } else if (activeLvlTrackId === 4) {
        ctx.save();
        ctx.fillStyle = c;
        ctx.font = '700 10px "Courier New", Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let a = 0; a < 24; a++) {
          const ang = (a / 24) * TAU;
          const [wx, wy] = pt(ang, rr);
          ctx.fillText(a % 2 === 0 ? '+' : '-', wx, wy);
        }
        ctx.restore();
      } else if (activeLvlTrackId === 5) {
        ctx.save();
        ctx.fillStyle = c;
        ctx.font = '700 11px "Segoe UI Symbol", "Arial Unicode MS", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let a = 0; a < 20; a++) {
          const ang = (a / 20) * TAU;
          const [wx, wy] = pt(ang, rr);
          ctx.fillText(a % 2 === 0 ? '◈' : '◇', wx, wy);
        }
        ctx.restore();
      } else if (isNeonGlowTrack) {
        ctx.strokeStyle = c;
        ctx.shadowColor = c;
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let a = 0; a <= 96; a++) {
          const ang = (a / 96) * TAU;
          const wave = Math.sin(ang * 12 + t * 4) * 8 + Math.cos(ang * 4) * 4;
          const rad = rr + wave;
          const [wx, wy] = pt(ang, rad);
          if (a === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = this.ink;
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
      }
      ctx.globalAlpha = 1;

      // Beads
      for (let i = 0; i < ring.talea.length; i++) {
        const a = (ring.phase0 || 0) + ring.dir! * (ring.cum[i] / ring.total) * TAU;
        let [bx, by] = pt(a, rr);
        const ddx = px - bx, ddy = py - by, dd = Math.hypot(ddx, ddy);
        if (dd < 240 && dd > 1) { const m = (1 - dd / 240) * 12; bx += ddx / dd * m; by += ddy / dd * m; }
        ctx.save();
        ctx.translate(bx, by);
        const activeLvlId = levelRegistry.getActiveLevelId();
        const isNeonGlow = activeLvlId === 2 || this.pal.paper === '#0A0A16';
        drawBead(ctx, ring.talea[i], i === 0 ? c : this.ink, isNeonGlow, activeLvlId);
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

      // Head — играющая головка партитуры (точная позиция, с учётом tempoMul)
      const p = ringPos(ring, T);
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
      const activeLvlId = levelRegistry.getActiveLevelId();
      const isNeonGlow = activeLvlId === 2 || this.pal.paper === '#0A0A16';
      drawGlyph(ctx, o.energy || 0, 6 + ring.headPulse * 3.5, isNeonGlow, activeLvlId);
      ctx.restore();
    }
    this.drawMechCore(o);
  }

  drawProunBody(o: Mech, T: number, t: number, player: Player) {
    const ctx = this.ctx;
    const px = player.x - o.x, py = player.y - o.y;
    ctx.strokeStyle = this.ink; ctx.globalAlpha = 0.07; ctx.lineWidth = 1;
    const ax = Math.cos(o.axis || 0), ay = Math.sin(o.axis || 0), L = o.outerR * 0.95;
    ctx.beginPath(); ctx.moveTo(-ax * L, -ay * L); ctx.lineTo(ax * L, ay * L); ctx.stroke();
    ctx.globalAlpha = 1;

    for (const fr of o.frames || []) {
      ctx.save(); ctx.translate(fr.bx, fr.by); ctx.rotate(fr.rot);
      ctx.strokeStyle = this.ink; ctx.globalAlpha = 0.13; ctx.lineWidth = 1.4;
      ctx.strokeRect(-fr.w / 2, -fr.h / 2, fr.w, fr.h);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    const els = o.rings.slice().sort((a: any, b: any) => a.depth - b.depth);
    for (const el of els) this.drawProunEl(o, el, t, px, py);

    const pv = 3.5 + o.corePulse * 3;
    ctx.beginPath(); ctx.arc(0, 0, pv, 0, TAU);
    ctx.fillStyle = this.cream; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = this.ink; ctx.stroke();
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

  draw(t: number, T: number, player: Player, fx: FxState, chunks: Map<string, any>, farChunks: Map<string, any>, dominant: Mech | null, tanks: number[], collectFlash: number[], worldSeed: number, particleFrac = 0.7, shockwaves: any[] = [], netPlayers: any[] = [], slots?: any[]) {
    const curW = this.canvas.clientWidth || window.innerWidth;
    const curH = this.canvas.clientHeight || window.innerHeight;
    if (curW > 0 && curH > 0 && (curW !== this.W || curH !== this.H)) {
      this.resize(curW, curH);
    }
    const { ctx, W, H, DPR } = this;

    const activeSlots = slots && slots.length > 0
      ? slots.filter((s: any) => s.active)
      : [{ num: 1, name: 'Игрок 1', color: '#BF3B2B', player, tanks, collectFlash }];

    const camX = activeSlots.reduce((acc: number, s: any) => acc + s.player.x, 0) / activeSlots.length;
    const camY = activeSlots.reduce((acc: number, s: any) => acc + s.player.y, 0) / activeSlots.length;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const activeLevelConfig = levelRegistry.getActiveConfig();
    const pal = activeLevelConfig.palette;
    const isNeonGlow = activeLevelConfig.id === 2 || pal.paper === '#0A0A16';

    // 1. Screen-space paper/primitive background
    if (activeLevelConfig.id === 4) {
      ctx.fillStyle = '#0D1117';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.fillStyle = 'rgba(0, 255, 102, 0.04)';
      ctx.font = '10px "Courier New", Consolas, monospace';
      const asciiCharSet = '/|\\-+=*#@01';
      for (let y = 15; y < H; y += 24) {
        let lineStr = '';
        for (let x = 0; x < W / 10; x++) {
          lineStr += asciiCharSet[Math.floor((x + y + t * 5) % asciiCharSet.length)];
        }
        ctx.fillText(lineStr, 0, y);
      }
      ctx.restore();
    } else if (activeLevelConfig.id === 5) {
      ctx.fillStyle = '#0A0E1A';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.fillStyle = 'rgba(0, 243, 255, 0.06)';
      ctx.font = '12px "Segoe UI Symbol", "Arial Unicode MS", monospace';
      const unicodeSet = '✧ ✦ ❖ ◈ ◆ ◇ ● ◉ ✹ ⚛ ☸ ☯';
      for (let y = 20; y < H; y += 32) {
        let lineStr = '';
        for (let x = 0; x < W / 14; x++) {
          lineStr += unicodeSet[Math.floor((x * 2 + y + t * 3) % unicodeSet.length)];
        }
        ctx.fillText(lineStr, 0, y);
      }
      ctx.restore();
    } else if (activeLevelConfig.usePrimitives) {
      ctx.fillStyle = pal.paper;
      ctx.fillRect(0, 0, W, H);
    } else {
      const altN = Math.max(-1, Math.min(1, camY / 7000));
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, mixColor(pal.paperLight, pal.paperDark, clamp01(0.5 + altN * 0.5 - 0.18)));
      bg.addColorStop(1, mixColor(pal.paperLight, pal.paperDark, clamp01(0.5 + altN * 0.5 + 0.18)));
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      if (this.grainPattern) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = this.grainPattern;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }

    // 1b. Ambient Neon Backdrop Pulse & Synthwave Grid (when Neon Night Club theme is active)
    if (isNeonGlow) {
      const radGrad = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.85);
      radGrad.addColorStop(0, 'rgba(255, 0, 127, 0.32)');
      radGrad.addColorStop(0.45, 'rgba(0, 240, 255, 0.18)');
      radGrad.addColorStop(0.75, 'rgba(121, 40, 202, 0.12)');
      radGrad.addColorStop(1, 'rgba(10, 10, 22, 0)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, W, H);

      // Perspective Cyber Synthwave Grid Floor Lines
      ctx.save();
      ctx.translate(W / 2 - camX, H / 2 - camY);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.14)';
      ctx.lineWidth = 1.2;
      const gStep = 90;
      const gx0 = Math.floor((camX - W) / gStep) * gStep;
      const gy0 = Math.floor((camY - H) / gStep) * gStep;
      ctx.beginPath();
      for (let x = gx0; x <= camX + W * 1.5; x += gStep) {
        ctx.moveTo(x, camY - H * 1.5); ctx.lineTo(x, camY + H * 1.5);
      }
      for (let y = gy0; y <= camY + H * 1.5; y += gStep) {
        ctx.moveTo(camX - W * 1.5, y); ctx.lineTo(camX + W * 1.5, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 2. Far architecture (parallax)
    ctx.save();
    ctx.translate(W / 2 - camX * FAR_FACTOR, H / 2 - camY * FAR_FACTOR);
    ctx.strokeStyle = isNeonGlow ? 'rgba(0, 240, 255, 0.35)' : 'rgba(30,27,22,0.07)';
    if (isNeonGlow) {
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = 10;
    }
    const fx0 = Math.floor((camX * FAR_FACTOR - W / 2) / FAR_CHUNK) - 1;
    const fx1 = Math.floor((camX * FAR_FACTOR + W / 2) / FAR_CHUNK) + 1;
    const fy0 = Math.floor((camY * FAR_FACTOR - H / 2) / FAR_CHUNK) - 1;
    const fy1 = Math.floor((camY * FAR_FACTOR + H / 2) / FAR_CHUNK) + 1;
    for (let cy = fy0; cy <= fy1; cy++) {
      for (let cx = fx0; cx <= fx1; cx++) {
        const arr = farChunks.get(cx + ',' + cy) || [];
        for (const f of arr) {
          ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
          drawFar(ctx, f.kind, f.size, isNeonGlow);
          ctx.restore();
        }
      }
    }
    if (isNeonGlow) {
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // 3. Main World
    ctx.save();
    if (fx.distort > 0.05)
      ctx.translate((Math.random() - 0.5) * 7 * fx.distort, (Math.random() - 0.5) * 7 * fx.distort);
    ctx.translate(W / 2 - camX, H / 2 - camY);

    // Local Co-op Slipstream Tethers & Covalent Molecular Orbits
    if (activeSlots.length > 1) {
      for (let i = 0; i < activeSlots.length; i++) {
        for (let j = i + 1; j < activeSlots.length; j++) {
          const s1 = activeSlots[i], s2 = activeSlots[j];
          const dist = Math.hypot(s2.player.x - s1.player.x, s2.player.y - s1.player.y);
          if (dist < 3960) {
            ctx.save();
            if (dist < 450) {
              ctx.strokeStyle = 'rgba(201, 155, 63, 0.55)';
              ctx.lineWidth = 2;
              ctx.setLineDash([8, 6]);
              ctx.lineDashOffset = -t * 80;
              ctx.beginPath();
              ctx.moveTo(s1.player.x, s1.player.y);
              ctx.lineTo(s2.player.x, s2.player.y);
              ctx.stroke();
            }

            // Fluid Organic Jellyfish Undulating Waves ("Медуза в воде" + Oval Stadium Envelope 3960px)
            if (dist < 3960) {
              const cx = (s1.player.x + s2.player.x) / 2;
              const cy = (s1.player.y + s2.player.y) / 2;
              const dx = s2.player.x - s1.player.x;
              const dy = s2.player.y - s1.player.y;
              const dLen = Math.hypot(dx, dy);
              const axisX = dLen > 0.001 ? dx / dLen : 1;
              const axisY = dLen > 0.001 ? dy / dLen : 0;
              const perpX = -axisY;
              const perpY = axisX;

              const bPhase = t * 2.0 + Math.sin(t * 0.35) * 1.5;
              const strokePulse = Math.sin(bPhase);
              const tension = (s1 as any)._tetherTension || 0;
              const orbitAlpha = Math.max(0.1, (1 - dist / 3960) * (1 - tension * 0.75));

              for (let k = 0; k < 4; k++) {
                const semiA = (dLen * 0.5) + 65 + k * 22 + strokePulse * (8 + k * 2);
                const semiB = 75 + k * 20 + strokePulse * (8 + k * 2);
                ctx.strokeStyle = ENERGY_COLOR[k];
                ctx.globalAlpha = (0.38 + strokePulse * 0.12) * orbitAlpha;
                ctx.lineWidth = 1.4 + strokePulse * 0.6;
                ctx.setLineDash([8, 6]);
                ctx.lineDashOffset = -bPhase * 30 * (k % 2 === 0 ? 1 : -1);

                ctx.beginPath();
                const steps = 48;
                for (let i = 0; i <= steps; i++) {
                  const angle = (i / steps) * TAU;
                  // Organic sine wave undulation along the oval perimeter ("овальный купол медузы")
                  const wave = Math.sin(angle * 3 + bPhase + k) * (8 + strokePulse * 4) + Math.cos(angle * 2 - bPhase * 0.7) * 5;
                  const rA = semiA + wave;
                  const rB = semiB + wave;
                  const wx = cx + (Math.cos(angle) * rA) * axisX + (Math.sin(angle) * rB) * perpX;
                  const wy = cy + (Math.cos(angle) * rA) * axisY + (Math.sin(angle) * rB) * perpY;
                  if (i === 0) ctx.moveTo(wx, wy);
                  else ctx.lineTo(wx, wy);
                }
                ctx.closePath();
                ctx.stroke();
              }
            }
            ctx.restore();
          }
        }
      }
    }

    // Patapon Shockwaves
    if (shockwaves) {
      for (const wave of shockwaves) {
        ctx.save();
        ctx.translate(wave.x, wave.y);
        ctx.lineWidth = 3;
        ctx.strokeStyle = RED;
        ctx.globalAlpha = Math.max(0, wave.life * 0.85);
        ctx.beginPath(); ctx.arc(0, 0, wave.r, 0, TAU); ctx.stroke();

        ctx.strokeStyle = INK; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, wave.r * 0.92, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, wave.r * 1.08, 0, TAU); ctx.stroke();
        ctx.restore();
      }
    }

    // NetPlayers (from separate browser instances)
    if (netPlayers && netPlayers.length > 0) {
      for (const np of netPlayers) {
        if (!np || typeof np.x !== 'number' || typeof np.y !== 'number' || isNaN(np.x) || isNaN(np.y)) continue;
        
        ctx.save();
        ctx.translate(np.x, np.y);

        ctx.fillStyle = 'rgba(191, 59, 43, 0.12)';
        ctx.beginPath(); ctx.arc(0, 0, 24, 0, TAU); ctx.fill();

        ctx.fillStyle = CREAM; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill(); ctx.stroke();

        ctx.fillStyle = INK; ctx.font = '700 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(np.name || np.id, 0, -28);

        const tanksArr = np.tanks || [6, 6, 6, 6];
        for (let i = 0; i < 4; i++) {
          let ox = 0, oy = 0;
          if (np.orbs && np.orbs[i]) {
            ox = np.orbs[i].ox;
            oy = np.orbs[i].oy;
          } else {
            const angle = t * 2.2 + i * (TAU / 4);
            ox = Math.cos(angle) * 32;
            oy = Math.sin(angle) * 32;
          }

          const s = (9 + (tanksArr[i] || 0) * 0.5);
          ctx.save();
          ctx.translate(ox, oy);
          ctx.rotate(t * 1.5 + i);
          ctx.fillStyle = ENERGY_COLOR[i];
          ctx.strokeStyle = ENERGY_COLOR[i];
          drawGlyph(ctx, i, s, isNeonGlow, activeLevelConfig.id);
          ctx.restore();
        }

        ctx.restore();
      }
    }

    const x0 = Math.floor((camX - W / 2 - 500) / CHUNK);
    const x1 = Math.floor((camX + W / 2 + 500) / CHUNK);
    const y0 = Math.floor((camY - H / 2 - 500) / CHUNK);
    const y1 = Math.floor((camY + H / 2 + 500) / CHUNK);
    
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++) {
        const ch = chunks.get(cx + ',' + cy);
        if (ch) for (const d of ch.decor) drawDecor(ctx, d, isNeonGlow ? 'rgba(0, 240, 255, 0.55)' : undefined, activeLevelConfig.id);
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
          if (isNeonGlow) {
            ctx.shadowColor = col;
            ctx.shadowBlur = 10;
          }
          const activeN = Math.round(o.parts.length * particleFrac);
          for (let pi = 0; pi < activeN; pi++) {
            const p = o.parts[pi];
            const fade = Math.min(1, p.life * 1.5);
            ctx.globalAlpha = 0.75 * fade;
            if (activeLevelConfig.id === 3) {
              ctx.beginPath(); ctx.ellipse(p.x, p.y, 3.8, 2.0, Math.PI / 4, 0, TAU); ctx.fill();
            } else {
              ctx.beginPath(); ctx.arc(p.x, p.y, 2.4, 0, TAU); ctx.fill();
            }
            ctx.globalAlpha = 0.28 * fade;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 0.08, p.y - p.vy * 0.08);
            ctx.stroke();
          }
          if (isNeonGlow) {
            ctx.shadowBlur = 0;
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

    // Organic Jellyfish Membrane Contour for Co-op Players
    if (activeSlots.length > 1) {
      for (let i = 0; i < activeSlots.length; i++) {
        for (let j = i + 1; j < activeSlots.length; j++) {
          const s1 = activeSlots[i], s2 = activeSlots[j];
          const dx = s2.player.x - s1.player.x;
          const dy = s2.player.y - s1.player.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 3960) {
            const tension = (s1 as any)._tetherTension || 0;
            const membraneAlpha = Math.max(0, (1 - dist / 3960) * (1 - tension * 0.85));

            if (membraneAlpha > 0.02) {
              const cx = (s1.player.x + s2.player.x) / 2;
              const cy = (s1.player.y + s2.player.y) / 2;
              const angle = Math.atan2(dy, dx);

              const breathe = Math.sin(t * 3.2 + i * 1.5) * 8;
              const semiA = (dist * 0.5) + 68 + breathe;
              const semiB = 58 + breathe * 0.6;

              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(angle);

              // Outer translucent organic jelly bubble fill
              ctx.beginPath();
              ctx.ellipse(0, 0, semiA, semiB, 0, 0, TAU);
              ctx.fillStyle = 'rgba(191, 59, 43, 0.08)';
              ctx.globalAlpha = membraneAlpha;
              ctx.fill();

              // Pulsing dashed organic contour line
              ctx.strokeStyle = '#BF3B2B';
              ctx.lineWidth = 1.8;
              ctx.setLineDash([12, 10]);
              ctx.lineDashOffset = -t * 40;
              ctx.globalAlpha = membraneAlpha * 0.65;
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.restore();
            }
          }
        }
      }
    }

    // Draw each active local slot player
    for (const slot of activeSlots) {
      const p = slot.player;
      const sTanks = slot.tanks || tanks;
      const sFlash = slot.collectFlash || collectFlash;

      // Orbs targets
      for (const orb of p.orbs) {
        if (!orb.target || orb.score < 0.03) continue;
        ctx.strokeStyle = ENERGY_COLOR[orb.energy];
        if (isNeonGlow) {
          ctx.shadowColor = ENERGY_COLOR[orb.energy];
          ctx.shadowBlur = 14;
        }
        ctx.globalAlpha = orb.score * 0.75;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([7, 7]);
        ctx.lineDashOffset = -t * 60;
        ctx.beginPath();
        ctx.moveTo(p.x + orb.ox, p.y + orb.oy);
        ctx.lineTo(orb.target.x, orb.target.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        if (isNeonGlow) ctx.shadowBlur = 0;
      }

      // Trails
      for (const orb of p.orbs) {
        const n = orb.trail.length;
        ctx.strokeStyle = ENERGY_COLOR[orb.energy];
        if (isNeonGlow) {
          ctx.shadowColor = ENERGY_COLOR[orb.energy];
          ctx.shadowBlur = 16;
        }
        for (let j = 1; j < n; j++) {
          ctx.globalAlpha = (j / n) * 0.35;
          ctx.lineWidth = (j / n) * 3;
          ctx.beginPath();
          ctx.moveTo(orb.trail[j - 1].x, orb.trail[j - 1].y);
          ctx.lineTo(orb.trail[j].x, orb.trail[j].y);
          ctx.stroke();
        }
        if (isNeonGlow) ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      // 2.7x Magnetism Surge Aura
      if (slot.magnetTimer && slot.magnetTimer > 0) {
        ctx.save();
        ctx.strokeStyle = '#C99B3F';
        if (isNeonGlow) {
          ctx.shadowColor = '#FFE600';
          ctx.shadowBlur = 20;
        }
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = 0.42 + Math.sin(t * 14) * 0.18;
        ctx.setLineDash([12, 8]);
        ctx.lineDashOffset = -t * 110;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 135, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }

      // 1. Breathing Outer Signature Color Aura (Radius ~24px / Diameter 48px)
      const slotColor = this.energyColors[(slot.num - 1) % 4];
      const auraR = 22 + Math.sin(t * 3.5 + slot.num) * 3;
      ctx.save();
      if (isNeonGlow) {
        ctx.shadowColor = slotColor;
        ctx.shadowBlur = 18;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, auraR, 0, TAU);
      ctx.fillStyle = slotColor;
      ctx.globalAlpha = 0.18;
      ctx.fill();
      ctx.strokeStyle = slotColor;
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.38;
      ctx.stroke();
      ctx.restore();

      // 2. Large Distinct Suprematist Pilot Emblem (Radius ~18px / Diameter 36px)
      ctx.save();
      ctx.translate(p.x, p.y);
      const speed = Math.hypot(p.vx || 0, p.vy || 0);
      if (speed > 15) {
        ctx.rotate(Math.atan2(p.vy, p.vx));
      }

      const pType = (slot.num - 1) % 4;
      if (activeLevelConfig.id === 3) {
        ctx.fillStyle = slotColor;
        ctx.strokeStyle = this.ink;
        ctx.lineWidth = 2;
        switch (pType) {
          case 0: // Sakura Blossom Ship
            ctx.beginPath();
            for (let p = 0; p < 5; p++) {
              const a = p * (TAU / 5);
              const px = Math.cos(a) * 16, py = Math.sin(a) * 16;
              ctx.arc(px * 0.6, py * 0.6, 9, 0, TAU);
            }
            ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU);
            ctx.fillStyle = '#FAF0E6'; ctx.fill();
            break;
          case 1: // Fern Leaf Ship
            ctx.beginPath();
            ctx.moveTo(18, 0); ctx.quadraticCurveTo(0, -18, -14, -10);
            ctx.lineTo(-6, 0); ctx.lineTo(-14, 10); ctx.quadraticCurveTo(0, 18, 18, 0);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(14, 0); ctx.stroke();
            break;
          case 2: // Sunflower Daisy Ship
            ctx.beginPath();
            for (let p = 0; p < 8; p++) {
              const a = p * (TAU / 8);
              const px = Math.cos(a) * 14, py = Math.sin(a) * 14;
              ctx.arc(px * 0.6, py * 0.6, 6, 0, TAU);
            }
            ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU);
            ctx.fillStyle = '#3B593E'; ctx.fill();
            break;
          case 3: // Water Lily Lotus Ship
          default:
            for (let p = 0; p < 3; p++) {
              const a = p * (TAU / 3) - Math.PI / 2;
              const px = Math.cos(a) * 10, py = Math.sin(a) * 10;
              ctx.beginPath(); ctx.arc(px, py, 11, 0, TAU); ctx.fill(); ctx.stroke();
            }
            ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU);
            ctx.fillStyle = '#FAF0E6'; ctx.fill();
            break;
        }
        ctx.restore();
      } else if (activeLevelConfig.id === 4) {
        ctx.fillStyle = slotColor;
        ctx.font = '900 18px "Courier New", Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const asciiShips = ['<[▲]>', '/\\_/', '<===>', '/|0|\\'];
        ctx.fillText(asciiShips[pType], 0, 0);
        ctx.restore();
      } else if (activeLevelConfig.id === 5) {
        ctx.fillStyle = slotColor;
        ctx.font = '900 20px "Segoe UI Symbol", "Arial Unicode MS", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const unicodeShips = ['꧁༺▲༻꧂', '◈◈◆◈◈', '✦▲✦', '❖◈▲◈❖'];
        ctx.fillText(unicodeShips[pType], 0, 0);
        ctx.restore();
      } else {
        switch (pType) {
          case 0: // Player 1: Primary Energy Winged Disc Emblem
          shadowAnd(ctx, () => {
            // Crosswing stabilizers
            ctx.fillStyle = this.ink;
            ctx.fillRect(-18, -3, 36, 6);
            ctx.fillRect(-3, -18, 6, 36);
            // Main Energy Circle
            ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU);
            ctx.fillStyle = this.energyColors[0]; ctx.fill();
            ctx.lineWidth = 2.5; ctx.strokeStyle = this.cream; ctx.stroke();
            // Core Accent Dot
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU);
            ctx.fillStyle = this.cream; ctx.fill();
          });
          break;

        case 1: // Player 2: Secondary Energy Double Diamond Crystal Emblem
          shadowAnd(ctx, () => {
            ctx.save(); ctx.rotate(Math.PI / 4);
            // Outer Diamond Frame
            ctx.strokeStyle = this.ink; ctx.lineWidth = 2.5;
            ctx.strokeRect(-16, -16, 32, 32);
            // Inner Solid Energy Diamond
            ctx.fillStyle = this.energyColors[1]; ctx.fillRect(-12, -12, 24, 24);
            ctx.strokeStyle = this.cream; ctx.lineWidth = 2; ctx.strokeRect(-12, -12, 24, 24);
            // Core Accent
            ctx.fillStyle = this.cream; ctx.fillRect(-4, -4, 8, 8);
            ctx.restore();
          });
          break;

        case 2: // Player 3: Tertiary Energy Triple Chevron Arrowhead Emblem
          shadowAnd(ctx, () => {
            ctx.fillStyle = this.energyColors[2]; ctx.strokeStyle = this.ink; ctx.lineWidth = 2;
            for (let step = 0; step < 3; step++) {
              const ox = step * 6 - 8;
              ctx.beginPath();
              ctx.moveTo(ox + 12, 0);
              ctx.lineTo(ox - 6, -12);
              ctx.lineTo(ox - 2, 0);
              ctx.lineTo(ox - 6, 12);
              ctx.closePath();
              ctx.fill(); ctx.stroke();
            }
            ctx.beginPath(); ctx.arc(4, 0, 4, 0, TAU);
            ctx.fillStyle = this.cream; ctx.fill();
          });
          break;

        case 3: // Player 4: Quaternary Energy Cross-Grid Shield Emblem
        default:
          shadowAnd(ctx, () => {
            ctx.strokeStyle = this.ink; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.stroke();
            ctx.fillStyle = this.energyColors[3]; ctx.fillRect(-11, -11, 22, 22);
            ctx.strokeStyle = this.cream; ctx.lineWidth = 2; ctx.strokeRect(-11, -11, 22, 22);
            ctx.fillStyle = this.cream;
            ctx.fillRect(-8, -2, 16, 4);
            ctx.fillRect(-2, -8, 4, 16);
          });
          break;
        }
        ctx.restore();
      }

      // 3. High-Contrast Player Slot Badge (P1 / P2 / P3 / P4)
      ctx.save();
      ctx.fillStyle = slotColor;
      ctx.beginPath();
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(p.x - 15, p.y - 36, 30, 16, 8);
      } else {
        ctx.rect(p.x - 15, p.y - 36, 30, 16);
      }
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#F9F7F1';
      ctx.font = '900 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`P${slot.num}`, p.x, p.y - 24);
      ctx.restore();

      for (let i = 0; i < 4; i++) {
        if (sFlash[i] < 0.04) continue;
        const orbCol = this.energyColors[i];
        ctx.strokeStyle = orbCol;
        ctx.globalAlpha = sFlash[i] * 0.6;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14 + (1 - sFlash[i]) * 34, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Four energies
      for (let i = 0; i < 4; i++) {
        const orb = p.orbs[i];
        const x = p.x + orb.ox, y = p.y + orb.oy;
        const s = (9 + sTanks[i] * 0.5) * (1 + orb.score * 0.4);

        // Cartoon Squash & Stretch calculation based on orb motion velocity
        const tr = orb.trail;
        let moveAngle = 0;
        let orbSpeed = 0;
        if (tr && tr.length >= 2) {
          const last = tr[tr.length - 1];
          const prev = tr[tr.length - 2];
          const dx = last.x - prev.x;
          const dy = last.y - prev.y;
          orbSpeed = Math.hypot(dx, dy);
          if (orbSpeed > 0.1) moveAngle = Math.atan2(dy, dx);
        }

        const stretch = 1.0 + Math.min(0.42, orbSpeed * 0.035);
        const squash = 1.0 / stretch;

        ctx.save();
        ctx.translate(x, y);
        // Align stretch axis along velocity vector
        ctx.rotate(moveAngle);
        ctx.scale(stretch, squash);
        // Rotate internal glyph relative to motion axis
        ctx.rotate(orb.phase * 1.4 + i - moveAngle);

        const orbCol = this.energyColors[i];
        ctx.fillStyle = orbCol;
        ctx.strokeStyle = orbCol;
        drawGlyph(ctx, i, s, isNeonGlow, activeLevelConfig.id);
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
    }

    ctx.restore(); // Restore World transform

    // Vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(30,27,22,0)');
    vg.addColorStop(1, 'rgba(30,27,22,0.10)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Minimap
    this.drawMinimap(player, chunks, dominant, netPlayers);

    // Post-effects: subtle chromatic glow without screen-slicing
    if (fx.distort > 0.08) {
      const pc = this.post.getContext('2d')!;
      pc.clearRect(0, 0, this.post.width, this.post.height);
      pc.drawImage(this.canvas, 0, 0);

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = Math.min(0.2, fx.distort * 0.18);
      ctx.drawImage(this.post, 3 * fx.distort * DPR, 0);
      ctx.drawImage(this.post, -3 * fx.distort * DPR, 0);
      ctx.restore();
    }

    if (fx.strobe > 0.03) {
      ctx.fillStyle = (Math.floor(t * 60) % 2 === 0) ? CREAM : INK;
      ctx.globalAlpha = fx.strobe * 0.8;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  drawMinimap(player: Player, chunks: Map<string, any>, dominant: Mech | null, netPlayers: any[] = []) {
    const { ctx, W } = this;
    const size = 134;
    const x0 = W - size - 64, y0 = 16;
    const cx = x0 + size / 2, cy = y0 + size / 2;
    const RANGE = 2600;
    const sc = (size / 2 - 8) / RANGE;

    ctx.save();
    ctx.fillStyle = this.pal.paper;
    ctx.globalAlpha = 0.88;
    ctx.fillRect(x0, y0, size, size);
    ctx.strokeStyle = this.pal.ink;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.45;
    ctx.strokeRect(x0, y0, size, size);
    ctx.fillStyle = this.pal.ink;
    ctx.globalAlpha = 0.85;
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
          ctx.fillStyle = this.energyColors[o.energy || 0];
          ctx.beginPath(); ctx.arc(mxp, myp, rad, 0, TAU); ctx.fill();
          if (o === dominant) {
            ctx.globalAlpha = 0.5; ctx.strokeStyle = this.energyColors[o.energy || 0]; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(mxp, myp, rad + 3, 0, TAU); ctx.stroke();
          }
        }
      }
    }
    ctx.globalAlpha = 1;

    // Render multiplayer pilots on minimap
    if (netPlayers && netPlayers.length > 0) {
      for (const np of netPlayers) {
        if (!np || typeof np.x !== 'number' || typeof np.y !== 'number' || isNaN(np.x) || isNaN(np.y)) continue;
        const dx = np.x - player.x;
        const dy = np.y - player.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        if (dist <= RANGE * 1.8) {
          const mxp = cx + dx * sc;
          const myp = cy + dy * sc;
          ctx.save();
          ctx.translate(mxp, myp);
          ctx.fillStyle = '#BF3B2B';
          ctx.strokeStyle = '#1E1B16';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, TAU);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        } else {
          // Edge compass arrow pointing towards peer pilot
          const edgeR = size / 2 - 12;
          const ex = cx + Math.cos(angle) * edgeR;
          const ey = cy + Math.sin(angle) * edgeR;

          ctx.save();
          ctx.translate(ex, ey);
          ctx.rotate(angle);
          ctx.fillStyle = '#BF3B2B';
          ctx.beginPath();
          ctx.moveTo(6, 0); ctx.lineTo(-5, -4); ctx.lineTo(-5, 4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    }

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
