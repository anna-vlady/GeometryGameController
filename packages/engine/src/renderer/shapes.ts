import { INK } from '../world/constants';

const TAU = Math.PI * 2;

export function shadowAnd(ctx: CanvasRenderingContext2D, fillFn: (fill: boolean) => void) {
  ctx.save();
  ctx.translate(7, 9);
  ctx.globalAlpha *= 0.13;
  const f = ctx.fillStyle, s = ctx.strokeStyle;
  ctx.fillStyle = INK; ctx.strokeStyle = INK;
  fillFn(true);
  ctx.restore();
  ctx.fillStyle = f; ctx.strokeStyle = s;
  fillFn(false);
}

export function drawGlyph(ctx: CanvasRenderingContext2D, i: number, s: number, isNeonGlow?: boolean, levelId?: number) {
  if (levelId === 3) {
    switch (i) {
      case 0: { // Sakura Cherry Blossom 🌸
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
          const a = p * (TAU / 5) - Math.PI / 2;
          const r1 = s * 1.35, r2 = s * 0.45;
          const x1 = Math.cos(a) * r1, y1 = Math.sin(a) * r1;
          const x2 = Math.cos(a + TAU / 10) * r2, y2 = Math.sin(a + TAU / 10) * r2;
          if (p === 0) ctx.moveTo(x1, y1); else ctx.lineTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, s * 0.35, 0, TAU); ctx.fill();
        break;
      }
      case 1: { // Fern Frond Leaf 🍃
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.4);
        ctx.quadraticCurveTo(s * 1.2, 0, 0, s * 1.4);
        ctx.quadraticCurveTo(-s * 1.2, 0, 0, -s * 1.4);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -s * 1.2); ctx.lineTo(0, s * 1.2); ctx.stroke();
        break;
      }
      case 2: { // Sunflower Daisy 🌼
        ctx.beginPath();
        for (let p = 0; p < 8; p++) {
          const a = p * (TAU / 8);
          const r = s * 1.25;
          const px = Math.cos(a) * r, py = Math.sin(a) * r;
          ctx.arc(px * 0.5, py * 0.5, s * 0.45, 0, TAU);
        }
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, TAU); ctx.fill();
        break;
      }
      case 3: { // Tulip Bud 🌷
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.3);
        ctx.quadraticCurveTo(s * 1.1, -s * 0.3, s * 0.7, s * 1.1);
        ctx.lineTo(-s * 0.7, s * 1.1);
        ctx.quadraticCurveTo(-s * 1.1, -s * 0.3, 0, -s * 1.3);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      }
    }
    return;
  }
  if (isNeonGlow) {
    switch (i) {
      case 0: { // 5-Petal Cyber Rose / Flower
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
          const a = p * (TAU / 5);
          const r1 = s * 1.3, r2 = s * 0.55;
          const x1 = Math.cos(a) * r1, y1 = Math.sin(a) * r1;
          const x2 = Math.cos(a + TAU / 10) * r2, y2 = Math.sin(a + TAU / 10) * r2;
          if (p === 0) ctx.moveTo(x1, y1); else ctx.lineTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      }
      case 1: { // Electric Lightning Bolt
        ctx.beginPath();
        ctx.moveTo(s * 0.3, -s * 1.4);
        ctx.lineTo(-s * 0.8, -s * 0.1);
        ctx.lineTo(-s * 0.1, 0);
        ctx.lineTo(-s * 0.5, s * 1.4);
        ctx.lineTo(s * 0.8, s * 0.1);
        ctx.lineTo(s * 0.1, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      }
      case 2: { // Crescent Moon
        ctx.beginPath();
        ctx.arc(0, 0, s * 1.1, 0.4 * Math.PI, 1.6 * Math.PI, false);
        ctx.arc(-s * 0.4, 0, s * 0.9, 1.5 * Math.PI, 0.5 * Math.PI, true);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      }
      case 3: { // 5-Bar Equalizer Wave
        const bw = s * 0.35, gap = s * 0.2;
        const totalW = 5 * bw + 4 * gap;
        const startX = -totalW / 2;
        const heights = [0.5, 1.1, 1.5, 0.9, 0.6];
        for (let b = 0; b < 5; b++) {
          const bh = s * heights[b];
          ctx.fillRect(startX + b * (bw + gap), -bh / 2, bw, bh);
        }
        break;
      }
    }
    return;
  }

  switch (i) {
    case 0: ctx.fillRect(-s, -s, s * 2, s * 2); break;
    case 1:
      ctx.lineWidth = Math.max(1.5, s * 0.38);
      ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.stroke();
      break;
    case 2:
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.25); ctx.lineTo(s * 1.1, s * 0.85); ctx.lineTo(-s * 1.1, s * 0.85);
      ctx.closePath(); ctx.fill();
      break;
    case 3: ctx.fillRect(-s * 1.8, -s * 0.35, s * 3.6, s * 0.7); break;
  }
}

export function drawBead(ctx: CanvasRenderingContext2D, dur: number, col: string, isNeonGlow?: boolean, levelId?: number) {
  ctx.fillStyle = col; ctx.strokeStyle = col;
  if (levelId === 3) {
    if (dur >= 3) {
      ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, TAU); ctx.fill(); ctx.stroke();
    } else if (dur === 2) {
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 4, Math.PI / 4, 0, TAU); ctx.fill();
    } else if (dur === 1.5) {
      ctx.fillRect(-7, -2, 14, 4);
    } else {
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill();
    }
    return;
  }
  ctx.fillStyle = col; ctx.strokeStyle = col;
  if (isNeonGlow) {
    if (dur >= 3) {
      ctx.beginPath();
      ctx.moveTo(0, -10); ctx.lineTo(8, 0); ctx.lineTo(0, 10); ctx.lineTo(-8, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (dur === 2) {
      ctx.beginPath();
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(-6, -6, 12, 12, 4); ctx.fill();
      } else {
        ctx.fillRect(-6, -6, 12, 12);
      }
    } else if (dur === 1.5) {
      ctx.fillRect(-8, -2, 16, 4);
    } else {
      ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, TAU); ctx.fill();
    }
    return;
  }
  if (dur >= 3) {
    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(7.5, 6); ctx.lineTo(-7.5, 6);
    ctx.closePath(); ctx.fill();
  } else if (dur === 2) {
    ctx.fillRect(-5.5, -5.5, 11, 11);
  } else if (dur === 1.5) {
    ctx.fillRect(-7, -1.6, 14, 3.2);
  } else {
    ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, TAU); ctx.fill();
  }
}

export function prounShape(ctx: CanvasRenderingContext2D, el: any, fill: boolean, isNeonGlow?: boolean, levelId?: number) {
  const l = el.len || 30, w = el.wid || 10;
  if (levelId === 3) {
    switch (el.kind) {
      case 'plane':
      case 'bar': {
        const r = Math.min(l / 2, w / 2);
        ctx.beginPath();
        if ((ctx as any).roundRect) {
          (ctx as any).roundRect(-l / 2, -w / 2, l, w, r);
        } else {
          ctx.rect(-l / 2, -w / 2, l, w);
        }
        if (fill) ctx.fill(); else ctx.stroke();
        ctx.beginPath(); ctx.arc(-l * 0.2, -w / 2 - 3, 3, 0, TAU); ctx.fill();
        return;
      }
      case 'disc': {
        const r = l / 2;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
        if (fill) ctx.fill(); else ctx.stroke();
        for (let p = 0; p < 8; p++) {
          const a = p * (TAU / 8);
          const px = Math.cos(a) * r * 0.85, py = Math.sin(a) * r * 0.85;
          ctx.beginPath(); ctx.arc(px, py, r * 0.22, 0, TAU); ctx.stroke();
        }
        return;
      }
      case 'ring-disc': {
        const r = l / 2;
        ctx.lineWidth = 1.6;
        for (let k = 1; k <= 3; k++) {
          ctx.beginPath(); ctx.arc(0, 0, (r * k) / 3, 0, TAU); ctx.stroke();
        }
        return;
      }
      case 'wedge': {
        const s = l / 2;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.8);
        ctx.quadraticCurveTo(-s * 1.2, -s * 0.2, -s, -s);
        ctx.quadraticCurveTo(0, -s * 1.4, s, -s);
        ctx.quadraticCurveTo(s * 1.2, -s * 0.2, 0, s * 0.8);
        ctx.closePath();
        if (fill) ctx.fill(); else ctx.stroke();
        return;
      }
    }
  }

  if (isNeonGlow) {
    switch (el.kind) {
      case 'plane':
      case 'bar': {
        const r = Math.min(l / 2, w / 2);
        ctx.beginPath();
        if ((ctx as any).roundRect) {
          (ctx as any).roundRect(-l / 2, -w / 2, l, w, r);
        } else {
          ctx.rect(-l / 2, -w / 2, l, w);
        }
        if (fill) ctx.fill(); else ctx.stroke();
        return;
      }
      case 'disc': {
        const r = l / 2;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
        if (fill) ctx.fill(); else ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r * 0.15, 0, TAU); ctx.fill();
        return;
      }
      case 'ring-disc': {
        const r = l / 2;
        for (let k = 1; k <= 3; k++) {
          ctx.beginPath(); ctx.arc(0, 0, (r * k) / 3, 0, TAU);
          ctx.lineWidth = 1.8; ctx.stroke();
        }
        if (fill) { ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, TAU); ctx.fill(); }
        return;
      }
      case 'wedge': {
        const s = l / 2;
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.3);
        ctx.quadraticCurveTo(s * 1.2, 0, s * 0.9, s * 0.9);
        ctx.lineTo(0, s * 0.4);
        ctx.lineTo(-s * 0.9, s * 0.9);
        ctx.quadraticCurveTo(-s * 1.2, 0, 0, -s * 1.3);
        ctx.closePath();
        if (fill) ctx.fill(); else ctx.stroke();
        return;
      }
      case 'needle': {
        ctx.lineWidth = Math.max(2, w);
        ctx.beginPath();
        const halfL = l / 2;
        ctx.moveTo(-halfL, 0);
        for (let x = -halfL; x <= halfL; x += 4) {
          const y = Math.sin((x / halfL) * Math.PI * 2) * (w * 0.8);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.beginPath(); ctx.arc(halfL, 0, 4, 0, TAU); ctx.fill();
        return;
      }
      case 'frame-box':
      case 'grid-cross': {
        ctx.lineWidth = 1.8;
        ctx.strokeRect(-l / 2, -w / 2, l, w);
        const bars = 5;
        for (let b = 0; b < bars; b++) {
          const bx = -l / 2 + ((b + 0.5) * l) / bars;
          const bh = (w * 0.7) * (0.4 + Math.sin(b * 1.7) * 0.6);
          ctx.fillRect(bx - 2, w / 2 - bh, 4, bh);
        }
        return;
      }
    }
  }

  switch (el.kind) {
    case 'plane':
    case 'bar':
      if (fill) ctx.fillRect(-l / 2, -w / 2, l, w);
      else ctx.strokeRect(-l / 2, -w / 2, l, w);
      break;
    case 'disc': {
      const r = l / 2;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
      if (fill) ctx.fill(); else { ctx.lineWidth = Math.max(2, r * 0.3); ctx.stroke(); }
      break;
    }
    case 'ring-disc': {
      const r = l / 2;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, TAU);
      ctx.lineWidth = Math.max(2, r * 0.25);
      ctx.stroke();
      if (fill) { ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, TAU); ctx.fill(); }
      break;
    }
    case 'wedge': {
      const s = l / 2;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.2); ctx.lineTo(s, s * 0.8); ctx.lineTo(-s, s * 0.8);
      ctx.closePath();
      if (fill) ctx.fill(); else ctx.stroke();
      break;
    }
    case 'needle':
      ctx.lineWidth = Math.max(1.5, w);
      ctx.beginPath(); ctx.moveTo(-l / 2, 0); ctx.lineTo(l / 2, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(l / 2, 0, 3, 0, TAU); ctx.fill();
      break;
    case 'parallelogram': {
      const skew = w * 0.7;
      ctx.beginPath();
      ctx.moveTo(-l / 2 + skew, -w / 2);
      ctx.lineTo(l / 2 + skew, -w / 2);
      ctx.lineTo(l / 2 - skew, w / 2);
      ctx.lineTo(-l / 2 - skew, w / 2);
      ctx.closePath();
      if (fill) ctx.fill(); else ctx.stroke();
      break;
    }
    case 'trapezoid': {
      ctx.beginPath();
      ctx.moveTo(-l * 0.3, -w / 2);
      ctx.lineTo(l * 0.3, -w / 2);
      ctx.lineTo(l / 2, w / 2);
      ctx.lineTo(-l / 2, w / 2);
      ctx.closePath();
      if (fill) ctx.fill(); else ctx.stroke();
      break;
    }
    case 'arc-segment': {
      const r = l / 2;
      ctx.lineWidth = Math.max(2, w);
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI * 0.4, Math.PI * 0.65);
      ctx.stroke();
      break;
    }
    case 'striped-plane': {
      if (fill) ctx.fillRect(-l / 2, -w / 2, l, w);
      ctx.save();
      ctx.lineWidth = 1;
      const step = 6;
      ctx.beginPath();
      for (let x = -l / 2 + step; x < l / 2; x += step) {
        ctx.moveTo(x, -w / 2); ctx.lineTo(x + w * 0.5, w / 2);
      }
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'grid-cross': {
      ctx.lineWidth = Math.max(1.5, w * 0.3);
      ctx.beginPath();
      ctx.moveTo(-l / 2, 0); ctx.lineTo(l / 2, 0);
      ctx.moveTo(0, -l * 0.35); ctx.lineTo(0, l * 0.35);
      ctx.stroke();
      // Ticks
      for (let x = -l / 2 + 10; x <= l / 2 - 10; x += 15) {
        ctx.beginPath(); ctx.moveTo(x, -4); ctx.lineTo(x, 4); ctx.stroke();
      }
      break;
    }
    case 'frame-box': {
      ctx.lineWidth = Math.max(1.5, w * 0.25);
      ctx.strokeRect(-l / 2, -w / 2, l, w);
      ctx.beginPath();
      ctx.moveTo(-l / 2, -w / 2); ctx.lineTo(l / 2, w / 2);
      ctx.stroke();
      break;
    }
  }
}

export function drawDecor(ctx: CanvasRenderingContext2D, d: any, inkCol?: string, levelId?: number) {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(d.rot);
  const color = inkCol || 'rgba(30,27,22,0.28)';
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (levelId === 3) {
    ctx.font = `${Math.max(14, d.size * 1.1)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    switch (d.kind) {
      case 'cross': ctx.fillText('🍃', 0, 0); break;
      case 'arc': ctx.fillText('🌸', 0, 0); break;
      case 'outline': ctx.fillText('🍀', 0, 0); break;
      case 'dots':
        for (let i = 0; i < 4; i++) {
          ctx.beginPath(); ctx.arc(i * 12 - 18, 0, 3.5, 0, TAU); ctx.fill();
        }
        break;
    }
    ctx.restore();
    return;
  }
  if (inkCol) {
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 10;
    switch (d.kind) {
      case 'cross': // Floating Musical Eighth Note ♪
        ctx.font = `${Math.max(14, d.size)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('♪', 0, 0);
        break;
      case 'arc': // Glowing Star Sparkle ✦
        ctx.font = `${Math.max(16, d.size * 1.1)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('✦', 0, 0);
        break;
      case 'outline': // Equalizer Spectrum Bars
        ctx.lineWidth = 2;
        for (let b = -2; b <= 2; b++) {
          const bh = (d.size * 0.7) * (0.3 + Math.abs(Math.sin(b * 1.5 + d.x)) * 0.7);
          ctx.fillRect(b * 6 - 2, -bh / 2, 4, bh);
        }
        break;
      case 'dots': // Glowing Energy Droplet Cluster
        for (let i = 0; i < 4; i++) {
          ctx.beginPath(); ctx.arc(i * 12 - 18, 0, 3.5, 0, TAU); ctx.fill();
        }
        break;
    }
    ctx.shadowBlur = 0;
    ctx.restore();
    return;
  }
  switch (d.kind) {
    case 'cross':
      ctx.fillRect(-d.size / 2, -3, d.size, 6);
      ctx.fillRect(-3, -d.size / 2, 6, d.size);
      break;
    case 'arc':
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, d.size, 0.3, Math.PI * 1.1); ctx.stroke();
      break;
    case 'outline':
      ctx.lineWidth = 2;
      ctx.strokeRect(-d.size / 2, -d.size * 0.35, d.size, d.size * 0.7);
      break;
    case 'dots':
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.arc(i * 15 - 22, 0, 3, 0, TAU); ctx.fill();
      }
      break;
  }
  ctx.restore();
}

export function drawFar(ctx: CanvasRenderingContext2D, kind: number, s: number, isNeonGlow?: boolean, levelId?: number) {
  ctx.lineWidth = 2;
  if (levelId === 3) {
    switch (kind) {
      case 0: { // Pine Tree Silhouette
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.7); ctx.lineTo(s * 0.45, s * 0.4); ctx.lineTo(-s * 0.45, s * 0.4);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillRect(-2, s * 0.4, 4, s * 0.2);
        break;
      }
      case 1: { // Sakura Blossom Outline
        ctx.beginPath(); ctx.arc(0, 0, s * 0.4, 0, TAU); ctx.stroke();
        for (let p = 0; p < 5; p++) {
          const a = p * (TAU / 5);
          ctx.beginPath(); ctx.arc(Math.cos(a) * s * 0.35, Math.sin(a) * s * 0.35, s * 0.22, 0, TAU); ctx.stroke();
        }
        break;
      }
      case 2: { // Forest Canopy Triangle
        ctx.beginPath();
        ctx.moveTo(0, -s / 2); ctx.lineTo(s / 2, s / 2); ctx.lineTo(-s / 2, s / 2);
        ctx.closePath(); ctx.stroke();
        break;
      }
    }
    return;
  }
  if (isNeonGlow) {
    switch (kind) {
      case 0: { // Equalizer Skyscraper
        const bars = 7;
        const bw = s / bars;
        for (let b = 0; b < bars; b++) {
          const bh = (s * 0.8) * (0.3 + Math.abs(Math.sin(b * 1.8)) * 0.7);
          ctx.fillRect(-s / 2 + b * bw, s / 2 - bh, bw * 0.8, bh);
        }
        break;
      }
      case 1: { // Vinyl Record Deck Outline
        ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, s / 4, 0, TAU); ctx.stroke();
        break;
      }
      case 2: { // Laser Grid Pyramid
        ctx.beginPath();
        ctx.moveTo(0, -s / 2); ctx.lineTo(s / 2, s / 2); ctx.lineTo(-s / 2, s / 2);
        ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -s / 2); ctx.lineTo(0, s / 2); ctx.stroke();
        break;
      }
    }
    return;
  }
  switch (kind) {
    case 0: ctx.strokeRect(-s / 2, -s / 3, s, s * 0.66); break;
    case 1: ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, TAU); ctx.stroke(); break;
    case 2:
      ctx.beginPath();
      ctx.moveTo(-s / 2, s / 3); ctx.lineTo(s / 2, s / 3); ctx.lineTo(0, -s / 2);
      ctx.closePath(); ctx.stroke();
      break;
  }
}
