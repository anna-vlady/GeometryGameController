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
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur = 6;
    switch (i) {
      case 0: { // 3D Sakura Blossom Flower Petal 🌸
        const grad = ctx.createRadialGradient(-s * 0.3, -s * 0.3, 1, 0, 0, s * 1.4);
        grad.addColorStop(0, '#FFE0B2');
        grad.addColorStop(0.5, '#FF80AB');
        grad.addColorStop(1, '#C2185B');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.3);
        ctx.quadraticCurveTo(s * 1.1, -s * 0.4, s * 0.8, s * 1.1);
        ctx.lineTo(0, s * 0.7);
        ctx.lineTo(-s * 0.8, s * 1.1);
        ctx.quadraticCurveTo(-s * 1.1, -s * 0.4, 0, -s * 1.3);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 1: { // 3D Willow Leaf Petal 🍃
        const grad = ctx.createRadialGradient(-s * 0.2, -s * 0.3, 1, 0, 0, s * 1.4);
        grad.addColorStop(0, '#E0F7FA');
        grad.addColorStop(0.5, '#4DD0E1');
        grad.addColorStop(1, '#00838F');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.4);
        ctx.quadraticCurveTo(s * 1.0, 0, 0, s * 1.4);
        ctx.quadraticCurveTo(-s * 1.0, 0, 0, -s * 1.4);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 2: { // 3D Ginkgo Fan Petal 🌼
        const grad = ctx.createRadialGradient(-s * 0.2, -s * 0.3, 1, 0, 0, s * 1.4);
        grad.addColorStop(0, '#FFF9C4');
        grad.addColorStop(0.5, '#FBC02D');
        grad.addColorStop(1, '#E65100');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.9);
        ctx.quadraticCurveTo(-s * 1.3, -s * 0.1, -s * 0.95, -s * 0.95);
        ctx.quadraticCurveTo(0, -s * 1.4, s * 0.95, -s * 0.95);
        ctx.quadraticCurveTo(s * 1.3, -s * 0.1, 0, s * 0.9);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 3: { // 3D Lotus Flower Petal 🪷
        const grad = ctx.createRadialGradient(-s * 0.2, -s * 0.3, 1, 0, 0, s * 1.4);
        grad.addColorStop(0, '#F3E5F5');
        grad.addColorStop(0.5, '#BA68C8');
        grad.addColorStop(1, '#4A148C');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.4);
        ctx.quadraticCurveTo(s * 1.35, -s * 0.2, 0, s * 1.2);
        ctx.quadraticCurveTo(-s * 1.35, -s * 0.2, 0, -s * 1.4);
        ctx.closePath(); ctx.fill();
        break;
      }
    }
    ctx.restore();
    return;
  }
  if (levelId === 4) { // ASCII Art Theme
    ctx.save();
    ctx.font = `900 ${Math.round(s * 1.6)}px "Courier New", Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const asciiGlyphs = ['(0)', '<#>', '{o}', '^w^'];
    ctx.fillText(asciiGlyphs[i % 4], 0, 0);
    ctx.restore();
    return;
  }
  if (levelId === 5) { // Unicode Art Theme
    ctx.save();
    ctx.font = `900 ${Math.round(s * 1.8)}px "Segoe UI Symbol", "Arial Unicode MS", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const unicodeGlyphs = ['✹', '⚛', '☸', '☯'];
    ctx.fillText(unicodeGlyphs[i % 4], 0, 0);
    ctx.restore();
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
    if (dur >= 3) { // Sakura Blossom Petal
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.quadraticCurveTo(6, -2, 4, 6);
      ctx.lineTo(0, 4);
      ctx.lineTo(-4, 6);
      ctx.quadraticCurveTo(-6, -2, 0, -7);
      ctx.closePath(); ctx.fill();
    } else if (dur === 2) { // Teardrop Leaf
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 3.5, Math.PI / 4, 0, TAU); ctx.fill();
    } else if (dur === 1.5) { // Small Clover Petal
      ctx.beginPath();
      ctx.arc(-2.5, -1, 3, 0, TAU); ctx.arc(2.5, -1, 3, 0, TAU); ctx.arc(0, 2.5, 3, 0, TAU);
      ctx.fill();
    } else { // Tiny Willow Leaf Petal (replaces plain small circle dots!)
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.5, 2.2, Math.PI / 4, 0, TAU); ctx.fill();
    }
    return;
  }
  if (levelId === 4) { // ASCII Art Theme Note Beads
    ctx.save();
    ctx.font = `700 12px "Courier New", Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const charStr = dur >= 3 ? '[#]' : dur === 2 ? '<*>' : dur === 1.5 ? '(+)' : ':';
    ctx.fillText(charStr, 0, 0);
    ctx.restore();
    return;
  }
  if (levelId === 5) { // Unicode Art Theme Note Beads
    ctx.save();
    ctx.font = `700 13px "Segoe UI Symbol", "Arial Unicode MS", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const charStr = dur >= 3 ? '❖' : dur === 2 ? '◈' : dur === 1.5 ? '✦' : '✧';
    ctx.fillText(charStr, 0, 0);
    ctx.restore();
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
      case 'disc': { // 3D Volumetric Mushroom Cap 🍄
        const r = l / 2;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowOffsetY = r * 0.18;
        ctx.shadowBlur = r * 0.3;
        const shroomGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.2);
        shroomGrad.addColorStop(0, '#FF8A80');
        shroomGrad.addColorStop(0.4, '#E53935');
        shroomGrad.addColorStop(1, '#880E4F');
        ctx.fillStyle = shroomGrad;
        ctx.beginPath();
        ctx.arc(0, -r * 0.1, r, Math.PI, 0);
        ctx.quadraticCurveTo(0, r * 0.4, -r, 0);
        ctx.closePath(); ctx.fill();

        // 3D Embossed Spore Spots
        ctx.fillStyle = '#FFF8E1';
        ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.4, r * 0.18, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.5, r * 0.22, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -r * 0.7, r * 0.16, 0, TAU); ctx.fill();
        ctx.restore();
        return;
      }
      case 'ring-disc': { // Layered Water Lily Petal Blossom 🪷
        const r = l / 2;
        ctx.lineWidth = 1.8;
        for (let layer = 1; layer <= 3; layer++) {
          const lr = (r * layer) / 3;
          ctx.beginPath();
          for (let p = 0; p < 8; p++) {
            const a = p * (TAU / 8);
            const px = Math.cos(a) * lr, py = Math.sin(a) * lr;
            ctx.arc(px * 0.6, py * 0.6, lr * 0.38, 0, TAU);
          }
          ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(0, 0, r * 0.18, 0, TAU); ctx.fill();
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
      case 'grid-cross':
      case 'frame-box': { // 3D Realistic Botanical Forest Tree 🌳
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowOffsetY = l * 0.08;
        ctx.shadowBlur = l * 0.18;

        // 3D Cylindrical Wood Trunk
        const trunkGrad = ctx.createLinearGradient(-5, 0, 5, 0);
        trunkGrad.addColorStop(0, '#3E2723');
        trunkGrad.addColorStop(0.5, '#795548');
        trunkGrad.addColorStop(1, '#271C19');
        ctx.fillStyle = trunkGrad;
        ctx.fillRect(-5, -l / 2, 10, l);

        // 3D Spherical Leaf Canopy Puffs
        const puffs = [
          { x: 0, y: -l * 0.42, r: l * 0.28 },
          { x: -l * 0.28, y: -l * 0.25, r: l * 0.22 },
          { x: l * 0.28, y: -l * 0.25, r: l * 0.22 },
          { x: -l * 0.22, y: 0, r: l * 0.2 },
          { x: l * 0.22, y: 0, r: l * 0.2 }
        ];
        for (const pf of puffs) {
          const puffGrad = ctx.createRadialGradient(pf.x - pf.r * 0.3, pf.y - pf.r * 0.3, pf.r * 0.1, pf.x, pf.y, pf.r * 1.1);
          puffGrad.addColorStop(0, '#A5D6A7');
          puffGrad.addColorStop(0.4, '#388E3C');
          puffGrad.addColorStop(1, '#1B5E20');
          ctx.fillStyle = puffGrad;
          ctx.beginPath(); ctx.arc(pf.x, pf.y, pf.r, 0, TAU); ctx.fill();
        }
        ctx.restore();
        return;
      }
      case 'needle': {
        ctx.lineWidth = Math.max(2, w);
        ctx.beginPath();
        const halfL = l / 2;
        ctx.moveTo(-halfL, 0);
        ctx.quadraticCurveTo(0, w * 1.5, halfL, 0);
        ctx.stroke();
        for (let k = -2; k <= 2; k++) {
          const kx = k * (halfL / 2.5);
          ctx.beginPath(); ctx.ellipse(kx, Math.sin(k) * 4, 6, 3, Math.PI / 4, 0, TAU); ctx.fill();
        }
        return;
      }
      case 'striped-plane':
      case 'parallelogram':
      case 'trapezoid': {
        const s = l / 2;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(w * 1.2, 0, 0, s);
        ctx.quadraticCurveTo(-w * 1.2, 0, 0, -s);
        ctx.closePath();
        if (fill) ctx.fill(); else ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.lineTo(0, s * 0.8); ctx.stroke();
        return;
      }
    }
  }

  if (levelId === 4) { // ASCII Art Theme
    ctx.save();
    ctx.font = `900 ${Math.max(10, Math.round(l * 0.18))}px "Courier New", Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    switch (el.kind) {
      case 'grid-cross':
      case 'frame-box': {
        const lines = [
          '/T----======----=)',
          '[ \\ (0)   \\~  \\-==)',
          '\\---/ )JJ~~~ \\)'
        ];
        lines.forEach((line, idx) => {
          ctx.fillText(line, 0, (idx - 1) * 14);
        });
        ctx.restore();
        return;
      }
      case 'disc': {
        const lines = [
          '  .---.  ',
          ' ./     \\. ',
          '| (ASCII) |',
          ' \'\\     /\' ',
          '  \'---\'  '
        ];
        lines.forEach((line, idx) => {
          ctx.fillText(line, 0, (idx - 2) * 12);
        });
        ctx.restore();
        return;
      }
      case 'ring-disc': {
        ctx.fillText('(( ( O ) ))', 0, 0);
        ctx.restore();
        return;
      }
      case 'plane':
      case 'bar':
      default: {
        ctx.fillText('[==================]', 0, 0);
        ctx.restore();
        return;
      }
    }
  }

  if (levelId === 5) { // Unicode Art Matrix Theme
    ctx.save();
    ctx.font = `900 ${Math.max(11, Math.round(l * 0.2))}px "Segoe UI Symbol", "Arial Unicode MS", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    switch (el.kind) {
      case 'grid-cross':
      case 'frame-box': {
        const lines = [
          '░▒▓█ ◈ ☯ ◈ █▓▒░',
          '╭──────────────╮',
          '│ ✦  ☸  ⚛  ✹ │',
          '╰──────────────╯'
        ];
        lines.forEach((line, idx) => {
          ctx.fillText(line, 0, (idx - 1.5) * 15);
        });
        ctx.restore();
        return;
      }
      case 'disc': {
        const lines = [
          '  ╭───╮  ',
          ' │  ☸  │ ',
          '  ╰───╯  '
        ];
        lines.forEach((line, idx) => {
          ctx.fillText(line, 0, (idx - 1) * 14);
        });
        ctx.restore();
        return;
      }
      case 'ring-disc': {
        ctx.fillText('⊙ ⊚ ⊛ ☯ ⊛ ⊚ ⊙', 0, 0);
        ctx.restore();
        return;
      }
      case 'plane':
      case 'bar':
      default: {
        ctx.fillText('╞══════════════════╡', 0, 0);
        ctx.restore();
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
    const s = Math.max(10, d.size * 0.7);
    switch (d.kind) {
      case 'cross': { // Vector Leaf Frond
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.3);
        ctx.quadraticCurveTo(s * 0.9, 0, 0, s * 1.3);
        ctx.quadraticCurveTo(-s * 0.9, 0, 0, -s * 1.3);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.stroke();
        break;
      }
      case 'arc': { // Vector 5-Petal Sakura Blossom
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
          const a = p * (TAU / 5);
          const px = Math.cos(a) * s * 0.75, py = Math.sin(a) * s * 0.75;
          ctx.arc(px, py, s * 0.4, 0, TAU);
        }
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, TAU); ctx.fill();
        break;
      }
      case 'outline': { // Vector 3-Leaf Clover Shamrock
        for (let p = 0; p < 3; p++) {
          const a = p * (TAU / 3) - Math.PI / 2;
          const px = Math.cos(a) * s * 0.6, py = Math.sin(a) * s * 0.6;
          ctx.beginPath(); ctx.arc(px, py, s * 0.45, 0, TAU); ctx.fill(); ctx.stroke();
        }
        ctx.fillRect(-1.5, 0, 3, s * 1.1);
        break;
      }
      case 'dots': { // Vector Dewdrop Cluster
        for (let i = 0; i < 4; i++) {
          ctx.beginPath(); ctx.arc(i * 12 - 18, 0, 3.5, 0, TAU); ctx.fill();
        }
        break;
      }
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
