// The ride as plain functions: the seeded road (what stands in which lane), lane changes, collisions, letters,
// near misses and the score. No DOM and no React, so the same road replays on every phone and the tests can ride it headless.
import { makeRng, pick } from "../../../shared/game-core";

/** The play field in logical units; the canvas scales it to the phone. The road runs up the screen in three lanes. */
export const W = 360, H = 470;
export const LANES = 3, LANE_W = 76, ROAD_L = (W - LANES * LANE_W) / 2;
export const laneX = (lane: number) => ROAD_L + LANE_W * (lane + 0.5);
/** Where the bike's front wheel is on screen, and its hit box (narrower than drawn, to be kind). */
export const FRONT_Y = 372, BIKE_LEN = 46, BIKE_W = 16;
/** World units in one মিটার. */
export const UNIT = 24;
/** Speed in units a second: gentle at first, +0.2 a মিটার up to TOP (about 850 m). Slow mode stops it at SLOW_CAP. */
export const START = 230, TOP = 400, RAMP = 0.2, SLOW_CAP = 290;
/** One lane change takes this long. */
export const SWITCH_T = 0.12;
export const SIDE_SPEED = LANE_W / SWITCH_T;
/**
 * Time a person needs to see the way and start moving, touch lag on a cheap phone included. Every gap between two rows
 * leaves at least this much on top of the lane changes it asks for.
 */
export const SLACK = 0.36;
/** A dodge this late (seconds before you'd have hit it) rings the bell. */
export const NEAR_T = 0.3;
/** The first row: a puddle in your own lane, far enough off to read "পাশে সরো!". */
export const FIRST_Y = 640;
/** Points: every মিটার is 1, a letter 10, a bell (a near miss) 5. */
export const LETTER_POINTS = 10, BELL_POINTS = 5;

export const PUDDLE = 0, GOAT = 1, CART = 2, COW = 3, LETTER = 4;
/** Hit boxes: `w` across, `len` along the road. A cow stands along the lane, a cart's handles point at you. */
export const SPEC = [
  { w: 54, len: 34 },
  { w: 28, len: 42 },
  { w: 48, len: 78 },
  { w: 40, len: 90 },
  { w: 34, len: 22 },
] as const;

/** Piece states. */
export const AHEAD = 0, PASSED = 1, HIT = 2, TAKEN = 3;
/**
 * `y` is the near edge (the end that reaches you first), `row` the row it belongs to, `close` is set once you were in
 * its path inside the bell window, `hint` 1 says "পাশে সরো!", 2 says "চিঠি তোলো!", `look` picks a coat or a load.
 */
export type Piece = { kind: number; lane: number; x: number; w: number; y: number; len: number; row: number; state: number; close: number; hint: number; look: number };
export const blank = (): Piece => ({ kind: PUDDLE, lane: 0, x: 0, w: 0, y: 0, len: 0, row: 0, state: AHEAD, close: 0, hint: 0, look: 0 });

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

/** The speed the road is laid out for at `meters`. The real speed is never higher (slow mode caps it lower). */
export const speedAt = (meters: number) => Math.min(TOP, START + RAMP * Math.max(0, meters));

/** How many lanes a rider can cross in `time` seconds and still be safe: never less than one (see `nextRow`). */
export const reachIn = (time: number) => clamp(Math.floor((time - SLACK) / SWITCH_T + 1e-9), 0, 2);

/** True when from every lane in `from` (a bitmask) some lane in `to` is at most `reach` lanes away. */
export function fair(from: number, to: number, reach: number) {
  for (let lane = 0; lane < LANES; lane++) {
    if (!(from & (1 << lane))) continue;
    let ok = false;
    for (let other = 0; other < LANES; other++) if (to & (1 << other) && Math.abs(other - lane) <= reach) ok = true;
    if (!ok) return false;
  }
  return true;
}

export type Road = {
  rng: () => number; end: number; rows: number; open: number; letterHinted: boolean;
  /** The row just laid out: up to two obstacles and maybe a letter, nearest first. */
  out: Piece[]; outCount: number;
};

export const makeRoad = (seed: number): Road => ({
  rng: makeRng(seed), end: 0, rows: 0, open: 0b010, letterHinted: false, out: [blank(), blank(), blank()], outCount: 0,
});

function chooseKind(rng: () => number, meters: number) {
  const roll = rng();
  if (meters < 60) return roll < 0.6 ? PUDDLE : GOAT;
  if (meters < 130) return roll < 0.4 ? PUDDLE : roll < 0.7 ? GOAT : CART;
  return roll < 0.27 ? PUDDLE : roll < 0.5 ? GOAT : roll < 0.75 ? CART : COW;
}

function put(piece: Piece, kind: number, lane: number, y: number, row: number, look: number, hint = 0) {
  return Object.assign(piece, { kind, lane, x: laneX(lane), w: SPEC[kind].w, y, len: SPEC[kind].len, row, state: AHEAD, close: 0, hint, look });
}

/**
 * Lays out the next row into `road.out`. Only the seed and the distance decide it (never the real speed), so slow mode
 * and a friend's phone get the very same road. A row blocks one or two lanes, never three, and the gap before it is timed
 * for the fastest the road can be there: from any open lane of the last row an open lane of this one is always in reach.
 */
export function nextRow(road: Road) {
  const rng = road.rng, row = road.rows;
  const meters = road.end / UNIT;
  let y = FIRST_Y;
  if (row > 0) {
    // Seconds between the last row's far end and this one: roomy at first, tighter far down the road.
    let gap = lerp(1.1, 0.52, clamp(meters / 800, 0, 1)) * (1 + 0.5 * rng());
    if (rng() < 0.1) gap *= 1.6;
    // A gap is never longer than 60 m, so the speed 60 m on is the fastest anyone meets inside it.
    y = road.end + BIKE_LEN + gap * speedAt(meters + 60);
  }
  const at = y / UNIT;
  const reach = row === 0 ? 2 : reachIn((y - road.end - BIKE_LEN) / speedAt(at));

  // Which lanes this row blocks: one early on, sometimes two later (never all three).
  let blocked: number;
  if (row === 0) blocked = 0b010;
  else if (row >= 3 && rng() < clamp((at - 80) / 900, 0, 0.5)) {
    let open = pick(rng, LANES);
    for (let tries = 0; tries < LANES && !fair(road.open, 1 << open, reach); tries++) open = (open + 1) % LANES;
    blocked = 0b111 & ~(1 << open);
  } else blocked = 1 << pick(rng, LANES);

  let count = 0;
  // Now and then a letter waits in the middle of the gap. Early on only where the next row is open, so it's free to take.
  if (row > 0 && rng() < 0.5) {
    let lane = pick(rng, LANES);
    if (at < 150) while (blocked & (1 << lane)) lane = (lane + 1) % LANES;
    const hint = road.letterHinted ? 0 : 2;
    road.letterHinted = true;
    put(road.out[count++], LETTER, lane, (road.end + y) / 2 - SPEC[LETTER].len / 2, row, pick(rng, 3), hint);
  }
  let end = y;
  for (let lane = 0; lane < LANES; lane++) {
    if (!(blocked & (1 << lane))) continue;
    // In a pair, the second one stands a little further on: a road, not a wall.
    const stagger = count > 0 && road.out[count - 1].kind !== LETTER ? pick(rng, 3) * 12 : 0;
    const piece = put(road.out[count++], row === 0 ? PUDDLE : chooseKind(rng, at), lane, y + stagger, row, pick(rng, 3), row === 0 ? 1 : 0);
    end = Math.max(end, piece.y + piece.len);
  }
  road.outCount = count;
  road.open = 0b111 & ~blocked;
  road.end = end;
  road.rows++;
  return road;
}

/** The road as a list up to `meters` (for tests and checks; the game itself fills a small ring). */
export function planRoad(seed: number, meters: number) {
  const road = makeRoad(seed), pieces: Piece[] = [];
  while (road.end < meters * UNIT) {
    nextRow(road);
    for (let index = 0; index < road.outCount; index++) pieces.push({ ...road.out[index] });
  }
  return pieces;
}

/** What happened, for the scene's pops, rings and banners. */
export const GOT_LETTER = 0, BELL = 1, MILESTONE = 2, CRASH = 3;
export type RunEvent = { type: number; t: number; x: number; y: number };

export const RING = 32;
export type Run = {
  seed: number; road: Road; ring: Piece[]; first: number; count: number;
  /** Distance ridden in units (the front wheel's world position), game seconds, current speed, the speed cap. */
  d: number; t: number; speed: number; cap: number;
  /** The bike's x on screen and the lane it is heading for. */
  x: number; lane: number;
  letters: number; bells: number; meters: number; score: number;
  over: boolean; hitKind: number; hitAt: number;
  events: RunEvent[]; eventCount: number;
};

export function createRun(seed: number, cap = TOP): Run {
  return {
    seed, road: makeRoad(seed), ring: Array.from({ length: RING }, blank), first: 0, count: 0,
    d: 0, t: 0, speed: START, cap, x: laneX(1), lane: 1,
    letters: 0, bells: 0, meters: 0, score: 0, over: false, hitKind: -1, hitAt: -1,
    events: Array.from({ length: 8 }, () => ({ type: 0, t: 0, x: 0, y: 0 })), eventCount: 0,
  };
}

export const pieceAt = (run: Run, index: number) => run.ring[index % RING];
export const scoreOf = (meters: number, letters: number, bells: number) => meters + LETTER_POINTS * letters + BELL_POINTS * bells;

function emit(run: Run, type: number, x: number, y: number) {
  const event = run.events[run.eventCount++ % run.events.length];
  event.type = type; event.t = run.t; event.x = x; event.y = y;
}

/** A tap on the left (-1) or right (+1): head one lane over. Two quick taps cross two lanes. */
export function steer(run: Run, towards: -1 | 1) {
  if (!run.over) run.lane = clamp(run.lane + towards, 0, LANES - 1);
}

/** Does the bike overlap piece `piece` sideways right now? */
export const inPath = (run: Run, piece: Piece) => Math.abs(run.x - piece.x) < (BIKE_W + piece.w) / 2;

/**
 * Advances the ride by `dt` game seconds (the caller slows time for slow mode). Mutates `run` and allocates nothing:
 * it runs 60 times a second on cheap phones.
 */
export function stepRun(run: Run, dt: number) {
  if (run.over) return;
  run.t += dt;
  run.speed = Math.min(run.cap, speedAt(run.d / UNIT));
  run.d += run.speed * dt;

  // Keep the road laid out past the top edge (a cow is long, so a little more).
  while (run.road.end < run.d + FRONT_Y + 120) {
    nextRow(run.road);
    for (let index = 0; index < run.road.outCount; index++) Object.assign(pieceAt(run, run.count++), run.road.out[index]);
  }

  const target = laneX(run.lane), move = SIDE_SPEED * dt;
  run.x = Math.abs(target - run.x) <= move ? target : run.x + Math.sign(target - run.x) * move;

  const front = run.d, back = run.d - BIKE_LEN, near = run.speed * NEAR_T;
  for (let index = run.first; index < run.count; index++) {
    const piece = pieceAt(run, index);
    if (piece.y > front + near) break;
    if (piece.state !== AHEAD) continue;
    const side = inPath(run, piece);
    if (piece.y + piece.len < back) {
      piece.state = PASSED;
      if (piece.close) { run.bells++; emit(run, BELL, run.x, piece.y + piece.len); }
      continue;
    }
    if (piece.y > front) { if (side && piece.kind !== LETTER) piece.close = 1; continue; }
    if (!side) continue;
    if (piece.kind === LETTER) { piece.state = TAKEN; run.letters++; emit(run, GOT_LETTER, piece.x, piece.y); continue; }
    piece.state = HIT; piece.close = 0; run.over = true; run.hitKind = piece.kind; run.hitAt = index;
    emit(run, CRASH, piece.x, piece.y);
    break;
  }
  // Forget pieces that have rolled off the bottom of the screen.
  while (run.first < run.count && pieceAt(run, run.first).y + pieceAt(run, run.first).len < run.d - (H - FRONT_Y) - 40) run.first++;

  const meters = Math.floor(run.d / UNIT);
  if (Math.floor(meters / 100) > Math.floor(run.meters / 100)) emit(run, MILESTONE, run.x, run.d);
  run.meters = meters;
  run.score = scoreOf(run.meters, run.letters, run.bells);
}
