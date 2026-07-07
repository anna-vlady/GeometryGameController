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
  switch (el.kind) {
    case 'plane':
    case 'bar':
      if (fill) ctx.fillRect(-el.len / 2, -el.wid / 2, el.len, el.wid);
      else ctx.strokeRect(-el.len / 2, -el.wid / 2, el.len, el.wid);
      break;
    case 'disc': {
      const r = el.len / 2;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
      if (fill) ctx.fill(); else { ctx.lineWidth = Math.max(2, r * 0.3); ctx.stroke(); }
      break;
    }
    case 'wedge': {
      const s = el.len / 2;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.2); ctx.lineTo(s, s * 0.8); ctx.lineTo(-s, s * 0.8);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'needle':
      ctx.lineWidth = Math.max(1.5, el.wid);
      ctx.beginPath(); ctx.moveTo(-el.len / 2, 0); ctx.lineTo(el.len / 2, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(el.len / 2, 0, 2.4, 0, TAU); ctx.fill();
      break;
  }
}

export function drawDecor(ctx: CanvasRenderingContext2D, d: any) {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(d.rot);
  ctx.fillStyle = 'rgba(30,27,22,0.28)';
  ctx.strokeStyle = 'rgba(30,27,22,0.28)';
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
