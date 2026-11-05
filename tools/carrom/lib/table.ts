// The board and its pieces: 18 coins, the queen and the striker on a 740 mm board, in millimetres and seconds.
// Everything lives in typed arrays made once by createWorld(); the per-step code is in physics.hot.ts.

export const BOARD = 740;
/** The wooden frame around the playing surface (drawing only). */
export const RAIL = 52;
export const TOTAL = BOARD + 2 * RAIL;
export const COIN_R = 16;
export const STRIKER_R = 21;
export const BIG_STRIKER_R = 25;
export const POCKET_R = 24;
/** The striker's centre line on the bottom baseline, and how far along it the striker may sit. */
export const BASE_Y = 622;
export const BASE_MIN = 151;
export const BASE_MAX = 589;
export const CENTRE = BOARD / 2;

/** 0–8 white, 9–17 black, 18 the queen, 19 the striker: never more objects than this. */
export const COUNT = 20;
export const PER_SIDE = 9;
export const QUEEN = 18;
export const STRIKER = 19;

export const STEP = 1 / 60;
export const SUBSTEPS = 4;
export const MAX_SPEED = 3800;
/** Sliding friction on a powdered board (mm/s²) plus a little drag, so long slides settle without crawling. */
export const FRICTION = 1000;
export const DRAG = 0.4;
/** Below this speed (mm/s) a disc stops dead: no endless creeping, no jitter. */
export const REST = 6;
export const E_DISC = 0.9;
export const E_WALL = 0.72;
/** How much a glancing hit drags the other disc sideways, and how much sideways speed survives a cushion. */
export const GRIP = 0.06;
export const WALL_GRIP = 0.94;
export const STRIKER_MASS = 2.6;
/** A safety stop. Tests check real shots settle long before it. */
export const MAX_SHOT_TIME = 20;
/** The striker may go at most this far (radians) from straight up the board: no flicking back at your own side. */
export const AIM_MAX = 1.48;

export const POCKET_X = [POCKET_R, BOARD - POCKET_R, POCKET_R, BOARD - POCKET_R] as const;
export const POCKET_Y = [POCKET_R, POCKET_R, BOARD - POCKET_R, BOARD - POCKET_R] as const;

export function createWorld() {
  const r = new Float64Array(COUNT).fill(COIN_R), m = new Float64Array(COUNT).fill(1);
  r[STRIKER] = STRIKER_R;
  m[STRIKER] = STRIKER_MASS;
  return {
    x: new Float64Array(COUNT), y: new Float64Array(COUNT), vx: new Float64Array(COUNT), vy: new Float64Array(COUNT), r, m,
    /** 1 while the disc is on the board. */
    on: new Uint8Array(COUNT),
    /** Which pocket took the disc (-1 = none) and the order discs were pocketed in, across the whole game. */
    pocket: new Int8Array(COUNT).fill(-1),
    order: new Int32Array(COUNT),
    nextOrder: 1,
    /** The discs pocketed by the current shot, in order. */
    sunk: new Int8Array(COUNT),
    sunkCount: 0,
    moving: false,
    shotTime: 0,
    /** The hardest disc-on-disc and disc-on-cushion hit (closing speed, mm/s) since the page last read and zeroed them: sound only, never physics. */
    clack: 0,
    bump: 0,
  };
}
export type World = ReturnType<typeof createWorld>;

/** Striker speed (mm/s) for a power of 0–1. The curve keeps soft shots fine-grained and still lets a full pull break the pack. */
export const speedOf = (power: number) => MAX_SPEED * Math.min(1, Math.max(0, power)) ** 1.4;
/** The power that gives this striker speed (the inverse of speedOf), clamped to 0–1. */
export const powerFor = (speed: number) => Math.min(1, Math.max(0, speed / MAX_SPEED) ** (1 / 1.4));

/** Flicks the striker along (dx, dy) with power 0–1. */
export function shoot(w: World, dx: number, dy: number, power: number) {
  const length = Math.sqrt(dx * dx + dy * dy) || 1, speed = speedOf(power);
  w.vx[STRIKER] = (dx / length) * speed;
  w.vy[STRIKER] = (dy / length) * speed;
  w.sunkCount = 0;
  w.shotTime = 0;
  w.moving = speed > 0;
}

export function kineticEnergy(w: World) {
  let total = 0;
  for (let i = 0; i < COUNT; i++) if (w.on[i]) total += 0.5 * w.m[i] * (w.vx[i] * w.vx[i] + w.vy[i] * w.vy[i]);
  return total;
}

/** True when a disc of radius `radius` at (px, py) would overlap no disc on the board (other than `skip`). */
export function isFree(w: World, px: number, py: number, radius: number, skip = -1) {
  for (let j = 0; j < COUNT; j++) {
    if (j === skip || !w.on[j]) continue;
    const dx = w.x[j] - px, dy = w.y[j] - py, rr = w.r[j] + radius;
    if (dx * dx + dy * dy < rr * rr) return false;
  }
  return true;
}

/** How far a disc sliding at `speed` goes before it stops (the same friction and drag as the step, without the substeps). */
export function slideDistance(speed: number) {
  if (speed <= 0) return 0;
  return speed / DRAG - (FRICTION / (DRAG * DRAG)) * Math.log(1 + (DRAG * speed) / FRICTION);
}

/** The speed a disc needs to slide `distance` mm (the inverse of slideDistance, by bisection). */
export function speedFor(distance: number) {
  if (distance <= 0) return 0;
  let lo = 0, hi = 2 * MAX_SPEED;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (slideDistance(mid) < distance) lo = mid; else hi = mid;
  }
  return hi;
}

/** The speed left after sliding `distance` from `speed` (0 if it stops first). */
export function speedAfter(speed: number, distance: number) {
  const total = slideDistance(speed);
  return total <= distance ? 0 : speedFor(total - distance);
}
