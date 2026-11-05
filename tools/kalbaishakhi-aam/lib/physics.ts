// The yard's geometry and the way things fall: shared by the old storms (legacy.ts), the new ones (gen.ts), the step and
// the drawing. No DOM, no Math.random: the same seed gives the same storm on every phone.

/** The play field in logical units; the canvas scales it to the phone and adds sky above when the stage is tall. */
export const W = 360, H = 450;
/** Where a drop breaks off the canopy, the ডালা's rim (the catch line) and the courtyard. */
export const SPAWN_Y = 132, BASKET_Y = 380, GROUND_Y = 420;
export const BASKET_HALF = 40;
/** A drop is in the ডালা when its centre crosses the rim within this distance of the ডালা's centre. */
export const CATCH = BASKET_HALF + 4;
/** The big broken branch is this much wider on each side. */
export const BIG_HALF = 26;
/** How fast a tapping thumb can surely move the ডালা (units a second). No storm ever asks for more. */
export const REACH = 230;
export const STEP = 56, MOVE_SPEED = 300, FOLLOW_SPEED = 1400;
export const BASKET_MIN = 26, BASKET_MAX = W - 26;
/** A hanging drop shakes this long before it falls, so nothing falls without warning (except in the dark). */
export const WARN = 0.6;

export const GREEN = 0, RIPE = 1, BRANCH = 2, GOLD = 3, HAIL = 4, BIG = 5;
export const POINTS = [5, 10, 0, 25, 0, 0] as const;
export const isMango = (kind: number) => kind === GREEN || kind === RIPE || kind === GOLD;
/** Twigs and the big branch cost a জান; hail knocks a mango out. */
export const isHazard = (kind: number) => kind === BRANCH || kind === BIG || kind === HAIL;
/** Half the width that hits the ডালা: the rim, plus the big branch's extra reach. */
export const reachOf = (kind: number) => kind === BIG ? CATCH + BIG_HALF : CATCH;

/** Drop states. */
export const FALLING = 0, CAUGHT = 1, MISSED = 2, HIT = 3;

export type Drop = { kind: number; t0: number; x0: number; drift: number; fall: number; spin: number; tc: number; xc: number; state: number };
/** A gust swells and fades; a swinging gust blows one way, then back the other. */
export type Gust = { at: number; length: number; strength: number; swing?: boolean };

export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
export const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const smooth = (u: number) => u * u * (3 - 2 * u);
/** Falling speeds up: a quarter-step of gravity on top of a steady start. */
const ease = (u: number) => 0.35 * u + 0.65 * u * u;
/** The fall progress at which every drop crosses the rim (ease(u) = rim depth). */
export const U_CATCH = (-0.35 + Math.sqrt(0.35 * 0.35 + 4 * 0.65 * (BASKET_Y - SPAWN_Y) / (GROUND_Y - SPAWN_Y))) / 1.3;
export const S_CATCH = smooth(U_CATCH);

export const dropY = (u: number) => SPAWN_Y + (GROUND_Y - SPAWN_Y) * ease(clamp(u, 0, 1));
export const dropX = (drop: Drop, u: number) => drop.x0 + drop.drift * smooth(clamp(u, 0, 1));
export const progress = (drop: Drop, t: number) => (t - drop.t0) / drop.fall;

/** -1 (blowing left) to 1 (right): a soft breeze, a steady wind if the storm has one, and the seeded gusts. */
export function windAt(gusts: readonly Gust[], t: number, steady = 0) {
  let wind = 0.14 * Math.sin(t * 0.7);
  if (steady) wind += steady;
  for (let index = 0; index < gusts.length; index++) {
    const gust = gusts[index], u = (t - gust.at) / gust.length;
    if (u > 0 && u < 1) wind += gust.swing ? gust.strength * Math.sin(2 * Math.PI * u) : gust.strength * Math.sin(Math.PI * u) ** 2;
  }
  return clamp(wind, -1, 1);
}

/** Puts a drop's landing inside the courtyard and its break-off point under the canopy, and works out its catch point. */
export function place(drop: Drop, xc: number) {
  drop.xc = clamp(xc, BASKET_MIN, BASKET_MAX);
  drop.x0 = drop.xc - drop.drift * S_CATCH;
  if (drop.x0 < 30 || drop.x0 > W - 30) { drop.x0 = clamp(drop.x0, 30, W - 30); drop.drift = (drop.xc - drop.x0) / S_CATCH; }
}

export type Path = { times: number[]; xs: number[] };

/** A path through every mango's catch point that never moves faster than REACH. Waypoints stop 0.7 CATCH short when they can. */
export function safePath(drops: readonly Drop[]): Path {
  const times = [0], xs = [W / 2];
  for (const drop of drops) {
    if (!isMango(drop.kind)) continue;
    const last = xs[xs.length - 1], gap = drop.xc - last;
    times.push(drop.tc);
    xs.push(Math.abs(gap) <= 0.7 * CATCH ? last : drop.xc - Math.sign(gap) * 0.7 * CATCH);
  }
  return { times, xs };
}

export function pathAt(path: Path, t: number) {
  const { times, xs } = path;
  if (t >= times[times.length - 1]) return xs[xs.length - 1];
  let index = 1;
  while (times[index] < t) index++;
  const span = times[index] - times[index - 1];
  return span <= 0 ? xs[index] : lerp(xs[index - 1], xs[index], (t - times[index - 1]) / span);
}

/** Fairness 1: pull any mango a tapping thumb couldn't reach in time toward the last one. `drops` is sorted by catch time. */
export function pullReachable(drops: Drop[]) {
  let lastT = 0, lastX = W / 2;
  for (const drop of drops) {
    if (!isMango(drop.kind)) continue;
    const allow = REACH * (drop.tc - lastT) + 0.7 * CATCH, gap = drop.xc - lastX;
    if (Math.abs(gap) > allow) place(drop, lastX + Math.sign(gap) * allow);
    const waypoint = Math.abs(drop.xc - lastX) <= 0.7 * CATCH ? lastX : drop.xc - Math.sign(drop.xc - lastX) * 0.7 * CATCH;
    lastT = drop.tc; lastX = waypoint;
  }
}
