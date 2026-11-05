// The shuttle's flight: gravity plus quadratic air drag against the moving air, so it leaves the racket fast, slows hard and
// falls almost straight down, and the wind carries it most while it is slow. Pure and deterministic: a flight is integrated
// once, when it is struck, into a preallocated path (one point per game step), and the step only walks along it.
// Side view of the গলি in board units: you on the left, the rival on the right, y grows downwards.

export const W = 360, H = 400;
export const GROUND = 356;
export const NET_X = 180, NET_TOP = 250, NET_BOTTOM = 312;
/** The chalk back lines: a shuttle landing past one is out. */
export const BACK_L = 22, BACK_R = W - 22;
/** Contact heights: overhead (a high ball, which can be smashed) and underarm (a low ball). */
export const HIGH_Y = 205, LOW_Y = 272;
export const YOU_HOME = 96, RIVAL_HOME = W - 96;

/** Game step and the integration substeps inside it. */
export const DT = 1 / 60;
const SUB = 4, H_DT = DT / SUB;
/** Gravity, and the drag constant for a terminal speed of 340 units a second. */
export const G = 900;
export const TERMINAL = 340;
const K = G / (TERMINAL * TERMINAL);
/** The longest flight a path can hold (seconds × steps). */
export const MAX_POINTS = 60 * 5;

/** Wind along the গলি (units a second, + blows towards the rival), as a function of match time. Gusts swell and fade. */
export type Air = {
  base: number;
  /** Gusts: start time, length, strength (added to base). Up to 64, filled by the level. */
  gustAt: Float32Array; gustLen: Float32Array; gustPow: Float32Array; gusts: number;
};
export const makeAir = (): Air => ({ base: 0, gustAt: new Float32Array(64), gustLen: new Float32Array(64), gustPow: new Float32Array(64), gusts: 0 });

export function windAt(air: Air, t: number) {
  let wind = air.base;
  for (let i = 0; i < air.gusts; i++) {
    const u = (t - air.gustAt[i]) / air.gustLen[i];
    if (u > 0 && u < 1) wind += air.gustPow[i] * Math.sin(Math.PI * u) * Math.sin(Math.PI * u);
  }
  return wind;
}

/** A shuttle's whole path, one point per step, and what happens on it. */
export type Path = {
  x: Float32Array; y: Float32Array;
  /** Points filled. The last one is on the ground (or at the net). */
  n: number;
  /** Who struck it: 0 you, 1 the rival. */
  from: number;
  /** Step index where it meets the net (−1 when it clears), and where it touches the ground. */
  netAt: number; landAt: number;
  landX: number;
  /** It lands past the far back line. */
  out: boolean;
  /** Where the receiver meets it: step index (−1: nowhere, it falls short or into the net), and whether overhead. */
  contactAt: number; high: boolean;
  /** The highest point (smallest y). */
  apex: number;
};
export const makePath = (): Path => ({ x: new Float32Array(MAX_POINTS), y: new Float32Array(MAX_POINTS), n: 0, from: 0, netAt: -1, landAt: -1, landX: 0, out: false, contactAt: -1, high: false, apex: 0 });

/**
 * Integrates a shuttle struck at (x0, y0) with velocity (vx, vy) at match time t0, into `p`. With `air` null it flies in still
 * air (used by the aim solver). Stops on the ground; a shuttle meeting the net drops straight down beside it.
 */
export function fly(p: Path, from: number, x0: number, y0: number, vx: number, vy: number, t0: number, air: Air | null, margin = 0) {
  p.from = from; p.netAt = -1; p.landAt = -1; p.out = false; p.contactAt = -1; p.high = false; p.apex = y0;
  let x = x0, y = y0, n = 0, crossed = false, netted = false;
  const dir = from === 0 ? 1 : -1;
  p.x[0] = x; p.y[0] = y; n = 1;
  for (; n < MAX_POINTS; n++) {
    for (let s = 0; s < SUB; s++) {
      // The walls shelter the গলি: the wind blows full above the rooftops' height and only a little near the ground.
      const shelter = y < 120 ? 1 : y > 273 ? 0.15 : (300 - y) / 180;
      const w = air ? windAt(air, t0 + (n * SUB + s) * H_DT) * shelter : 0;
      const rx = vx - w, speed = Math.sqrt(rx * rx + vy * vy);
      vx -= K * speed * rx * H_DT;
      vy += (G - K * speed * vy) * H_DT;
      const px = x;
      x += vx * H_DT; y += vy * H_DT;
      if (!crossed && !netted && (px - NET_X) * dir < 0 && (x - NET_X) * dir >= 0) {
        if (y > NET_TOP - margin) { netted = true; x = NET_X - dir * 3; vx = -dir * 8; vy = Math.max(20, vy * 0.2); }
        else crossed = true;
      }
      if (y >= GROUND) { y = GROUND; break; }
    }
    p.x[n] = x; p.y[n] = y;
    if (y < p.apex) p.apex = y;
    if (netted && p.netAt < 0) p.netAt = n;
    if (y >= GROUND) { n++; break; }
  }
  p.n = n;
  p.landAt = n - 1;
  p.landX = p.x[n - 1];
  if (p.netAt >= 0) return p;
  // Landed on the far side? Then it is in or out, and the receiver meets it on the way down: overhead if it comes down
  // through the overhead height on their side, otherwise underarm.
  // Falling back on the striker's own side (it never got over): a fault, the same as the net.
  const far = (p.landX - NET_X) * dir > 0;
  if (!far) { p.netAt = n - 1; return p; }
  p.out = from === 0 ? p.landX > BACK_R : p.landX < BACK_L;
  for (let i = 1; i < n; i++) {
    const side = (p.x[i] - NET_X) * dir > 6;
    if (!side) continue;
    if (p.y[i - 1] < HIGH_Y && p.y[i] >= HIGH_Y) { p.contactAt = i; p.high = true; break; }
    if (p.y[i - 1] < LOW_Y && p.y[i] >= LOW_Y) { p.contactAt = i; p.high = false; break; }
  }
  return p;
}

/** How far over the tape the aim solvers keep a shot, so a little wind or a late swing doesn't drop it into the net. */
const CLEARANCE = 14;

/** Seconds from the strike to step index `i`. */
export const timeOf = (i: number) => i * DT;

const probe = makePath();
/**
 * The launch speed that lands a shuttle struck at angle `angle` (radians above the horizontal, towards the other side) from
 * (x0, y0) at `targetX` in still air. Bisection on the speed; drag makes the range grow slowly, so it always converges.
 */
export function solveSpeed(from: number, x0: number, y0: number, angle: number, targetX: number) {
  const dir = from === 0 ? 1 : -1, cos = Math.cos(angle) * dir, sin = -Math.sin(angle);
  let low = 40, high = 4000;
  for (let i = 0; i < 26; i++) {
    const mid = (low + high) / 2;
    fly(probe, from, x0, y0, mid * cos, mid * sin, 0, null, CLEARANCE);
    const reach = (probe.landX - x0) * dir;
    if (probe.netAt >= 0 || reach < (targetX - x0) * dir) low = mid; else high = mid;
  }
  // The long side of the bracket always clears the tape, even when the target itself is too short to reach over it.
  return high;
}

/** Strikes a shuttle at `angle` so it would land at `targetX` in still air, then flies it in the real air from `t0`. */
export function strike(p: Path, from: number, x0: number, y0: number, angle: number, targetX: number, t0: number, air: Air | null, speedScale = 1) {
  const speed = solveSpeed(from, x0, y0, angle, targetX) * speedScale, dir = from === 0 ? 1 : -1;
  return fly(p, from, x0, y0, speed * Math.cos(angle) * dir, -speed * Math.sin(angle), t0, air);
}

/**
 * A smash: struck as hard as `speed`, angled down just enough to land at `targetX` in still air (bisection on the angle,
 * between 40° down and 10° up). From too low or too far it can't clear the net, and goes into it.
 */
export function smash(p: Path, from: number, x0: number, y0: number, speed: number, targetX: number, t0: number, air: Air | null) {
  const dir = from === 0 ? 1 : -1;
  let low = -0.7, high = 0.17;
  for (let i = 0; i < 22; i++) {
    const mid = (low + high) / 2;
    fly(probe, from, x0, y0, speed * Math.cos(mid) * dir, -speed * Math.sin(mid), 0, null, CLEARANCE);
    if (probe.netAt >= 0 || (probe.landX - x0) * dir < (targetX - x0) * dir) low = mid; else high = mid;
  }
  const angle = high;
  return fly(p, from, x0, y0, speed * Math.cos(angle) * dir, -speed * Math.sin(angle), t0, air);
}

/** Aims for `targetX` in the real air: strikes, sees where the wind took it, and corrects the aim twice (the rival reads the wind). */
export function strikeInAir(p: Path, from: number, x0: number, y0: number, angle: number, targetX: number, t0: number, air: Air) {
  let aim = targetX;
  for (let i = 0; i < 2; i++) {
    strike(p, from, x0, y0, angle, aim, t0, air);
    if (p.netAt >= 0) break;
    aim += targetX - p.landX;
  }
  return strike(p, from, x0, y0, angle, aim, t0, air);
}

/** A smash aimed in the real air: the wind barely moves a fast shuttle, and the aim is corrected for what it does. */
export function smashInAir(p: Path, from: number, x0: number, y0: number, speed: number, targetX: number, t0: number, air: Air) {
  let aim = targetX;
  for (let i = 0; i < 2; i++) {
    smash(p, from, x0, y0, speed, aim, t0, air);
    if (p.netAt >= 0) break;
    aim += targetX - p.landX;
  }
  return smash(p, from, x0, y0, speed, aim, t0, air);
}

/** A struck shuttle with a fixed speed and angle (a smash: it is hit as hard as can be, not aimed at a spot). */
export function hammer(p: Path, from: number, x0: number, y0: number, angle: number, speed: number, t0: number, air: Air | null) {
  const dir = from === 0 ? 1 : -1;
  return fly(p, from, x0, y0, speed * Math.cos(angle) * dir, -speed * Math.sin(angle), t0, air);
}
