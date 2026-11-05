// The rocket's flight as plain numbers: a curved path from where it is to where it is going, a puff trail in a fixed ring
// of slots, and nothing else. Created once; sky.hot.ts moves it every frame without allocating. Board units, deterministic.
export const PUFFS = 28;
/** Ms between two puffs while flying, and how long a puff lives. */
export const PUFF_EVERY = 26;
export const PUFF_LIFE = 560;

export type Sky = {
  /** Where the rocket is, and which way it points (radians, 0 = up). */
  x: number; y: number; heading: number;
  /** The path: from, bend, to. */
  fx: number; fy: number; cx: number; cy: number; tx: number; ty: number;
  /** Progress 0..1 and total time in ms. */
  t: number; dur: number; flying: boolean;
  /** Trail slots: position, age 0..1 (1 = gone), size. */
  puffX: Float32Array; puffY: Float32Array; puffAge: Float32Array; puffSize: Float32Array;
  puffNext: number; since: number;
  /** Which side the next arc bends to, and a small xorshift for the puffs' jitter. */
  side: number; rng: number;
};

export function createSky(x: number, y: number): Sky {
  return {
    x, y, heading: Math.PI / 4, fx: x, fy: y, cx: x, cy: y, tx: x, ty: y, t: 1, dur: 1, flying: false,
    puffX: new Float32Array(PUFFS), puffY: new Float32Array(PUFFS), puffAge: new Float32Array(PUFFS).fill(1), puffSize: new Float32Array(PUFFS),
    puffNext: 0, since: 0, side: 1, rng: 2463534242,
  };
}

/** How long a flight takes: a short hop is quick, a long one is a swoop. */
export const flightMs = (distance: number) => Math.round(Math.max(480, Math.min(1000, 380 + distance * 1.5)));

/** Starts a flight from the rocket's current place; a new one mid-flight bends from where it is now. */
export function launch(sky: Sky, tx: number, ty: number) {
  const dx = tx - sky.x, dy = ty - sky.y, distance = Math.hypot(dx, dy);
  sky.fx = sky.x; sky.fy = sky.y; sky.tx = tx; sky.ty = ty;
  // The bend sits to one side of the middle, a quarter of the way out, and the side alternates so the path weaves.
  sky.side = -sky.side;
  sky.cx = (sky.x + tx) / 2 - dy * 0.28 * sky.side;
  sky.cy = (sky.y + ty) / 2 + dx * 0.28 * sky.side;
  sky.t = 0; sky.dur = flightMs(distance); sky.flying = distance > 0.5;
  if (!sky.flying) { sky.t = 1; sky.x = tx; sky.y = ty; }
}

/** Jump without flying (slow mode, or the first place). */
export function snap(sky: Sky, x: number, y: number) {
  sky.x = x; sky.y = y; sky.fx = x; sky.fy = y; sky.tx = x; sky.ty = y; sky.cx = x; sky.cy = y; sky.t = 1; sky.flying = false;
}

/** Is anything still moving: the rocket or a puff? */
export function moving(sky: Sky) {
  if (sky.flying) return true;
  for (let slot = 0; slot < PUFFS; slot++) if (sky.puffAge[slot] < 1) return true;
  return false;
}
