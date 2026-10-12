// The rules of one night: who flies in when, where each mosquito is at any moment, what a swing hits, and the stars.
// Pure and seeded (no Math.random): the same seed and night replay the same mosquitoes on every phone.
import { makeRng, pick } from "../../../shared/game-core";

/** The room, in board units. The canvas scales it to the phone's width. */
export const W = 360, H = 420;
/** The sleeper's pillow, where a mosquito on a pillow night is headed. */
export const PILLOW_X = 180, PILLOW_Y = 352;
/** The top edge of the মশারি on a net night; holes sit on it. */
export const NET_TOP = 262;
/** How far from the bat's centre a mosquito still gets zapped (a 60-unit-wide bat head). */
export const HIT_R = 30;
/** A swing that misses by less than this still says "একটুর জন্য". */
export const NEAR_R = HIT_R * 1.7;
export const MAX_BITES = 3;
export const LEVEL_COUNT = 20;
/** Seconds a mosquito takes to fly in from the window or the door. */
export const ENTER = 1;
/** No dive is ever shorter than this, however close the mosquito hovers. */
export const MIN_DIVE = 0.9;

export type Guard = "pillow" | "net";
export type Spec = {
  count: number; length: number; speed: number; loiter: readonly [number, number]; wobble: number;
  swarm: number; swarmChance: number; entries: number; guard: Guard; holes: readonly number[];
};

const COUNTS = [8, 10, 12, 13, 14, 16, 17, 18, 20, 22, 23, 24, 26, 27, 29, 30, 32, 34, 37, 40] as const;
const NET_NIGHTS = new Set([5, 8, 13, 15, 18]);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;

/** Night 1 is slow and kind; each night after adds a little speed, more mosquitoes, and now and then one new thing. */
export function specOf(level: number): Spec {
  const l = Math.min(LEVEL_COUNT, Math.max(1, Math.round(level))), k = (l - 1) / (LEVEL_COUNT - 1);
  const guard: Guard = NET_NIGHTS.has(l) ? "net" : "pillow";
  return {
    count: COUNTS[l - 1],
    length: 20 + Math.round((l - 1) * 0.8),
    speed: 38 + (l - 1) * 5.8,
    loiter: [lerp(4, 0.8, k), lerp(7, 2.4, k)],
    wobble: 6 + (l - 1),
    swarm: l < 4 ? 1 : l < 7 ? 2 : l < 10 ? 3 : l < 16 ? 4 : 5,
    swarmChance: l < 4 ? 0 : Math.min(0.55, 0.25 + (l - 4) * 0.02),
    entries: l === 1 ? 1 : l === 2 ? 2 : 3,
    guard,
    holes: guard === "pillow" ? [] : l === 5 ? [180] : [120, 240],
  };
}

/** One mosquito's whole flight, fixed when the night is made. Times are seconds from the night's start. */
export type Bug = {
  at: number; x0: number; y0: number; hx: number; hy: number; ox: number; oy: number;
  r: number; f: number; ph: number; loiter: number; tx: number; ty: number;
  sx: number; sy: number; dive: number; wob: number; wf: number; bite: number; swarm: number;
};

/** Where the hover circle puts a mosquito `s` seconds into its loiter (before the swarm offset). */
const hoverX = (b: Bug, s: number) => b.hx + Math.cos(s * b.f + b.ph) * b.r + Math.sin(s * 7.3 + b.ph * 2) * 5;
const hoverY = (b: Bug, s: number) => b.hy + Math.sin(s * b.f * 1.3 + b.ph) * b.r * 0.6 + Math.cos(s * 8.1 + b.ph) * 4;

/** Every mosquito of a night, in spawn order. Swarms share one path, each member a few units off the leader. */
export function makeBugs(level: number, seed: number): Bug[] {
  const spec = specOf(level), rng = makeRng((seed ^ Math.imul(level, 0x9e3779b1)) >>> 0), bugs: Bug[] = [];
  const sizes: number[] = [];
  for (let total = 0; total < spec.count;) {
    const size = Math.min(spec.count - total, spec.swarm > 1 && rng() < spec.swarmChance ? 2 + pick(rng, spec.swarm - 1) : 1);
    sizes.push(size); total += size;
  }
  const spacing = (spec.length - 3) / sizes.length;
  sizes.forEach((size, unit) => {
    const at = Math.max(0.5, 0.5 + unit * spacing + (rng() - 0.5) * spacing * 0.4);
    const door = pick(rng, spec.entries);
    // 0 the window, 1 the half-open door on the left, 2 the ঘুলঘুলি high on the right wall (see art.ts).
    const x0 = door === 0 ? 46 + rng() * 52 : door === 1 ? -14 : 330 + rng() * 14;
    const y0 = door === 0 ? 60 + rng() * 52 : door === 1 ? 170 + rng() * 100 : 98 + rng() * 14;
    const hx = 60 + rng() * 240, hy = 74 + rng() * (spec.guard === "net" ? 120 : 150);
    const r = 14 + rng() * 22, f = 1.6 + rng() * 1.6, ph = rng() * Math.PI * 2;
    const loiter = lerp(spec.loiter[0], spec.loiter[1], rng());
    const hole = spec.guard === "net" ? spec.holes[pick(rng, spec.holes.length)] : 0;
    const tx = spec.guard === "net" ? hole : PILLOW_X, ty = spec.guard === "net" ? NET_TOP : PILLOW_Y - 8;
    const wob = spec.wobble * (0.6 + rng() * 0.6), wf = 3 + rng() * 3;
    for (let member = 0; member < size; member++) {
      // A tight swarm: one bat swing at its middle catches them all.
      const angle = (member / size) * Math.PI * 2 + ph, spread = member === 0 ? 0 : 9 + (member % 2) * 5;
      const bug: Bug = { at: at + member * 0.08, x0, y0, hx, hy, ox: Math.cos(angle) * spread, oy: Math.sin(angle) * spread * 0.7, r, f, ph, loiter, tx, ty, sx: 0, sy: 0, dive: 0, wob, wf, bite: 0, swarm: size > 1 ? unit : -1 };
      bug.sx = hoverX(bug, loiter) + bug.ox; bug.sy = hoverY(bug, loiter) + bug.oy;
      bug.dive = Math.max(MIN_DIVE, Math.hypot(tx - bug.sx, ty - bug.sy) / spec.speed);
      bug.bite = bug.at + ENTER + loiter + bug.dive;
      bugs.push(bug);
    }
  });
  return bugs;
}

/** 0 not yet in, 1 flying, 2 zapped, 3 bit and gone, 4 flew off at dawn. */
export const WAIT = 0, FLY = 1, ZAPPED = 2, BIT = 3, GONE = 4;

export type Night = {
  level: number; seed: number; spec: Spec; bugs: Bug[];
  state: Uint8Array; x: Float32Array; y: Float32Array; px: Float32Array; ended: Float32Array; diving: Uint8Array;
  t: number; zaps: number; bites: number; combo: number; bestCombo: number; lastAt: number;
  over: "" | "won" | "lost";
};

export function makeNight(level: number, seed: number): Night {
  const bugs = makeBugs(level, seed), n = bugs.length;
  return {
    level, seed, spec: specOf(level), bugs,
    state: new Uint8Array(n), x: new Float32Array(n), y: new Float32Array(n), px: new Float32Array(n), ended: new Float32Array(n), diving: new Uint8Array(n),
    t: 0, zaps: 0, bites: 0, combo: 0, bestCombo: 0, lastAt: n ? bugs[n - 1].at : 0, over: "",
  };
}

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/** Puts mosquito `i` where it is at the night's current time. No allocation: this runs every step for every mosquito. */
function place(night: Night, i: number) {
  const b = night.bugs[i], tau = night.t - b.at;
  night.px[i] = night.x[i];
  if (tau < ENTER) {
    const p = easeOut(Math.max(0, tau) / ENTER), hx = hoverX(b, 0) + b.ox, hy = hoverY(b, 0) + b.oy;
    night.x[i] = b.x0 + (hx - b.x0) * p; night.y[i] = b.y0 + (hy - b.y0) * p; night.diving[i] = 0;
    return;
  }
  const s = tau - ENTER;
  if (s < b.loiter) { night.x[i] = hoverX(b, s) + b.ox; night.y[i] = hoverY(b, s) + b.oy; night.diving[i] = 0; return; }
  const d = s - b.loiter, p = Math.min(1, d / b.dive), dx = b.tx - b.sx, dy = b.ty - b.sy, length = Math.hypot(dx, dy) || 1;
  // A zigzag across the line of flight that settles as it nears the pillow.
  const side = Math.sin(d * b.wf + b.ph) * b.wob * (1 - p);
  night.x[i] = b.sx + dx * p - (dy / length) * side;
  night.y[i] = b.sy + dy * p + (dx / length) * side;
  night.diving[i] = 1;
}

/** Advances the night by `dt` seconds. Returns how many mosquitoes bit during this step (0 almost always). */
export function step(night: Night, dt: number) {
  if (night.over) return 0;
  night.t += dt;
  const n = night.bugs.length;
  let bit = 0, flying = 0;
  for (let i = 0; i < n; i++) {
    const s = night.state[i];
    if (s === WAIT && night.t >= night.bugs[i].at) { night.state[i] = FLY; place(night, i); night.px[i] = night.x[i]; }
    if (night.state[i] !== FLY) continue;
    if (night.t >= night.bugs[i].bite) {
      night.state[i] = BIT; night.ended[i] = night.t; night.x[i] = night.bugs[i].tx; night.y[i] = night.bugs[i].ty;
      night.bites++; bit++; night.combo = 0;
      continue;
    }
    place(night, i);
    flying++;
  }
  if (night.bites >= MAX_BITES) { night.over = "lost"; return bit; }
  // Dawn: at the night's length, or as soon as the last mosquito is done with.
  if (night.t >= night.spec.length || (night.t > night.lastAt && flying === 0)) {
    for (let i = 0; i < n; i++) if (night.state[i] === FLY || night.state[i] === WAIT) { night.state[i] = GONE; night.ended[i] = night.t; }
    night.over = "won";
  }
  return bit;
}

export type Swing = { hits: number; near: boolean };

/** A bat swing at (x, y): zaps every flying mosquito within reach. Hits build the streak; a miss ends it. */
export function swing(night: Night, x: number, y: number): Swing {
  if (night.over) return { hits: 0, near: false };
  let hits = 0, nearest = Infinity;
  for (let i = 0; i < night.bugs.length; i++) {
    if (night.state[i] !== FLY) continue;
    const d = Math.hypot(night.x[i] - x, night.y[i] - y);
    if (d <= HIT_R) { night.state[i] = ZAPPED; night.ended[i] = night.t; hits++; }
    else nearest = Math.min(nearest, d);
  }
  night.zaps += hits;
  night.combo = hits ? night.combo + hits : 0;
  night.bestCombo = Math.max(night.bestCombo, night.combo);
  return { hits, near: !hits && nearest <= NEAR_R };
}

/** The flying mosquito closest to what it's after (index and distance), for the whine and the "পিন-পিন". -1 when none. */
export function closest(night: Night) {
  let best = -1, distance = Infinity;
  for (let i = 0; i < night.bugs.length; i++) {
    if (night.state[i] !== FLY) continue;
    const d = Math.hypot(night.x[i] - night.bugs[i].tx, night.y[i] - night.bugs[i].ty);
    if (d < distance) { distance = d; best = i; }
  }
  return { index: best, distance };
}

/** Zaps for the second star: three in four of the night's mosquitoes. */
export const needZaps = (level: number) => Math.ceil(specOf(level).count * 0.75);

/** ★ the night is over with fewer than 3 bites · ★ three in four zapped · ★ not one bite. 0 for a lost night. */
export function starsOf(level: number, zaps: number, bites: number) {
  if (bites >= MAX_BITES) return 0;
  return 1 + (zaps >= needZaps(level) ? 1 : 0) + (bites === 0 ? 1 : 0);
}

/** Seconds left until dawn, rounded up, for the HUD. */
export const toDawn = (night: Night) => Math.max(0, Math.ceil(night.spec.length - night.t));
