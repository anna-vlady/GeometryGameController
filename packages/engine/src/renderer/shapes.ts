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

export function drawGlyph(ctx: CanvasRenderingContext2D, i: number, s: number) {
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

export function drawBead(ctx: CanvasRenderingContext2D, dur: number, col: string) {
  ctx.fillStyle = col; ctx.strokeStyle = col;
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

export function prounShape(ctx: CanvasRenderingContext2D, el: any, fill: boolean) {
  const l = el.len || 30, w = el.wid || 10;
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

export function drawDecor(ctx: CanvasRenderingContext2D, d: any, inkCol?: string) {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(d.rot);
  const color = inkCol || 'rgba(30,27,22,0.28)';
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
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

export function drawFar(ctx: CanvasRenderingContext2D, kind: number, s: number) {
  ctx.lineWidth = 2;
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
