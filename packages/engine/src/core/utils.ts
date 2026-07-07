// ---------- сеяная случайность ----------
export function hash2(x: number, y: number, salt: number, worldSeed: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 2654435761 + worldSeed * 1597334677) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp01 = (x: number) => x < 0 ? 0 : x > 1 ? 1 : x;

export function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export function mixColor(a: number[], b: number[], t: number) {
  return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' +
                  Math.round(a[1] + (b[1] - a[1]) * t) + ',' +
                  Math.round(a[2] + (b[2] - a[2]) * t) + ')';
}
