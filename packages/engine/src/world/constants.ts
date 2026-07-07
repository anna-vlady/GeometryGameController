export const WORLD_SEED = ((parseInt(new URLSearchParams(location.search).get('seed') || "137", 10) || 137) >>> 0);

// ---------- палитра ----------
export const PAPER  = '#E7DFCC';
export const INK    = '#1E1B16';
export const RED    = '#BF3B2B';
export const OCHRE  = '#C99B3F';
export const BLUE   = '#3F5666';
export const CREAM  = '#F2EBD9';
export const PAPER_LIGHT = [241, 235, 222];
export const PAPER_DARK = [217, 205, 178];
export const ENERGY_COLOR = [RED, INK, OCHRE, BLUE];

/* ════════════════════════════════════════════════════════════════
   МУЗЫКАЛЬНАЯ ТЕОРИЯ — Мессиан
   ════════════════════════════════════════════════════════════════ */
export const ROOT = 36.708;                       // D1 — корень мира
export const MODES = [
  [0, 1, 3, 4, 6, 7, 9, 10],               // лад 2 (октатоника) — красный
  [0, 2, 3, 4, 6, 7, 8, 10, 11],           // лад 3 — чернильный
  [0, 2, 4, 5, 6, 8, 10, 11],              // лад 6 — охряный
  [0, 1, 5, 6, 7, 11]                      // лад 5 — синий (птицы, тритоны)
];
export const OCT    = [2, 1, 3, 4];               // регистр энергии
export const VOWELS = [[600, 1040], [270, 720], [430, 1900], [320, 2350]]; // форманты F1,F2
export const DRIVE  = [2.4, 1.6, 2.0, 1.2];       // перегруз волнообразователя

// необратимый ритм: палиндром с добавленными длительностями (1.5)
export const DUR_POOL = [1, 1, 1.5, 2, 3];
export const RING_RATIO = [1, 1.5, 2, 3];          // часовые передачи: внешние медленнее
