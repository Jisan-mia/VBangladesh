// The run as plain functions: the seeded road (what lies where), the kid's jump and duck, collisions and the distance.
// No DOM and no React, so the same road replays on every phone and the tests can play it headless.
import { makeRng, pick } from "../../../shared/game-core";

/** The play field in logical units; the canvas scales it to the phone. GROUND is where the kid's feet touch. */
export const W = 360, H = 290, GROUND = 246;
/** The kid's centre on screen, and half the width of the body that can bump into things (narrower than drawn, to be kind). */
export const KID_X = 66, HALF = 8;
export const KID_H = 44, DUCK_H = 25;
/** World units in one মিটার. */
export const UNIT = 20;
/** Speed in units a second: it starts gentle and climbs 0.08 a মিটার up to TOP (about 2000 m). Slow mode stops it at SLOW_CAP. */
export const START = 190, TOP = 350, RAMP = 0.08, SLOW_CAP = 260;
export const GRAVITY = 2000, JUMP_V = 620;
/**
 * Holding the jump past HOLD_START makes gravity this much weaker while rising, for up to HOLD_MAX more seconds: a higher,
 * floatier jump. A normal tap (a thumb rests ~0.1 s) stays the standard jump, so the rhythm of taps is predictable.
 */
export const HOLD_START = 0.08, HOLD_GRAVITY = 0.45, HOLD_MAX = 0.2;
/** Ducking in the air pulls the kid down this many times faster. */
export const FAST_FALL = 3.2;
/** A duck tap keeps the kid low at least this long. A jump pressed this close before landing still happens. */
export const DUCK_MIN = 0.45, BUFFER = 0.15;
/** A duck within this long of a takeoff takes the jump back (a swipe down starts as a touch, and a touch jumps). */
export const REWIND = 0.12;
/** After the tiffin box saves you, nothing can bump you for this long. */
export const SHIELD_TIME = 1;
export const GATE_M = 1000;
/** The road switches between the lane and the field every this many মিটার. */
export const ZONE_M = 400;

export const PUDDLE = 0, BASKET = 1, BIKE = 2, COW = 3, LINE = 4, BRANCH = 5, TIFFIN = 6;
/** Hit boxes: `w` wide; for ground things `h` is the top, for hanging things it is the bottom edge. */
export const SPEC = [
  { w: 50, h: 4, over: false },
  { w: 28, h: 24, over: false },
  { w: 48, h: 33, over: false },
  { w: 60, h: 29, over: false },
  { w: 40, h: 30, over: true },
  { w: 44, h: 30, over: true },
  { w: 16, h: 14, over: false },
] as const;
export const isOver = (kind: number) => kind === LINE || kind === BRANCH;

/** Piece states. */
export const AHEAD = 0, PASSED = 1, HIT = 2, TAKEN = 3;
/** `hint` 1 shows "লাফ দাও!" over the first thing to jump, 2 shows "নিচু হও!" over the first thing to duck. */
export type Piece = { kind: number; x: number; w: number; h: number; y: number; state: number; hint: number };
const blank = (): Piece => ({ kind: PUDDLE, x: 0, w: 0, h: 0, y: 0, state: AHEAD, hint: 0 });

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

/** The speed the road is laid out for at `meters`. The real speed is never higher (slow mode caps it lower). */
export const speedAt = (meters: number) => Math.min(TOP, START + RAMP * Math.max(0, meters));
/** Half the roads have a girl in a pinafore with two braids, half a boy in shorts (a hash of the seed, not the road's dice). */
export const girlFor = (seed: number) => ((Math.imul(seed, 2654435761) >>> 16) & 1) === 1;
export const zoneOf = (meters: number) => Math.floor(Math.max(0, meters) / ZONE_M) % 2;

/** How long the kid's feet stay above `height` on a jump with no hold (the shortest jump there is). */
export const airAbove = (height: number) => 2 * Math.sqrt(Math.max(0, JUMP_V * JUMP_V - 2 * GRAVITY * height)) / GRAVITY;

export type Road = {
  rng: () => number; end: number; count: number; nextTiffin: number;
  jumpHinted: boolean; duckHinted: boolean; queued: Piece; hasQueued: boolean;
};

export const makeRoad = (seed: number): Road => ({
  rng: makeRng(seed), end: 0, count: 0, nextTiffin: 170, jumpHinted: false, duckHinted: false, queued: blank(), hasQueued: false,
});

function chooseKind(road: Road, meters: number) {
  const roll = road.rng();
  if (road.count === 0) return PUDDLE;
  if (meters < 120) return roll < 0.55 ? PUDDLE : BASKET;
  if (!road.duckHinted && meters >= 140) return LINE;
  if (meters < 220) return roll < 0.3 ? PUDDLE : roll < 0.55 ? BASKET : roll < 0.78 ? BIKE : LINE;
  return roll < 0.2 ? PUDDLE : roll < 0.36 ? BASKET : roll < 0.52 ? BIKE : roll < 0.7 ? COW : roll < 0.86 ? LINE : BRANCH;
}

/**
 * Writes the next thing on the road into `out`. Only the seed and the distance decide it (never the real speed),
 * so slow mode and a friend's phone get the very same road. Gaps are timed for the fastest the road can be there.
 */
export function nextPiece(road: Road, out: Piece): Piece {
  if (road.hasQueued) { Object.assign(out, road.queued); road.hasQueued = false; return out; }
  const meters = road.end / UNIT;
  const kind = chooseKind(road, meters);
  const w = kind === PUDDLE ? 44 + pick(road.rng, 4) * 6 : SPEC[kind].w;
  // Time between the last thing's end and this one's start: generous at first, tighter far down the road.
  let gap = lerp(1.3, 0.72, clamp(meters / 1500, 0, 1)) * (1 + 0.55 * road.rng());
  if (road.rng() < 0.12) gap *= 1.7;
  let x = road.count === 0 ? 28 * UNIT : road.end + speedAt(meters + 8) * gap;
  // Nothing blocks the school gate.
  if (x < (GATE_M + 15) * UNIT && x + w > (GATE_M - 15) * UNIT) x = (GATE_M + 15) * UNIT;
  let hint = 0;
  if (isOver(kind) && !road.duckHinted) { road.duckHinted = true; hint = 2; }
  else if (!isOver(kind) && !road.jumpHinted) { road.jumpHinted = true; hint = 1; }
  const piece = road.count > 0 && meters >= road.nextTiffin && gap >= 0.95 ? road.queued : out;
  Object.assign(piece, { kind, x, w, h: SPEC[kind].h, y: 0, state: AHEAD, hint });
  const before = road.end;
  road.end = x + w;
  road.count++;
  if (piece === out) return out;
  // A tiffin box waits in the middle of the gap: low enough to run into, or high enough to need a jump.
  road.hasQueued = true;
  road.nextTiffin = meters + 260 + road.rng() * 140;
  return Object.assign(out, { kind: TIFFIN, x: (before + x) / 2 - SPEC[TIFFIN].w / 2, w: SPEC[TIFFIN].w, h: SPEC[TIFFIN].h, y: road.rng() < 0.5 ? 6 : 62, state: AHEAD, hint: 0 });
}

/** The road as a list up to `meters` (for tests and checks; the game itself fills a small ring). */
export function planRoad(seed: number, meters: number) {
  const road = makeRoad(seed), pieces: Piece[] = [];
  while (road.end < meters * UNIT || road.hasQueued) pieces.push(nextPiece(road, blank()));
  return pieces;
}

/** What happened, for the scene's dust, pops and banners. */
export const JUMPED = 0, LANDED = 1, GOT_TIFFIN = 2, SAVED = 3, MILESTONE = 4, GATE = 5, CRASH = 6;
export type RunEvent = { type: number; t: number; at: number };

const RING = 16;
export type Run = {
  seed: number; road: Road; ring: Piece[]; first: number; count: number;
  /** Distance run in units, game seconds, current speed, the speed cap (TOP, or SLOW_CAP in slow mode). */
  d: number; t: number; speed: number; cap: number;
  y: number; vy: number; air: number; hold: number; ducking: boolean;
  jumpHeld: boolean; jumpAt: number; duckHeld: boolean; duckUntil: number;
  tiffin: boolean; safeUntil: number; over: boolean; hitKind: number; meters: number; gate: boolean;
  events: RunEvent[]; eventCount: number;
};

export function createRun(seed: number, cap = TOP): Run {
  return {
    seed, road: makeRoad(seed), ring: Array.from({ length: RING }, blank), first: 0, count: 0,
    d: 0, t: 0, speed: START, cap, y: 0, vy: 0, air: -1, hold: 0, ducking: false,
    jumpHeld: false, jumpAt: -9, duckHeld: false, duckUntil: -9,
    tiffin: false, safeUntil: -9, over: false, hitKind: -1, meters: 0, gate: false,
    events: Array.from({ length: 8 }, () => ({ type: 0, t: 0, at: 0 })), eventCount: 0,
  };
}

export const pieceAt = (run: Run, index: number) => run.ring[index % RING];
const grounded = (run: Run) => run.air < 0;

function emit(run: Run, type: number, at: number) {
  const event = run.events[run.eventCount++ % run.events.length];
  event.type = type; event.t = run.t; event.at = at;
}

/** A jump always wins over a duck: it stands the kid up. */
export function pressJump(run: Run) { run.jumpHeld = true; run.jumpAt = run.t; run.duckHeld = false; run.duckUntil = -9; }
export function releaseJump(run: Run) { run.jumpHeld = false; }
export function pressDuck(run: Run) {
  run.duckHeld = true; run.duckUntil = run.t + DUCK_MIN; run.jumpAt = -9;
  if (!grounded(run) && run.air < REWIND && run.vy > 0) { run.y = 0; run.vy = 0; run.air = -1; }
}
export function releaseDuck(run: Run) { run.duckHeld = false; }

/** The kid's top edge right now, in units above the ground. */
export const kidTop = (run: Run) => run.y + (run.ducking ? DUCK_H : KID_H);

/** Does the kid's body touch piece `piece` right now? (Only the vertical test: the caller has checked they overlap sideways.) */
export function touches(run: Run, piece: Piece) {
  if (piece.kind === TIFFIN) return run.y < piece.y + piece.h && kidTop(run) > piece.y;
  return isOver(piece.kind) ? kidTop(run) > piece.h : run.y < piece.h;
}

/**
 * Advances the run by `dt` game seconds (the caller slows time for slow mode). Mutates `run` and allocates nothing:
 * it runs 60 times a second on cheap phones.
 */
export function stepRun(run: Run, dt: number) {
  if (run.over) return;
  run.t += dt;
  run.speed = Math.min(run.cap, speedAt(run.d / UNIT));
  run.d += run.speed * dt;

  // Keep the road laid out a little past the right edge.
  while (run.road.hasQueued || run.road.end < run.d + W + 260) nextPiece(run.road, run.ring[run.count++ % RING]);

  run.ducking = run.duckHeld || run.t < run.duckUntil;
  if (grounded(run) && run.t - run.jumpAt <= BUFFER) {
    run.vy = JUMP_V; run.air = 0; run.hold = 0; run.jumpAt = -9;
    emit(run, JUMPED, run.d);
  }
  if (!grounded(run)) {
    let gravity = GRAVITY;
    if (run.vy > 0 && run.jumpHeld && run.air >= HOLD_START && run.hold < HOLD_MAX) { gravity *= HOLD_GRAVITY; run.hold += dt; }
    if (run.ducking) gravity *= FAST_FALL;
    run.vy -= gravity * dt;
    run.y += run.vy * dt;
    run.air += dt;
    if (run.y <= 0) {
      run.y = 0; run.vy = 0; run.air = -1;
      emit(run, LANDED, run.d);
      if (run.t - run.jumpAt <= BUFFER) { run.vy = JUMP_V; run.air = 0; run.hold = 0; run.jumpAt = -9; emit(run, JUMPED, run.d); }
    }
  }

  const left = run.d + KID_X - HALF, right = run.d + KID_X + HALF;
  for (let index = run.first; index < run.count; index++) {
    const piece = pieceAt(run, index);
    if (piece.x > right) break;
    if (piece.state !== AHEAD) continue;
    if (piece.x + piece.w < left) { piece.state = PASSED; continue; }
    if (!touches(run, piece)) continue;
    if (piece.kind === TIFFIN) { piece.state = TAKEN; run.tiffin = true; emit(run, GOT_TIFFIN, piece.x); continue; }
    if (run.t < run.safeUntil) continue;
    if (run.tiffin) { run.tiffin = false; run.safeUntil = run.t + SHIELD_TIME; piece.state = HIT; emit(run, SAVED, piece.x); continue; }
    piece.state = HIT; run.over = true; run.hitKind = piece.kind;
    emit(run, CRASH, piece.x);
    break;
  }
  // Forget pieces that have scrolled off the left edge.
  while (run.first < run.count && pieceAt(run, run.first).x + pieceAt(run, run.first).w < run.d - 60) run.first++;

  const meters = Math.floor(run.d / UNIT);
  if (meters !== run.meters) {
    if (!run.gate && meters >= GATE_M) { run.gate = true; emit(run, GATE, run.d); }
    else if (Math.floor(meters / 100) > Math.floor(run.meters / 100)) emit(run, MILESTONE, run.d);
    run.meters = meters;
  }
}
