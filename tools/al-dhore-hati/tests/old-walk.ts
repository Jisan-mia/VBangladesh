// The old game's field generator and step, kept verbatim as the reference that links without `v=2` must still open the same ridge.
// The walk itself: a seeded, winding আল, its puddles, goats and wind, and one step of the walker. Pure, so tests can play it.
// Board units: 360 × 440 px. The field scrolls down; the walker stays at WALKER_Y and only moves sideways.
import { makeRng, pick } from "../../../shared/game-core";
import { levelSpec, type LevelSpec } from "../lib/levels";

export const W = 360;
export const H = 440;
/** The sky and the far village take the top of the board; the field starts below. */
export const HORIZON = 72;
export const WALKER_Y = 352;
export const CX = W / 2;
export const PX_PER_M = 20;
/** Holding a side (button, half of the field or an arrow key) moves the feet sideways up to this fast. */
export const TAP_SPEED = 80;
/** The feet speed up over about this long when a side is held, and stop a little quicker when it's let go: a short tap is a small step. */
export const SPEED_UP = 0.12;
export const SLOW_DOWN = 0.05;
/** While dragging, the feet chase the finger at most this fast, so they never jump across the mud. */
export const DRAG_SPEED = 300;
/** The feet's half-width when touching water or a goat. */
export const FOOT = 3;
export const SLIP_TIME = 0.9;
/** After stepping back on, this many px are walked before the next slip counts. */
export const GRACE = 40;
export const STRIDE = 13;
export const MAX_SLIPS = 3;
/** A rising chime every 20 dry metres. */
export const STREAK = 20 * PX_PER_M;
/** Obstacles start after the first 10 m, so the opening seconds are only the ridge. */
export const FIRST_OBSTACLE = 200;
/** At least this much ridge between two obstacles: room to cross from one side to the other. */
export const MIN_GAP = 150;

export type Wave = { a: number; k: number; phase: number };
export type Obstacle = { kind: "puddle" | "goat"; d: number; len: number; side: -1 | 1; lo: number; hi: number };
export type Decor = { kind: "bok" | "pond"; d: number; x: number; r: number; flip: boolean };
export type Field = { spec: LevelSpec; seed: number; length: number; path: Wave[]; wind: Wave[]; obstacles: Obstacle[]; decor: Decor[] };

const TAU = Math.PI * 2;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const smooth = (u: number) => { const t = clamp(u, 0, 1); return t * t * (3 - 2 * t); };

/** A field from its level and seed: the same pair always gives the same ridge, obstacles, birds and wind. */
export function makeField(level: number, seed: number): Field {
  const spec = levelSpec(level), rng = makeRng(seed * 31 + spec.level), p = (spec.level - 1) / 19;
  const length = spec.metres * PX_PER_M;
  // Three bends: a slow drift across the field, the main curve, and a small wiggle. Their slopes add up to `bend` exactly.
  const main = (820 - 440 * p) * (0.9 + 0.2 * rng());
  const path = ([[2000 * (0.9 + 0.2 * rng()), 0.25], [main, 0.55], [main * 0.47, 0.2]] as const).map(([wavelength, share]) => {
    const k = TAU / wavelength;
    return { a: (spec.bend * share) / k, k, phase: rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2 };
  });
  const gust = 560 * (0.9 + 0.2 * rng());
  const wind = spec.wind ? [{ a: spec.wind * 0.75, k: TAU / gust, phase: rng() * TAU }, { a: spec.wind * 0.25, k: TAU / (gust * 0.41), phase: rng() * TAU }] : [];
  const field: Field = { spec, seed, length, path, wind, obstacles: [], decor: [] };

  // Obstacles: evenly spaced slots with a seeded nudge, each on a seeded side, never closer than MIN_GAP.
  const kinds: Obstacle["kind"][] = [...Array(spec.puddles).fill("puddle"), ...Array(spec.goats).fill("goat")];
  for (let i = kinds.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
  const spacing = (length - 60 - FIRST_OBSTACLE) / Math.max(1, kinds.length);
  kinds.forEach((kind, index) => {
    const len = kind === "puddle" ? 44 + pick(rng, 17) : 34;
    const d = FIRST_OBSTACLE + spacing * index + rng() * Math.max(0, spacing - len - MIN_GAP);
    const side: -1 | 1 = rng() < 0.5 ? -1 : 1, half = spec.half;
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
  return field;
}

/** The middle of the ridge at distance `d`. It starts at the board's centre and bends gently from there. */
export function centreAt(field: Field, d: number) {
  let x = CX;
  for (const wave of field.path) x += wave.a * (Math.sin(wave.k * d + wave.phase) - Math.sin(wave.phase));
  return x;
}

/** How fast the ridge moves sideways per px walked (its slope). Never steeper than the level's `bend`. */
export function slopeAt(field: Field, d: number) {
  let slope = 0;
  for (const wave of field.path) slope += wave.a * wave.k * Math.cos(wave.k * d + wave.phase);
  return slope;
}

/** The wind's sideways push at `d` in px per second (+ is to the right). It fades in after the first few metres. */
export function windAt(field: Field, d: number) {
  if (!field.wind.length) return 0;
  let push = 0;
  for (const wave of field.wind) push += wave.a * Math.sin(wave.k * d + wave.phase);
  return push * smooth((d - 140) / 300);
}

/** The obstacle under the feet at `d`, widened by `margin` px before and after. */
export function obstacleAt(field: Field, d: number, margin = 0) {
  for (const obstacle of field.obstacles) if (d >= obstacle.d - margin && d <= obstacle.d + obstacle.len + margin) return obstacle;
  return null;
}

/** Where to stand at `d`, measured from the ridge's middle: the middle, or the dry side's middle beside a puddle or goat. */
export function safeOffset(field: Field, d: number, margin = 12) {
  const obstacle = obstacleAt(field, d, margin), half = field.spec.half;
  if (!obstacle) return 0;
  return obstacle.side > 0 ? (-half + obstacle.lo - FOOT) / 2 : (obstacle.hi + FOOT + half) / 2;
}

export type SlipReason = "mud" | "puddle" | "goat";

/** Why the feet at `offset` from the middle would slip at `d`, or null when they're fine. */
export function slipAt(field: Field, d: number, offset: number): SlipReason | null {
  if (Math.abs(offset) > field.spec.half) return "mud";
  const obstacle = obstacleAt(field, d);
  if (obstacle && offset + FOOT > obstacle.lo && offset - FOOT < obstacle.hi) return obstacle.kind;
  return null;
}

export type WalkEvent =
  | { type: "step"; foot: 0 | 1 }
  | { type: "slip"; reason: SlipReason; side: -1 | 1 }
  | { type: "back" }
  | { type: "near" }
  | { type: "streak"; metres: number }
  | { type: "bleat" }
  | { type: "birds" }
  | { type: "done" }
  | { type: "fell" };

export type Phase = "ready" | "walk" | "slip" | "done" | "fell";

export type Game = {
  field: Field;
  phase: Phase;
  /** Distance walked, px. */
  d: number;
  /** The feet, board x. */
  x: number;
  /** Holding a side: -1 left, 1 right, 0 none. */
  dir: -1 | 0 | 1;
  /** Sideways speed from holding, px per second. */
  vel: number;
  /** Dragging: where the finger wants the feet (board x), or null. */
  target: number | null;
  clock: number;
  slips: number;
  slipAt: number;
  slipX: number;
  slipSide: -1 | 1;
  slipReason: SlipReason | null;
  graceTo: number;
  /** Where the current dry stretch began (px), and the longest dry stretch in this field. */
  dryFrom: number;
  bestDry: number;
  streak: number;
  close: boolean;
  nearAt: number;
  nextStep: number;
  foot: 0 | 1;
  nextGoat: number;
  nextBok: number;
  events: WalkEvent[];
};

export function newGame(level: number, seed: number): Game {
  const field = makeField(level, seed);
  return {
    field, phase: "ready", d: 0, x: CX, dir: 0, vel: 0, target: null, clock: 0,
    slips: 0, slipAt: -9, slipX: CX, slipSide: 1, slipReason: null, graceTo: 0,
    dryFrom: 0, bestDry: 0, streak: 0, close: false, nearAt: -9, nextStep: STRIDE, foot: 0, nextGoat: 0, nextBok: 0, events: [],
  };
}

export const start = (game: Game) => { if (game.phase === "ready") game.phase = "walk"; };

/** Moves the dragged target by a finger's movement, in board px. */
export function dragBy(game: Game, dx: number) {
  game.target = clamp((game.target ?? game.x) + dx, 4, W - 4);
}

/**
 * One fixed step of `dt` seconds. `pace` < 1 is slow mode: the walk and the wind slow down, the feet keep their full sideways speed.
 * Events for sounds and calls collect in `game.events`; the caller empties it.
 */
export function step(game: Game, dt: number, pace = 1) {
  game.clock += dt;
  const field = game.field, spec = field.spec;
  if (game.phase === "slip") {
    if (game.clock - game.slipAt < SLIP_TIME) return;
    if (game.slips >= MAX_SLIPS) { game.phase = "fell"; game.events.push({ type: "fell" }); return; }
    game.x = centreAt(field, game.d) + safeOffset(field, game.d);
    if (game.target !== null) game.target = game.x;
    game.graceTo = game.d + GRACE;
    game.dryFrom = game.d;
    game.phase = "walk";
    game.events.push({ type: "back" });
    return;
  }
  if (game.phase !== "walk") return;

  const wind = windAt(field, game.d) * pace, ahead = spec.speed * pace * dt;
  game.d = Math.min(field.length, game.d + ahead);
  if (game.target !== null) {
    game.target = clamp(game.target + wind * dt, 4, W - 4);
    const most = DRAG_SPEED * dt;
    game.x += clamp(game.target - game.x, -most, most);
    game.vel = 0;
  } else {
    game.vel += (game.dir * TAP_SPEED - game.vel) * Math.min(1, dt / (game.dir ? SPEED_UP : SLOW_DOWN));
    game.x += (game.vel + wind) * dt;
  }
  game.x = clamp(game.x, 4, W - 4);

  while (game.d >= game.nextStep) { game.foot = game.foot ? 0 : 1; game.nextStep += STRIDE; game.events.push({ type: "step", foot: game.foot }); }
  while (game.nextGoat < field.obstacles.length && field.obstacles[game.nextGoat].kind !== "goat") game.nextGoat++;
  const goat = field.obstacles[game.nextGoat];
  if (goat && game.d >= goat.d - 130) { game.nextGoat++; game.events.push({ type: "bleat" }); }
  const bok = field.decor[game.nextBok];
  if (bok && game.d >= bok.d - 60) {
    game.nextBok++;
    if (bok.kind === "bok") game.events.push({ type: "birds" });
  }

  game.bestDry = Math.max(game.bestDry, game.d - game.dryFrom);
  if (game.d >= field.length) { game.phase = "done"; game.events.push({ type: "done" }); return; }

  if (game.d - game.dryFrom >= (game.streak + 1) * STREAK) { game.streak++; game.events.push({ type: "streak", metres: game.streak * STREAK / PX_PER_M }); }

  const offset = game.x - centreAt(field, game.d);
  const reason = game.d >= game.graceTo ? slipAt(field, game.d, offset) : null;
  if (reason) {
    game.slips++;
    Object.assign(game, { phase: "slip", slipAt: game.clock, slipX: game.x, slipReason: reason, streak: 0, close: false, dir: 0, vel: 0 });
    game.slipSide = offset >= 0 ? 1 : -1;
    game.events.push({ type: "slip", reason, side: game.slipSide });
    return;
  }
  // A near miss: the feet reached the outer fifth of the ridge, then came back to the middle without slipping.
  const edge = Math.abs(offset) / spec.half;
  if (edge > 0.8) game.close = true;
  else if (edge < 0.4 && game.close) {
    game.close = false;
    if (game.clock - game.nearAt > 3) { game.nearAt = game.clock; game.events.push({ type: "near" }); }
  }
}

/** 3 stars for a dry walk, 2 for one slip, 1 for two; none if the third slip ended the field. */
export const starsOf = (slips: number, cleared: boolean) => cleared ? Math.max(1, Math.min(3, 3 - slips)) : 0;

export const metres = (px: number) => Math.round(px / PX_PER_M);

/** A careful player holding left or right: aims for the dry middle a little ahead, with a small dead zone. */
export function tapPlayer(game: Game, lookAhead = 16, deadZone = 3): -1 | 0 | 1 {
  const field = game.field, d = game.d + lookAhead;
  const want = centreAt(field, d) + safeOffset(field, d, 26);
  // Let go a moment early: the feet keep sliding a little after a release.
  const error = want - (game.x + game.vel * SLOW_DOWN);
  return error > deadZone ? 1 : error < -deadZone ? -1 : 0;
}

/** Plays a whole field headlessly at 60 steps a second with `control` choosing the held side each step. */
export function simulate(level: number, seed: number, control: (game: Game) => -1 | 0 | 1, pace = 1, limit = 300) {
  const game = newGame(level, seed);
  start(game);
  const counts = { steps: 0, near: 0, birds: 0, bleats: 0, streaks: 0 };
  while (game.phase !== "done" && game.phase !== "fell" && game.clock < limit) {
    if (game.phase === "walk") game.dir = control(game);
    step(game, 1 / 60, pace);
    for (const event of game.events) {
      if (event.type === "step") counts.steps++;
      else if (event.type === "near") counts.near++;
      else if (event.type === "birds") counts.birds++;
      else if (event.type === "bleat") counts.bleats++;
      else if (event.type === "streak") counts.streaks++;
    }
    game.events.length = 0;
  }
  return { game, counts };
}
