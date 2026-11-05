// The field: a seeded, winding আল with its puddles, goats, bamboo bridges, wind and gusts. Pure and deterministic.
// Board units: 360 wide; the field scrolls down and the walker stays at one height, moving sideways only.
import { makeRng, pick } from "../../../shared/game-core";
import type { LevelSpec } from "./levels";

export const W = 360;
/** The board is 440 tall at least. A taller stage adds sky, never ridge: the walker always sees AHEAD px of it, on every phone. */
export const MIN_H = 440;
export const MAX_H = 780;
/** Distance from the bottom of the board to the walker's feet, and from the feet up to the horizon. */
export const FEET_UP = 88;
export const AHEAD = 280;
/** Where the far village and the sky begin on a board `bh` tall. */
export const horizonFor = (bh: number) => Math.max(48, bh - FEET_UP - AHEAD);
export const CX = W / 2;
export const PX_PER_M = 20;
/** The feet's half-width when touching water or a goat. */
export const FOOT = 3;
/** Obstacles start after the first 10 m, so the opening seconds are only the ridge. */
export const FIRST_OBSTACLE = 200;
/** At least this much ridge between two obstacles: room to cross from one side to the other. */
export const MIN_GAP = 150;
/** A gust's strongest push, px per second. */
export const GUST_PUSH = 30;
/** The edge's pull starts here, as a share of the ridge's half-width. */
export const EDGE_FROM = 0.65;

export type Wave = { a: number; k: number; phase: number };
export type Obstacle = { kind: "puddle" | "goat" | "bridge"; d: number; len: number; side: -1 | 1; lo: number; hi: number };
export type Decor = { kind: "bok" | "pond"; d: number; x: number; r: number; flip: boolean };
export type Gust = { d: number; len: number; push: number };
export type Field = { spec: LevelSpec; seed: number; length: number; path: Wave[]; wind: Wave[]; gusts: Gust[]; obstacles: Obstacle[]; decor: Decor[] };

/** Why feet slipped, as the number the step stores. */
export const SLIP_NONE = 0, SLIP_MUD = 1, SLIP_PUDDLE = 2, SLIP_GOAT = 3, SLIP_BRIDGE = 4;

const TAU = Math.PI * 2;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const smooth = (u: number) => { const t = clamp(u, 0, 1); return t * t * (3 - 2 * t); };

/** Half the width of a bamboo bridge's safe strip. */
export const bridgeHalf = (half: number) => Math.max(9, Math.round(half * 0.5));

/**
 * A field from its spec and seed: the same pair always gives the same ridge, obstacles, birds and wind.
 * The old links' fields come from `legacySpec`, whose new fields are all zero, and then draw exactly the old random numbers.
 */
export function makeField(spec: LevelSpec, seed: number): Field {
  const rng = makeRng(seed * 31 + spec.level), p = (spec.level - 1) / 19;
  const length = spec.metres * PX_PER_M;
  // Three bends: a slow drift across the field, the main curve, and a small wiggle. Their slopes add up to `bend` exactly.
  const main = (820 - 440 * p) * (0.9 + 0.2 * rng());
  const path = ([[2000 * (0.9 + 0.2 * rng()), 0.25], [main, 0.55], [main * 0.47, 0.2]] as const).map(([wavelength, share]) => {
    const k = TAU / wavelength;
    return { a: (spec.bend * share) / k, k, phase: rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2 };
  });
  const gust = 560 * (0.9 + 0.2 * rng());
  const wind = spec.wind ? [{ a: spec.wind * 0.75, k: TAU / gust, phase: rng() * TAU }, { a: spec.wind * 0.25, k: TAU / (gust * 0.41), phase: rng() * TAU }] : [];
  const field: Field = { spec, seed, length, path, wind, gusts: [], obstacles: [], decor: [] };

  // Obstacles: evenly spaced slots with a seeded nudge, each on a seeded side, never closer than MIN_GAP.
  const kinds: Obstacle["kind"][] = [...Array(spec.puddles).fill("puddle"), ...Array(spec.goats).fill("goat"), ...Array(spec.bridges).fill("bridge")];
  for (let i = kinds.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
  const spacing = (length - 60 - FIRST_OBSTACLE) / Math.max(1, kinds.length);
  kinds.forEach((kind, index) => {
    const len = kind === "puddle" ? 44 + pick(rng, 17) : kind === "bridge" ? 64 + pick(rng, 17) : 34;
    const d = FIRST_OBSTACLE + spacing * index + rng() * Math.max(0, spacing - len - MIN_GAP);
    const side: -1 | 1 = rng() < 0.5 ? -1 : 1, half = spec.half;
    if (kind === "bridge") { const safe = bridgeHalf(half); field.obstacles.push({ kind, d, len, side, lo: -safe, hi: safe }); return; }
    // Puddles cover one side from just past the middle; goats stand on one side of it.
    const near = kind === "puddle" ? half * (0.08 + 0.22 * rng()) : half * 0.3 * rng();
    const far = kind === "puddle" ? half + 8 : near + 16;
    field.obstacles.push({ kind, d, len, side, lo: side > 0 ? near : -far, hi: side > 0 ? far : -near });
  });

  // Decoration only: egrets standing in the paddy and a pond now and then (more by the pond-side fields).
  for (let d = 90 + rng() * 120; d < length + 500; d += 120 + rng() * 140) {
    const side = rng() < 0.5 ? -1 : 1, centre = centreAt(field, d);
    let x = clamp(centre + side * (spec.half + 26 + rng() * 90), 14, W - 14);
    if (Math.abs(x - centre) < spec.half + 18) x = clamp(centre - side * (spec.half + 40), 14, W - 14);
    field.decor.push({ kind: "bok", d, x, r: 0, flip: rng() < 0.5 });
  }
  for (let d = 260 + rng() * 200; d < length + 500; d += (spec.scene === "noon" ? 420 : 820) + rng() * 300) {
    const r = 26 + rng() * 16, side = rng() < 0.5 ? -1 : 1;
    const x = centreAt(field, d) + side * (spec.half + 50 + r + rng() * 50);
    const clear = [-r, 0, r].every(dy => Math.abs(x - centreAt(field, d + dy)) - r * 1.3 >= spec.half + 10);
    if (clear) field.decor.push({ kind: "pond", d, x, r, flip: side > 0 });
  }
  field.decor.sort((a, b) => a.d - b.d);

  // Gusts come from their own random numbers, so adding them never moves a ridge or an obstacle.
  if (spec.gusts) {
    const own = makeRng(seed * 17 + spec.level * 101 + 7), step = (length - 560) / spec.gusts;
    for (let i = 0; i < spec.gusts; i++) {
      const len = 110 + own() * 40;
      field.gusts.push({ d: 300 + step * i + own() * Math.max(0, step - len - 80), len, push: own() < 0.5 ? -GUST_PUSH : GUST_PUSH });
    }
  }
  return field;
}

/** The middle of the ridge at distance `d`. It starts at the board's centre and bends gently from there. */
export function centreAt(field: Field, d: number) {
  let x = CX;
  for (let i = 0; i < field.path.length; i++) { const wave = field.path[i]; x += wave.a * (Math.sin(wave.k * d + wave.phase) - Math.sin(wave.phase)); }
  return x;
}

/** How fast the ridge moves sideways per px walked (its slope). Never steeper than the level's `bend`. */
export function slopeAt(field: Field, d: number) {
  let slope = 0;
  for (let i = 0; i < field.path.length; i++) { const wave = field.path[i]; slope += wave.a * wave.k * Math.cos(wave.k * d + wave.phase); }
  return slope;
}

/** The steady wind's sideways push at `d` in px per second (+ is to the right). It fades in after the first few metres. */
export function steadyAt(field: Field, d: number) {
  if (!field.wind.length) return 0;
  let push = 0;
  for (let i = 0; i < field.wind.length; i++) { const wave = field.wind[i]; push += wave.a * Math.sin(wave.k * d + wave.phase); }
  return push * smooth((d - 140) / 300);
}

/** The gusts' push at `d`: a half sine over each gust's length. */
export function gustAt(field: Field, d: number) {
  let push = 0;
  for (let i = 0; i < field.gusts.length; i++) {
    const gust = field.gusts[i];
    if (d > gust.d && d < gust.d + gust.len) push += gust.push * Math.sin(((d - gust.d) / gust.len) * Math.PI);
  }
  return push;
}

/** All the sideways push at `d`: steady wind and gusts. */
export const windAt = (field: Field, d: number) => steadyAt(field, d) + gustAt(field, d);

/** The obstacle under the feet at `d`, widened by `margin` px before and after. */
export function obstacleAt(field: Field, d: number, margin = 0) {
  for (let i = 0; i < field.obstacles.length; i++) { const o = field.obstacles[i]; if (d >= o.d - margin && d <= o.d + o.len + margin) return o; }
  return null;
}

/** Where to stand at `d`, measured from the ridge's middle: the middle, or the dry side's middle beside a puddle or goat. */
export function safeOffset(field: Field, d: number, margin = 12) {
  const obstacle = obstacleAt(field, d, margin), half = field.spec.half;
  if (!obstacle || obstacle.kind === "bridge") return 0;
  return obstacle.side > 0 ? (-half + obstacle.lo - FOOT) / 2 : (obstacle.hi + FOOT + half) / 2;
}

/** Why the feet at `offset` from the middle would slip at `d` (a SLIP_* number), or SLIP_NONE when they're fine. */
export function slipAt(field: Field, d: number, offset: number) {
  if (Math.abs(offset) > field.spec.half) return SLIP_MUD;
  const o = obstacleAt(field, d);
  if (!o) return SLIP_NONE;
  if (o.kind === "bridge") return Math.abs(offset) > o.hi ? SLIP_BRIDGE : SLIP_NONE;
  if (offset + FOOT > o.lo && offset - FOOT < o.hi) return o.kind === "puddle" ? SLIP_PUDDLE : SLIP_GOAT;
  return SLIP_NONE;
}
