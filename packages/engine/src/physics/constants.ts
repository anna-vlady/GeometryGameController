export const MAXTANK = 12;
export const SPAWN = { x: 450, y: 800 };
export const SUMMIT_Y = SPAWN.y - 51650;   // 5165 м × 10 px/м = вершина Арарата
export const FLOOR_Y = SPAWN.y;             // пол: нельзя падать ниже 0 м
export const ALTITUDE_MAX = 5165;           // метры до вершины
export const ACCEL = 950;
export const MAX_SPEED = 520;
export const FUEL_COST = 2.1;
export const SINGLE_BOOST_DUR = 0.7;    // 0.6–0.8с при нажатии B (PON)
export const RHYTHM_BOOST_DUR = 1.6;    // 1.5–1.7с при выбивании PATA PATA PATA PON
export const MAGNET_RHYTHM_MULT = 2.7;  // ×2.7 радиус магнетизма при PON PON PATA PATA
export const TETHER_MAX_DIST = 3960;    // предел расстояния разрыва связи между игроками (3960px = 3x 1320px)
export const TETHER_SPRING_K = 2.4;     // мягкая разрывная пружина связи
export const COMPOSITE_CORE_R = 28;     // радиус вращения дуэта ядер составного игрока
export let G_GRAV = 78000;
export let GRAV_CAP = 1150;
export let GRAV_SWIRL = 0.42;
export let CENTER_K = 1.15;
export let RADIAL_DAMP = 1.35;
export let DRAG_COAST = 0.42;
export let DRAG_THRUST = 1.7;
export let CAP_THRESH = 150;
export let REL_THRESH = 62;
export let SWITCH_FAC = 1.4;
export let RHYTHM_TOLERANCE = 0.22; // 22% tolerance for relative ITIs

export function updatePhysicsParams(params: Partial<{
  G_GRAV: number; GRAV_CAP: number; GRAV_SWIRL: number; CENTER_K: number;
  RADIAL_DAMP: number; DRAG_COAST: number; DRAG_THRUST: number;
  CAP_THRESH: number; REL_THRESH: number; SWITCH_FAC: number;
  RHYTHM_TOLERANCE: number;
}>) {
  if (params.G_GRAV !== undefined) G_GRAV = params.G_GRAV;
  if (params.GRAV_CAP !== undefined) GRAV_CAP = params.GRAV_CAP;
  if (params.GRAV_SWIRL !== undefined) GRAV_SWIRL = params.GRAV_SWIRL;
  if (params.CENTER_K !== undefined) CENTER_K = params.CENTER_K;
  if (params.RADIAL_DAMP !== undefined) RADIAL_DAMP = params.RADIAL_DAMP;
  if (params.DRAG_COAST !== undefined) DRAG_COAST = params.DRAG_COAST;
  if (params.DRAG_THRUST !== undefined) DRAG_THRUST = params.DRAG_THRUST;
  if (params.CAP_THRESH !== undefined) CAP_THRESH = params.CAP_THRESH;
  if (params.REL_THRESH !== undefined) REL_THRESH = params.REL_THRESH;
  if (params.SWITCH_FAC !== undefined) SWITCH_FAC = params.SWITCH_FAC;
  if (params.RHYTHM_TOLERANCE !== undefined) RHYTHM_TOLERANCE = params.RHYTHM_TOLERANCE;
}
