// The road to school as plain functions: what lies where, laid from the seed alone. No DOM, no React, no real clock,
// so the same road replays on every phone and the tests can play it headless. The run's state and rules are in
// game.ts and step.hot.ts.
import { makeRng, pick } from "../../../shared/game-core";
import type { LevelDef } from "./levels";

/** The view is always this many units wide (its height follows the phone); the kid's centre sits at KID_X. */
export const W = 360;
/** The kid's centre on screen, and half the width of the body that can bump into things (narrower than drawn, to be kind). */
export const KID_X = 66, HALF = 8;
export const KID_H = 44, DUCK_H = 25;
/** World units in one মিটার. */
export const UNIT = 20;
/** The endless road's speed in units a second: it starts gentle and climbs 0.08 a মিটার up to TOP (about 2000 m). */
export const START = 190, TOP = 350, RAMP = 0.08;
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
/** On the endless road, after the tiffin box saves you, nothing can bump you for this long. */
export const SHIELD_TIME = 1;
/** The endless road's school gate (it keeps going after it). */
export const GATE_M = 1000;
/** The village road switches between the lane and the field every this many মিটার. */
export const ZONE_M = 400;
/** A tyre starts rolling once it is this far right of the kid's road position (just off the right edge). */
export const ACTIVATE = W + 40;
/** The last level speeds up over its last this many মিটার. */
export const SPRINT_M = 150;
/** A level's first thing is this far out (the endless road keeps its own 28 m). */
export const FIRST_M = 18;
/** Seconds from a low branch's end to the mud after it (a duck, then a jump). */
export const PAIR_GAP = 0.8;
/** Seconds of gap a high page needs around it. */
export const HIGH_GAP = 1.25;

export const PUDDLE = 0, BASKET = 1, BIKE = 2, COW = 3, LINE = 4, BRANCH = 5, TIFFIN = 6, PAGE = 7, SIGN = 8, TIRE = 9, MUD = 10;
export const KINDS = 11;
/** Hit boxes: `w` wide; for ground things `h` is the top, for hanging things it is the bottom edge. */
export const SPEC: readonly { w: number; h: number; over: boolean }[] = [
  { w: 50, h: 4, over: false },
  { w: 28, h: 24, over: false },
  { w: 48, h: 33, over: false },
  { w: 60, h: 29, over: false },
  { w: 40, h: 30, over: true },
  { w: 44, h: 30, over: true },
  { w: 16, h: 14, over: false },
  { w: 18, h: 16, over: false },
  { w: 58, h: 30, over: true },
  { w: 22, h: 22, over: false },
  { w: 96, h: 4, over: false },
];
/** Things you pick up rather than bump into. */
export const isPickup = (kind: number) => kind === TIFFIN || kind === PAGE;
export const isOver = (kind: number) => kind === LINE || kind === BRANCH || kind === SIGN;

/** Piece states. */
export const AHEAD = 0, PASSED = 1, HIT = 2, TAKEN = 3;
/**
 * `hint` names the lesson over the level's first new thing: 1 লাফ দাও, 2 নিচু হও, 3 a long jump, 4 a tyre.
 * `vx` is a tyre's own speed toward the kid; `boss` marks a finale's thing; `seen` is set once its edge pointer showed.
 */
export type Piece = { kind: number; x: number; w: number; h: number; y: number; state: number; hint: number; vx: number; boss: number; seen: number };
export const blank = (): Piece => ({ kind: PUDDLE, x: 0, w: 0, h: 0, y: 0, state: AHEAD, hint: 0, vx: 0, boss: 0, seen: 0 });

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

/** The endless road's speed at `meters`. */
export const speedAt = (meters: number) => Math.min(TOP, START + RAMP * Math.max(0, meters));
/** A level's speed at `meters`: from its start speed to its top at the gate, plus the last level's sprint. */
export function speedOf(def: LevelDef, meters: number) {
  const base = def.speed + (def.top - def.speed) * clamp(meters / def.gate, 0, 1);
  return def.sprint ? base + def.sprint * clamp((meters - (def.gate - SPRINT_M)) / 60, 0, 1) : base;
}
/** Half the roads have a girl in a pinafore with two braids, half a boy in shorts (a hash of the seed, not the road's dice). */
export const girlFor = (seed: number) => ((Math.imul(seed, 2654435761) >>> 16) & 1) === 1;
export const zoneOf = (meters: number) => Math.floor(Math.max(0, meters) / ZONE_M) % 2;

/** How long the kid's feet stay above `height` on a jump with no hold (the shortest jump there is). */
export const airAbove = (height: number) => 2 * Math.sqrt(Math.max(0, JUMP_V * JUMP_V - 2 * GRAVITY * height)) / GRAVITY;

export type Road = {
  rng: () => number; end: number; count: number; nextTiffin: number;
  jumpHinted: boolean; duckHinted: boolean; queued: Piece; hasQueued: boolean;
  /** The level (null: the endless road), its gate in মিটার, and how many of its pages are already laid. */
  def: LevelDef | null; gate: number; pages: number;
  /** Levels only: the new thing has come, its lesson shown, a duck-then-jump pair is owed, the finale's start and what's left of it, only owed pages left, nothing more to lay. */
  fresh: boolean; hinted: boolean; pair: boolean; finaleAt: number; finaleLeft: number; clear: boolean; done: boolean;
};

/** Where a level's finale stretch begins (মিটার): room for its things at their beat, at the level's top speed, before the gate. */
export function finaleStart(def: LevelDef) {
  if (!def.finale) return Infinity;
  let width = 0;
  for (const kind of def.finale.kinds) width += SPEC[kind].w;
  const each = width / def.finale.kinds.length + def.finale.beat * 1.06 * (def.top + def.sprint);
  return def.gate - Math.ceil((def.finale.count * each) / UNIT) - 16;
}

export const makeRoad = (seed: number, def: LevelDef | null = null): Road => ({
  rng: makeRng(seed), end: 0, count: 0, nextTiffin: 170, jumpHinted: false, duckHinted: false, queued: blank(), hasQueued: false,
  def, gate: def ? def.gate : GATE_M, pages: 0,
  fresh: false, hinted: false, pair: false, finaleAt: def ? finaleStart(def) : Infinity, finaleLeft: def?.finale?.count ?? 0, clear: false, done: false,
});

function set(piece: Piece, kind: number, x: number, w: number, h: number, y: number, hint: number, vx: number, boss: number) {
  piece.kind = kind; piece.x = x; piece.w = w; piece.h = h; piece.y = y; piece.state = AHEAD; piece.hint = hint; piece.vx = vx; piece.boss = boss; piece.seen = 0;
  return piece;
}

/* ---------- the endless road: the original generator, kept exactly so old links replay ---------- */

function chooseEndless(road: Road, meters: number) {
  const roll = road.rng();
  if (road.count === 0) return PUDDLE;
  if (meters < 120) return roll < 0.55 ? PUDDLE : BASKET;
  if (!road.duckHinted && meters >= 140) return LINE;
  return meters < 220 ? (roll < 0.3 ? PUDDLE : roll < 0.55 ? BASKET : roll < 0.78 ? BIKE : LINE)
    : roll < 0.2 ? PUDDLE : roll < 0.36 ? BASKET : roll < 0.52 ? BIKE : roll < 0.7 ? COW : roll < 0.86 ? LINE : BRANCH;
}

function nextEndless(road: Road, out: Piece): Piece {
  const meters = road.end / UNIT;
  const kind = chooseEndless(road, meters);
  const w = kind === PUDDLE ? 44 + pick(road.rng, 4) * 6 : SPEC[kind].w;
  // Time between the last thing's end and this one's start: generous at first, tighter far down the road.
  let gap = lerp(1.3, 0.72, clamp(meters / 1500, 0, 1)) * (1 + 0.55 * road.rng());
  if (road.rng() < 0.12) gap *= 1.7;
  let x = road.count === 0 ? 28 * UNIT : road.end + speedAt(meters + 8) * gap;
  // Nothing blocks the school gate.
  if (x < (road.gate + 15) * UNIT && x + w > (road.gate - 15) * UNIT) x = (road.gate + 15) * UNIT;
  let hint = 0;
  if (isOver(kind) && !road.duckHinted) { road.duckHinted = true; hint = 2; }
  else if (!isOver(kind) && !road.jumpHinted) { road.jumpHinted = true; hint = 1; }
  const tiffin = road.count > 0 && meters >= road.nextTiffin && gap >= 0.95;
  const piece = tiffin ? road.queued : out;
  set(piece, kind, x, w, SPEC[kind].h, 0, hint, 0, 0);
  const before = road.end;
  road.end = x + w;
  road.count++;
  if (piece === out) return out;
  road.hasQueued = true;
  // A tiffin box waits in the middle of the gap: low enough to run into, or high enough to need a jump.
  road.nextTiffin = meters + 260 + road.rng() * 140;
  const tx = (before + x) / 2 - SPEC[TIFFIN].w / 2;
  return set(out, TIFFIN, tx, SPEC[TIFFIN].w, SPEC[TIFFIN].h, road.rng() < 0.5 ? 6 : 62, 0, 0, 0);
}

/* ---------- a level's road ---------- */

/** Where a level's page i is due: a fifth, nine twentieths and seven tenths of the way. */
export const pageDue = (def: LevelDef, index: number) => Math.round(def.gate * (0.2 + 0.25 * index));
const hintFor = (kind: number) => isOver(kind) ? 2 : kind === MUD ? 3 : kind === TIRE ? 4 : 1;

function weighted(def: LevelDef, roll: number) {
  let total = 0;
  for (let kind = 0; kind < KINDS; kind++) total += def.kinds[kind] ?? 0;
  let at = roll * total;
  for (let kind = 0; kind < KINDS; kind++) {
    const weight = def.kinds[kind] ?? 0;
    if (at < weight) return kind;
    at -= weight;
  }
  return PUDDLE;
}

/** The far end of a finished level's road: one empty piece far beyond the gate, so nothing more is laid. */
const FAR = 1e9;

function nextLevel(road: Road, def: LevelDef, out: Piece): Piece {
  if (road.done) { road.end = FAR; road.count++; const piece = set(out, PUDDLE, FAR, 0, 0, 0, 0, 0, 0); piece.state = PASSED; return piece; }
  if (road.clear) {
    // The road is clear to the gate now, except for any page still owed: it floats low in the open stretch.
    if (road.pages < 3 && road.end / UNIT + 4 < def.gate - 2) {
      road.pages++; road.count++;
      // Far enough past the last thing that its jump has landed.
      const px = Math.min(road.end + speedOf(def, road.end / UNIT) * 0.85, (def.gate - 2) * UNIT - SPEC[PAGE].w);
      road.end = px + SPEC[PAGE].w;
      return set(out, PAGE, px, SPEC[PAGE].w, SPEC[PAGE].h, 8, 0, 0, 0);
    }
    road.done = true;
    return nextLevel(road, def, out);
  }
  const meters = road.end / UNIT;
  const roll = road.rng(), r1 = road.rng(), r2 = road.rng(), r3 = road.rng();
  const v = speedOf(def, meters + 8);
  // Seconds between the last thing's end and this one's start: generous at first, tighter toward the gate.
  let gap = lerp(def.gapStart, def.gapEnd, clamp(meters / def.gate, 0, 1)) * (1 + 0.45 * r2);
  if (r3 < 0.1) gap *= 1.5;
  let kind: number, boss = 0;
  // The finale takes over from the first thing that would fall past its start, and keeps its own beat.
  const finale = def.finale && road.finaleLeft > 0 && road.count > 0 && meters + (v * gap) / UNIT >= road.finaleAt ? def.finale : null;
  if (finale) {
    kind = finale.kinds[(finale.count - road.finaleLeft) % finale.kinds.length]; boss = 1; road.finaleLeft--; road.pair = false;
    gap = finale.beat * (1 + 0.12 * r2);
  } else if (road.pair) { kind = MUD; road.pair = false; gap = PAIR_GAP; }
  else if (road.count === 0) kind = PUDDLE;
  else if (!road.fresh && def.fresh >= 0) kind = def.fresh;
  else kind = weighted(def, roll);
  if (kind === def.fresh) road.fresh = true;
  const w = kind === PUDDLE ? 44 + Math.floor(r1 * 4) * 6 : kind === MUD ? 84 + Math.floor(r1 * def.mud) * 8 : SPEC[kind].w;
  // A static-equivalent spot `s`: where a still thing would meet the kid. A tyre starts farther out and rolls in to meet her there.
  const s = road.count === 0 ? FIRST_M * UNIT : road.end + v * gap;
  if (finale ? (s + w) / UNIT > def.gate - 2 : s / UNIT > def.gate - 8) { road.clear = true; return nextLevel(road, def, out); }
  const vx = kind === TIRE ? (finale ? finale.roll : 105) + Math.floor(r1 * 4) * 10 : 0;
  const x = vx ? s + (ACTIVATE - KID_X - HALF) * vx / (v + vx) : s;
  let hint = 0;
  if (kind === def.fresh && !road.hinted) { road.hinted = true; hint = hintFor(kind); }
  // A page waits in a roomy gap once it is due (low enough to run into, or on later levels high enough to need a jump).
  const page = road.count > 0 && road.pages < 3 && meters >= pageDue(def, road.pages) && gap >= 0.95;
  const piece = page ? road.queued : out;
  set(piece, kind, x, w, SPEC[kind].h, 0, hint, vx, boss);
  const before = road.end;
  road.end = s + w;
  road.count++;
  if (kind === BRANCH && def.pairs && !finale) road.pair = true;
  // After the finale's last thing, the road is clear to the gate.
  if (finale && road.finaleLeft === 0) road.clear = true;
  if (piece === out) return out;
  road.hasQueued = true;
  road.pages++;
  // A high page needs room for its own jump and a landing before the next thing; inside a finale's beat it stays low.
  const py = def.highPages && road.rng() < 0.5 && !finale && gap >= HIGH_GAP ? 88 : 8;
  return set(out, PAGE, (before + s) / 2 - SPEC[PAGE].w / 2, SPEC[PAGE].w, SPEC[PAGE].h, py, 0, 0, 0);
}

/**
 * Writes the next thing on the road into `out`. Only the seed and the distance decide it (never the real speed),
 * so slow mode and a friend's phone get the very same road.
 */
export function nextPiece(road: Road, out: Piece): Piece {
  if (road.hasQueued) {
    const queued = road.queued;
    set(out, queued.kind, queued.x, queued.w, queued.h, queued.y, queued.hint, queued.vx, queued.boss);
    road.hasQueued = false;
    return out;
  }
  return road.def ? nextLevel(road, road.def, out) : nextEndless(road, out);
}

/** The road as a list up to `meters` (for tests and checks; the game itself fills a small ring). */
export function planRoad(seed: number, meters: number, def: LevelDef | null = null) {
  const road = makeRoad(seed, def), pieces: Piece[] = [];
  while (road.end < meters * UNIT || road.hasQueued) {
    const piece = nextPiece(road, blank());
    if (piece.x >= FAR) break;
    pieces.push(piece);
  }
  return pieces;
}
