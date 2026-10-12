// The rules of নদী পার, with no browser code: the river's lanes and what floats on them, the kid's hops, splashes, mangoes and stars.
// Every floater moves on a loop ("ring") wider than the screen, so its position is a pure function of time: same seed, same river.
import { makeRng } from "../../../shared/game-core";

/** The screen is 9 cells wide; the kid hops one cell at a time. */
export const COLS = 9;
/** A lane loops over 16 cells: 9 on screen and 3.5 hidden on each side, more than its longest floater (a নৌকা, 3). The ferry's lane loops over 20. */
export const RING = 16, FERRY_RING = 20;
const offOf = (lane: Lane) => (lane.ring - COLS) / 2;
/** One hop, in seconds. A tap during a hop waits for the landing. */
export const HOP_T = 0.12;
/** In the water for this long, then back on the last bank. */
export const RESPAWN_T = 0.7;
export const LEVEL_COUNT = 30;
export const START_X = 4.5;
/** Carried this far past the screen's edge, the current has taken you. */
export const EDGE = 0.15;
/** A landing this close past a floater's end still counts: in the player's favour. */
export const GRIP = 0.25;
/** Mangoes are picked up within this distance. */
export const REACH = 0.7;

export const VELA = 1, NOUKA = 2, PANA = 3, FERRY = 4;
export const LENGTH = [0, 2, 3, 2, 5] as const;
export const BANK = 0, WATER = 1, CHAR = 2;
export const UP = 1, DOWN = 2, LEFT = 3, RIGHT = 4;

/** কচুরিপানা in a ferry's wake goes under for DIP_UNDER seconds of every DIP_PERIOD, and sinks visibly for DIP_WARN before that. */
export const DIP_PERIOD = 5, DIP_UNDER = 1.2, DIP_WARN = 0.9;

// What happened in a step (a bit set the screen turns into sound and motion).
export const HOPPED = 1, SPLASHED = 2, MANGO = 4, ARRIVED = 8, FERRY_IN = 16, RESPAWNED = 32, BLOCKED = 64, EDGY = 128, NEAR = 256;

export type Floater = { kind: number; at: number; len: number; /** phase offset for a dipping কচুরিপানা, or -1 */ dip: number };
export type Lane = { type: number; dir: 1 | -1; speed: number; floaters: Floater[]; wake: boolean; ring: number };
/** On a floater (`floater` ≥ 0, `offset` from its left end) or lying on a চর (`floater` -1 at `x`). */
export type Mango = { row: number; floater: number; offset: number; x: number };
export type River = { level: number; seed: number; lanes: Lane[]; mangoes: Mango[]; rain: boolean; par: number; ferry: boolean };

export const mod = (value: number, by: number) => ((value % by) + by) % by;

/** Each river is the same river every time (its stars and best time mean something), so its seed is fixed. */
export const levelSeed = (level: number) => 1000 + level * 7919;

const LANES = [2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 6, 6, 7, 7, 8, 8, 8, 9, 9, 10, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12];
/**
 * Seconds for the time star. A careful player who picks up every mango (lib/solve.ts) takes m seconds;
 * PAR is m × 1.25 plus 0.9 s a row plus 2 s, rounded up. The tests recompute it for every river.
 */
export const PAR = [7, 8, 8, 10, 10, 11, 12, 17, 12, 21, 16, 13, 15, 15, 18, 17, 25, 23, 24, 22, 24, 19, 18, 24, 25, 33, 25, 26, 25, 28];

/** What each river adds: one new thing at a time (see the level list in content.ts). */
export function specOf(level: number) {
  const world = Math.ceil(level / 10), step = (level - 1) % 10;
  const water = LANES[level - 1];
  const speed = [0, 0.9 + step * 0.08, 1.2 + step * 0.07, 1.4 + step * 0.07][world];
  const gap: [number, number] = world === 1 ? [1, 1.25 + step * 0.25] : world === 2 ? [2, 3.75] : [2.25, 4];
  const kinds = level === 1 ? [VELA] : level === 2 ? [VELA, NOUKA] : [VELA, NOUKA, PANA];
  const chars = world === 1 ? 0 : level >= 24 ? 2 : 1;
  return { world, water, speed, gap, kinds, chars, pana: level >= 27 ? 1.5 : 2, ferry: level >= 13, wake: level >= 15 ? (level >= 25 ? 2 : 1) : 0, rain: world === 3, mangoes: level <= 3 ? 1 : world === 1 ? 2 : level >= 26 ? 4 : 3 };
}

/** Lengths and gaps for one lane's loop: every gap stays in [gap[0], gap[1]], so the next floater is never far. */
function fillLane(rng: () => number, kinds: readonly number[], gap: readonly [number, number], ring: number, pana: number, first?: number) {
  const list: number[] = first ? [first] : [];
  const size = (kind: number) => kind === PANA ? pana : LENGTH[kind];
  const used = () => list.reduce((sum, kind) => sum + size(kind), 0);
  while (used() + (list.length + 1) * gap[0] + 2 <= ring) list.push(kinds[Math.floor(rng() * kinds.length)]);
  while (used() + list.length * gap[0] > ring) list.pop();
  while (ring - used() > list.length * gap[1]) list.push(VELA);
  const spare = ring - used() - list.length * gap[0];
  const weights = list.map(() => 0.4 + rng()), total = weights.reduce((a, b) => a + b, 0);
  let gaps = weights.map(weight => gap[0] + spare * weight / total);
  if (gaps.some(value => value > gap[1])) gaps = list.map(() => gap[0] + spare / list.length);
  let at = rng() * ring;
  return list.map((kind, index) => { const floater = { kind, at: mod(at, ring), len: size(kind), dip: -1 }; at += size(kind) + gaps[index]; return floater; });
}

/** Builds river `level` from its seed. Pure: the same level always gives the same river. */
export function makeRiver(level: number, seed = levelSeed(level)): River {
  const spec = specOf(level), rng = makeRng(seed);
  const total = spec.water + spec.chars;
  // Chars split the water into even stretches.
  const charRows = new Set<number>();
  for (let index = 1; index <= spec.chars; index++) charRows.add(Math.round(index * (total + 1) / (spec.chars + 1)));
  const waterRows: number[] = [];
  for (let row = 1; row <= total; row++) if (!charRows.has(row)) waterRows.push(row);
  const ferryRow = spec.ferry ? waterRows[Math.floor(waterRows.length / 2)] : -1;
  // The wake rocks the lane just above the ferry (and, on the hardest rivers, the one below too).
  const wakeRows = new Set<number>();
  if (spec.wake >= 1) wakeRows.add(waterRows[waterRows.indexOf(ferryRow) + 1]);
  if (spec.wake >= 2) wakeRows.add(waterRows[waterRows.indexOf(ferryRow) - 1]);

  const land = (type: number): Lane => ({ type, dir: 1, speed: 0, floaters: [], wake: false, ring: RING });
  const lanes: Lane[] = [land(BANK)];
  let dir: 1 | -1 = rng() < 0.5 ? 1 : -1;
  for (let row = 1; row <= total; row++) {
    if (charRows.has(row)) { lanes.push(land(CHAR)); continue; }
    const wake = wakeRows.has(row), ferry = row === ferryRow;
    const kinds = wake ? [PANA, PANA, VELA] : spec.kinds;
    const ring = ferry ? FERRY_RING : RING;
    const floaters = fillLane(rng, kinds, spec.gap, ring, spec.pana, ferry ? FERRY : undefined);
    if (wake) for (const floater of floaters) if (floater.kind === PANA) floater.dip = rng() * DIP_PERIOD;
    const speed = Math.round(spec.speed * (0.8 + rng() * 0.45) * (ferry ? 1.15 : 1) * 100) / 100;
    lanes.push({ type: WATER, dir, speed, floaters, wake, ring });
    dir = dir === 1 ? -1 : 1; // neighbouring lanes always flow opposite ways, so a floater always comes past
  }
  lanes.push(land(BANK));

  // The first tap is a hop onto row 1: put a floater right in front of the kid at the start.
  const one = lanes[1];
  if (one.type === WATER) {
    const head = one.floaters.find(floater => floater.dip < 0) ?? one.floaters[0], shift = START_X - head.len / 2 + offOf(one) - head.at;
    for (const floater of one.floaters) floater.at = mod(floater.at + shift, one.ring);
  }

  const mangoes: Mango[] = [];
  const pool = waterRows.filter(row => row !== ferryRow && !wakeRows.has(row));
  for (let index = 0; index < spec.mangoes; index++) {
    const fromChar = index === spec.mangoes - 1 && charRows.size > 0 && spec.mangoes >= 3;
    if (fromChar) { mangoes.push({ row: [...charRows][0], floater: -1, offset: 0, x: 1.5 + Math.floor(rng() * 7) }); continue; }
    const options = pool.filter(row => !mangoes.some(mango => mango.row === row));
    const row = (options.length ? options : pool)[Math.floor(rng() * (options.length || pool.length))];
    // The floater nearest the middle of the screen at the start, so the mango is in sight from the first second.
    const lane = lanes[row];
    let floater = 0;
    lane.floaters.forEach((each, index) => { if (Math.abs(leftOf(lane, each, 0) + each.len / 2 - START_X) < Math.abs(leftOf(lane, lane.floaters[floater], 0) + lane.floaters[floater].len / 2 - START_X)) floater = index; });
    mangoes.push({ row, floater, offset: lanes[row].floaters[floater].len / 2, x: 0 });
  }
  mangoes.sort((a, b) => a.row - b.row);
  return { level, seed, lanes, mangoes, rain: spec.rain, par: PAR[level - 1], ferry: spec.ferry };
}

/** A floater's left end on screen (cells from the left edge; may be off screen). */
export const leftOf = (lane: Lane, floater: Floater, t: number) => mod(floater.at + lane.dir * lane.speed * t, lane.ring) - offOf(lane);

/** 0 above water, 0..1 while sinking (the warning), 1 under. */
export function dipOf(floater: Floater, t: number) {
  if (floater.dip < 0) return 0;
  const phase = mod(t + floater.dip, DIP_PERIOD), sinkAt = DIP_PERIOD - DIP_UNDER - DIP_WARN;
  return phase < sinkAt ? 0 : phase >= DIP_PERIOD - DIP_UNDER ? 1 : (phase - sinkAt) / DIP_WARN;
}

/**
 * The floater under x in this row at time t, or -1 (water). `margin` > 0 forgives a landing just past an end; < 0 demands that much inside.
 * `slack` widens a dipping কচুরিপানা's time under, both ways (the solver uses it to stay well clear).
 */
export function floaterAt(lane: Lane, x: number, t: number, margin = GRIP, slack = 0) {
  for (let index = 0; index < lane.floaters.length; index++) {
    const floater = lane.floaters[index];
    let d = mod(x + offOf(lane) - floater.at - lane.dir * lane.speed * t, lane.ring);
    if (d > lane.ring - Math.max(0, margin) - 1e-9) d -= lane.ring;
    if (d < -margin || d >= floater.len + margin) continue;
    if (floater.dip >= 0 && (dipOf(floater, t - slack) === 1 || dipOf(floater, t + slack) === 1 || (slack > 0 && dipOf(floater, t) === 1))) continue;
    return index;
  }
  return -1;
}

/** Can you stand at x in this row at time t? Banks and চর always hold you. */
export const holds = (lane: Lane, x: number, t: number, margin = GRIP, slack = 0) => lane.type !== WATER || floaterAt(lane, x, t, margin, slack) >= 0;

/** Where a mango is on screen right now. */
export function mangoX(river: River, mango: Mango, t: number) {
  if (mango.floater < 0) return mango.x;
  const lane = river.lanes[mango.row];
  return leftOf(lane, lane.floaters[mango.floater], t) + mango.offset;
}

/** Where a hop from (row, x) lands, or null when it can't go (the far edge, or back from the start bank). Banks and চর snap to a cell. */
export function target(river: River, row: number, x: number, action: number): [number, number] | null {
  const top = river.lanes.length - 1;
  if (action === UP) row = Math.min(top, row + 1);
  else if (action === DOWN) { if (row === 0) return null; row -= 1; }
  else { x += action === LEFT ? -1 : 1; if (x < 0.3 || x > COLS - 0.3) return null; }
  if (river.lanes[row].type !== WATER) x = Math.min(COLS - 0.5, Math.max(0.5, Math.round(x - 0.5) + 0.5));
  return [row, x];
}

export type Run = {
  river: River; t: number; row: number; x: number;
  /** The hop being drawn: from where, and how long is left. */
  fromRow: number; fromX: number; hop: number; queued: number; falling: boolean;
  /** Time left in the water before the kid is back on `safeRow`. */
  down: number; safeRow: number; safeX: number;
  splashes: number; taken: number; got: number;
  /** Quick hops in a row (each under 0.75 s after the last), for the rising hop sound. */
  chain: number; lastHop: number; surface: number;
  done: boolean; time: number; events: number;
  splashRow: number; splashX: number; ferryOn: number;
};

export function createRun(river: River): Run {
  return { river, t: 0, row: 0, x: START_X, fromRow: 0, fromX: START_X, hop: 0, queued: 0, falling: false, down: 0, safeRow: 0, safeX: START_X,
    splashes: 0, taken: 0, got: 0, chain: 0, lastHop: -9, surface: 0, done: false, time: 0, events: 0, splashRow: 0, splashX: START_X, ferryOn: ferryMask(river, 0) };
}

/** A tap or swipe. During a hop it waits for the landing (one is kept). Returns whether anything will happen. */
export function act(run: Run, action: number) {
  if (run.done || run.down > 0 || run.falling) return false;
  if (run.hop > 0) { run.queued = action; return true; }
  return hop(run, action);
}

function hop(run: Run, action: number) {
  const landing = target(run.river, run.row, run.x, action);
  if (!landing || (landing[0] === run.row && landing[1] === run.x)) { run.events |= BLOCKED; return false; }
  const [row, x] = landing, lane = run.river.lanes[row];
  run.fromRow = run.row; run.fromX = run.x; run.row = row; run.x = x; run.hop = HOP_T;
  run.chain = run.t - run.lastHop < 0.75 ? run.chain + 1 : 1;
  run.lastHop = run.t;
  run.events |= HOPPED;
  if (lane.type !== WATER) { run.surface = 0; run.safeRow = row; run.safeX = x; return true; }
  const index = floaterAt(lane, x, run.t);
  if (index < 0) { run.falling = true; return true; }
  const floater = lane.floaters[index];
  run.surface = floater.kind;
  if (floaterAt(lane, x, run.t, -0.05) < 0) {
    // Landed just past an end: the kid slides onto the floater instead of standing on water.
    const left = leftOf(lane, floater, run.t);
    run.x = Math.min(left + floater.len - 0.2, Math.max(left + 0.2, x));
    run.events |= EDGY;
  }
  return true;
}

function splash(run: Run, near: boolean) {
  run.splashes += 1; run.splashRow = run.row; run.splashX = run.x;
  run.falling = false; run.hop = 0; run.queued = 0; run.chain = 0;
  run.down = RESPAWN_T;
  run.events |= SPLASHED | (near ? NEAR : 0);
}

/** Bit i is set while ferry i (in lane order) is on screen; a new bit is the ferry coming into view. */
function ferryMask(river: River, t: number) {
  let mask = 0, bit = 1;
  for (const lane of river.lanes) for (const floater of lane.floaters) {
    if (floater.kind !== FERRY) continue;
    const left = leftOf(lane, floater, t);
    if (left < COLS && left + floater.len > 0) mask |= bit;
    bit <<= 1;
  }
  return mask;
}

/** Moves the river and the kid on by dt seconds. */
export function stepRun(run: Run, dt: number) {
  if (run.done) return;
  const river = run.river, top = river.lanes.length - 1;
  run.t += dt;
  if (river.ferry) { const mask = ferryMask(river, run.t); if (mask & ~run.ferryOn) run.events |= FERRY_IN; run.ferryOn = mask; }
  if (run.down > 0) {
    run.down -= dt;
    if (run.down <= 0) { run.down = 0; run.row = run.fromRow = run.safeRow; run.x = run.fromX = run.safeX; run.surface = 0; run.events |= RESPAWNED; }
    return;
  }
  if (run.hop > 0) {
    run.hop -= dt;
    if (run.hop <= 0) {
      run.hop = 0;
      if (run.falling) {
        // A miss by a hair gets a kinder word.
        const lane = river.lanes[run.row];
        splash(run, floaterAt(lane, run.x, run.t, GRIP + 0.35) >= 0);
        return;
      }
      if (run.row === top) { run.done = true; run.time = run.t; run.events |= ARRIVED; return; }
      collect(run); // on landing, even when the next hop is already waiting
      if (run.queued) { const next = run.queued; run.queued = 0; hop(run, next); if (run.falling) return; }
    }
  }
  if (run.falling) return;
  const lane = river.lanes[run.row];
  if (lane.type === WATER) {
    run.x += lane.dir * lane.speed * dt;
    if (run.x < -EDGE || run.x > COLS + EDGE || floaterAt(lane, run.x, run.t) < 0) { splash(run, false); return; }
  }
  if (run.hop === 0) collect(run);
}

function collect(run: Run) {
  const mangoes = run.river.mangoes;
  for (let index = 0; index < mangoes.length; index++) {
    const mango = mangoes[index];
    if (run.taken & (1 << index) || mango.row !== run.row) continue;
    if (Math.abs(mangoX(run.river, mango, run.t) - run.x) < REACH) { run.taken |= 1 << index; run.got += 1; run.events |= MANGO; }
  }
}

/** Hands over what happened since the last call and clears it. */
export function drain(run: Run) { const events = run.events; run.events = 0; return events; }

/** 1 star for reaching the far ghat, 1 for beating the river's time, 1 for every mango. */
export function starsOf(river: Pick<River, "par" | "mangoes">, seconds: number, mangoes: number) {
  return 1 + (seconds <= river.par ? 1 : 0) + (mangoes >= river.mangoes.length ? 1 : 0);
}

/** Time in tenths of a second, the unit of links and best times. */
export const tenths = (seconds: number) => Math.min(MAX_TENTHS, Math.max(1, Math.round(seconds * 10)));
export const MAX_TENTHS = 9999;
/** Nobody can cross faster than one hop per row. */
export const minTenths = (level: number) => Math.floor((LANES[level - 1] + specOf(level).chars + 1) * HOP_T * 10);
export const mangoCount = (level: number) => specOf(level).mangoes;

/** Where a returning player starts: the first open river not yet at three stars (river 1 for someone new). */
export function openingLevel(stars: Record<number, number>, unlocked: number) {
  for (let level = 1; level <= unlocked; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}
