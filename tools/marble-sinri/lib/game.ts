// The stairs, the fairness rule and the physics step. Pure: no DOM, no React, so tests and share.ts can load it.
// Same seed + same starting stage → the same ledges, pots and marbles on every phone.
import { makeRng } from "../../../shared/game-core";

/** The board, in its own units: 360 wide, 480 tall. The marble rolls on the top surface of each ledge. */
export const W = 360, H = 480, R = 11, TOP = 20, GAP = 90, LEDGE = 12, FIRST_Y = 170;
/** Sideways speed while a side is held, gravity, and the fastest fall. */
export const VX = 190, G = 1500, VMAX = 620;
/** A cactus pot's width; the marble is hurt within CLEAR of its centre. A landing spot needs SAFE of clear ledge. */
export const POT = 22, CLEAR = 18, SAFE = 34;
export const STEP = 1 / 60, ROOM = 12;
/** Seconds of slack the fairness rule leaves for reaction and frame steps. */
export const MARGIN = 0.12;
export const CHANCES = 3, REFILL = 5, RESPAWN = 0.7, STAGE_ROWS = 20;

export type Kind = "parapet" | "concrete" | "bamboo";
export const KINDS: readonly Kind[] = ["parapet", "concrete", "bamboo"];

/** Eight stages down a building and the bamboo scaffolding next door. Each is faster, with narrower ledges and more cactus pots. */
export const STAGES = [
  { name: "ছাদ", kind: "parapet", speed: 50, width: [112, 150], pots: 0.12 },
  { name: "চিলেকোঠা", kind: "parapet", speed: 60, width: [104, 140], pots: 0.18 },
  { name: "সিঁড়িঘর", kind: "concrete", speed: 70, width: [96, 132], pots: 0.22 },
  { name: "চারতলা", kind: "concrete", speed: 80, width: [90, 124], pots: 0.26 },
  { name: "দোতলা", kind: "concrete", speed: 90, width: [84, 116], pots: 0.3 },
  { name: "বাঁশের ভারা", kind: "bamboo", speed: 100, width: [78, 108], pots: 0.34 },
  { name: "মাচা", kind: "bamboo", speed: 112, width: [72, 100], pots: 0.38 },
  { name: "গলি", kind: "bamboo", speed: 124, width: [66, 96], pots: 0.42 },
] as const satisfies ReadonlyArray<{ name: string; kind: Kind; speed: number; width: readonly [number, number]; pots: number }>;
export const STAGE_COUNT = STAGES.length;

/** 0-based stage for a row; the last stage never ends. */
export const stageOf = (row: number) => Math.min(STAGE_COUNT - 1, Math.floor(row / STAGE_ROWS));
export const speedAt = (row: number) => STAGES[stageOf(row)].speed;
/** First row of a 1-based stage. */
export const startRowOf = (stage: number) => (stage - 1) * STAGE_ROWS;
export const isStage = (stage: number) => Number.isInteger(stage) && stage >= 1 && stage <= STAGE_COUNT;

/** Glass marbles: the first is yours from the start, each cleared stage adds the next. */
export const MARBLES = [
  { name: "সবুজ কাচ", glass: "#2e9e6a", eye: "#f4d35e" },
  { name: "আকাশি", glass: "#3a9bd8", eye: "#ffffff" },
  { name: "লাল সুতো", glass: "#d64545", eye: "#ffe3a3" },
  { name: "হলুদ রোদ", glass: "#e8b923", eye: "#d6452b" },
  { name: "জামরঙা", glass: "#5b3a8c", eye: "#9ee0c8" },
  { name: "কমলা", glass: "#ee7b30", eye: "#2b5d8a" },
  { name: "দুধসাদা", glass: "#e9e4d8", eye: "#3a9bd8" },
  { name: "কাজল", glass: "#33363d", eye: "#ee7b30" },
  { name: "সোনালি", glass: "#c9a227", eye: "#7a2e1d" },
] as const;
/** Colours open on this phone: one per cleared stage, from the stars saved by useLevels. */
export const openColours = (stars: Record<number, number>) => MARBLES.map((_, index) => index === 0 || (stars[index] ?? 0) >= 1);

export type Ledge = { row: number; x0: number; x1: number; y: number; kind: Kind; pot: number; pick: number; picked: boolean };
/** A stretch of ledge free of the pot. `left`/`right`: the marble can drop off that end (no pot in the way, not against a wall). */
export type Segment = { x0: number; x1: number; left: boolean; right: boolean };

export function segments(ledge: Ledge): Segment[] {
  const leftFree = ledge.x0 >= R + 2, rightFree = ledge.x1 <= W - R - 2;
  if (ledge.pot < 0) return [{ x0: ledge.x0, x1: ledge.x1, left: leftFree, right: rightFree }];
  const out: Segment[] = [];
  if (ledge.pot - CLEAR > ledge.x0) out.push({ x0: ledge.x0, x1: ledge.pot - CLEAR, left: leftFree, right: false });
  if (ledge.pot + CLEAR < ledge.x1) out.push({ x0: ledge.pot + CLEAR, x1: ledge.x1, left: false, right: rightFree });
  return out;
}
export const landable = (ledge: Ledge) => segments(ledge).filter(segment => segment.x1 - segment.x0 >= SAFE);

/** Seconds to fall one GAP onto the next ledge, which rises at `speed` while the marble drops from rest. */
export function fallTime(speed: number) {
  const capAt = VMAX / G, capDrop = 0.5 * G * capAt * capAt + speed * capAt;
  if (GAP <= capDrop) return (-speed + Math.sqrt(speed * speed + 2 * G * GAP)) / G;
  return capAt + (GAP - capDrop) / (VMAX + speed);
}

/** Where a marble dropping off `edge` can land on `ledge`: the nearest safe point within reach, or NaN. `room`: how wide the safe window must be. */
export function landingPoint(ledge: Ledge, edge: number, reach: number, inset = 4, room = 0) {
  const lo = Math.max(R, edge - reach), hi = Math.min(W - R, edge + reach);
  let best = NaN;
  for (const segment of landable(ledge)) {
    const from = Math.max(lo, segment.x0 + inset), to = Math.min(hi, segment.x1 - inset);
    if (to - from < room) continue;
    const point = Math.min(to, Math.max(from, edge));
    if (Number.isNaN(best) || Math.abs(point - edge) < Math.abs(best - edge)) best = point;
  }
  return best;
}

/**
 * The fairness rule. From ANY spot on ledge `a`, a marble that sets off at once can drop onto a safe part of `b` (the next row)
 * before `b` has risen one GAP, at rise speed `speed`. So a player who keeps pace with the stairs is never trapped:
 * the ledge under them never gets closer to the top. Slower speeds only make it easier (tested).
 */
export function reachable(a: Ledge, b: Ledge, speed: number) {
  const air = fallTime(speed), reach = VX * (air - STEP), roll = GAP / speed - MARGIN - air - STEP;
  if (roll <= 0) return false;
  const parts = segments(a);
  if (!parts.length) return false;
  for (const segment of parts) {
    // A window of at least ROOM px, so a human hand has something to aim at.
    const left = segment.left && !Number.isNaN(landingPoint(b, segment.x0, reach, 4, ROOM));
    const right = segment.right && !Number.isNaN(landingPoint(b, segment.x1, reach, 4, ROOM));
    if (!left && !right) return false;
    const worst = left && right ? (segment.x1 - segment.x0) / 2 : segment.x1 - segment.x0;
    if (worst / VX > roll) return false;
  }
  return true;
}

const FULL: Ledge = { row: 0, x0: 0, x1: W, y: 0, kind: "concrete", pot: -1, pick: -1, picked: false };

/** The generator for one run's stairs, row after row. */
export function makeStairs(seed: number, stage: number) {
  const start = startRowOf(stage), rng = makeRng((seed ^ Math.imul(stage, 0x9e3779b1)) >>> 0);
  const spec = STAGES[stage - 1], half = spec.width[1] / 2;
  const first: Ledge = { row: start, x0: W / 2 - half, x1: W / 2 + half, y: FIRST_Y, kind: spec.kind, pot: -1, pick: -1, picked: false };
  const between = (lo: number, hi: number) => lo + rng() * (hi - lo);

  function build(prev: Ledge, x0: number, width: number, potted: boolean): Ledge {
    const row = prev.row + 1, spec = STAGES[stageOf(row)];
    x0 = Math.max(0, Math.min(W - width, x0));
    if (x0 < 16) x0 = 0;
    if (W - (x0 + width) < 16) x0 = W - width;
    const x1 = x0 + width;
    const pot = potted ? between(x0 + CLEAR, x1 - CLEAR) : -1;
    const kind = rng() < 0.75 ? spec.kind : KINDS[Math.floor(rng() * KINDS.length)];
    return { row, x0, x1, y: prev.y + GAP, kind, pot, pick: -1, picked: false };
  }

  function next(prev: Ledge): Ledge {
    const row = prev.row + 1, spec = STAGES[stageOf(row)], speed = speedAt(row), after = speedAt(row + 1);
    const reach = VX * (fallTime(speed) - STEP), exits = segments(prev).flatMap(s => [...(s.left ? [s.x0] : []), ...(s.right ? [s.x1] : [])]);
    let ledge: Ledge | null = null;
    for (let attempt = 0; attempt < 60 && !ledge; attempt++) {
      const width = between(spec.width[0], spec.width[1]);
      let centre: number;
      if (rng() < 0.3 || !exits.length) centre = (prev.x0 + prev.x1) / 2 + (rng() - 0.5) * 60;
      else centre = exits[Math.floor(rng() * exits.length)] + (rng() * 2 - 1) * reach * 0.9 + (rng() - 0.5) * width * 0.6;
      const potted = row - start >= 8 && rng() < spec.pots && width >= SAFE + 2 * CLEAR;
      const candidate = build(prev, centre - width / 2, width, potted);
      if (landable(candidate).length && reachable(prev, candidate, speed) && reachable(candidate, FULL, after)) ledge = candidate;
    }
    // Last resort: a plain narrow ledge right under the first way off `prev`.
    ledge ??= build(prev, (exits[0] ?? (prev.x0 + prev.x1) / 2) - spec.width[0] / 2, spec.width[0], false);
    // Marbles to collect: the first two rows always have one, so the first ting comes in seconds.
    if (rng() < (row - start <= 2 ? 1 : 0.4)) {
      const spots = landable(ledge), spot = spots[Math.floor(rng() * spots.length)];
      if (spot) ledge.pick = between(spot.x0 + 8, spot.x1 - 8);
    }
    return ledge;
  }

  return { first, next };
}

export const LAND = 1, PICK = 2, HURT = 4, CLEAR_STAGE = 8, OVER = 16, BONUS = 32;
export type Hurt = "top" | "bottom" | "cactus";

export type Run = {
  seed: number; stage: number; start: number;
  rows: Ledge[]; next: (prev: Ledge) => Ledge;
  x: number; y: number; vy: number; roll: number; on: Ledge | null; skip: Ledge | null;
  deepest: number; marbles: number; chances: number; streak: number; stageHits: number;
  cleared: Array<{ stage: number; stars: number }>;
  wait: number; time: number; over: boolean; events: number; hurt: Hurt | null; speed: number;
};

export function newRun(seed: number, stage = 1): Run {
  const stairs = makeStairs(seed, stage), rows = [stairs.first];
  while (rows[rows.length - 1].y < H + GAP) rows.push(stairs.next(rows[rows.length - 1]));
  const first = stairs.first;
  return {
    seed, stage, start: first.row, rows, next: stairs.next,
    x: W / 2, y: first.y - R, vy: 0, roll: 0, on: first, skip: null,
    deepest: first.row, marbles: 0, chances: CHANCES, streak: 0, stageHits: 0, cleared: [],
    wait: 0, time: 0, over: false, events: 0, hurt: null, speed: speedAt(first.row),
  };
}

export const scoreOf = (run: Run) => run.deepest - run.start;
/** Stars for a cleared stage: none of the three chances lost = 3, one = 2, more = 1. */
export const stageStars = (hits: number) => Math.max(1, 3 - hits);

/** A lost chance: the marble comes back on a safe spot near the middle, on a row no higher than its deepest. */
function hurt(run: Run, kind: Hurt) {
  run.events |= HURT;
  run.hurt = kind;
  run.chances--;
  run.stageHits++;
  run.streak = 0;
  if (run.chances <= 0) { run.over = true; run.events |= OVER; run.on = null; return; }
  let home: Ledge | null = null;
  for (const ledge of run.rows) {
    if (ledge.row < run.deepest || ledge.y < H * 0.3 || ledge.y > H - 50 || !landable(ledge).length) continue;
    if (!home || Math.abs(ledge.y - H * 0.45) < Math.abs(home.y - H * 0.45)) home = ledge;
  }
  home ??= run.rows.find(ledge => ledge.row >= run.deepest && ledge.y > TOP + 2 * R + 40 && landable(ledge).length) ?? run.rows[run.rows.length - 2];
  const spot = landable(home).reduce((a, b) => (b.x1 - b.x0 > a.x1 - a.x0 ? b : a), landable(home)[0] ?? { x0: home.x0, x1: home.x1, left: false, right: false });
  run.on = home; run.skip = null; run.vy = 0;
  run.x = (spot.x0 + spot.x1) / 2; run.y = home.y - R;
  run.wait = RESPAWN;
}

function reach(run: Run, row: number) {
  if (row <= run.deepest) return;
  const before = Math.floor(run.deepest / STAGE_ROWS), after = Math.floor(row / STAGE_ROWS);
  for (let stage = before; stage < after && stage < STAGE_COUNT; stage++) {
    run.cleared.push({ stage: stage + 1, stars: stageStars(run.stageHits) });
    run.stageHits = 0;
    run.events |= CLEAR_STAGE;
  }
  run.deepest = row;
  run.speed = speedAt(row);
}

/**
 * One fixed step. `dir` is -1 (left held), 0 or 1. Sets `run.events` (bit flags) for sounds and words.
 * The world pauses for RESPAWN seconds after a lost chance so the player can find the marble again.
 */
export function step(run: Run, dt: number, dir: number) {
  run.events = 0;
  if (run.over) return;
  if (run.wait > 0) { run.wait = Math.max(0, run.wait - dt); return; }
  run.time += dt;
  const rise = run.speed * dt, rows = run.rows;
  for (let i = 0; i < rows.length; i++) rows[i].y -= rise;
  while (rows[rows.length - 1].y < H + GAP) rows.push(run.next(rows[rows.length - 1]));
  while (rows.length > 1 && rows[0].y < -LEDGE - 4) rows.shift();

  const before = run.x;
  run.x = Math.max(R, Math.min(W - R, run.x + dir * VX * dt));
  run.roll += (run.x - before) / R;

  const on = run.on;
  if (on) {
    run.y = on.y - R;
    if (on.pot >= 0 && Math.abs(run.x - on.pot) < CLEAR) { hurt(run, "cactus"); return; }
    if (run.x < on.x0 || run.x > on.x1) { run.on = null; run.skip = on; run.vy = 0; }
  } else {
    const bottom = run.y + R;
    run.vy = Math.min(VMAX, run.vy + G * dt);
    run.y += run.vy * dt;
    for (let i = 0; i < rows.length; i++) {
      const ledge = rows[i];
      if (ledge === run.skip || run.x < ledge.x0 || run.x > ledge.x1) continue;
      if (bottom <= ledge.y + rise + 0.01 && run.y + R >= ledge.y) {
        run.on = ledge; run.skip = null; run.vy = 0; run.y = ledge.y - R;
        run.events |= LAND;
        if (ledge.pot >= 0 && Math.abs(run.x - ledge.pot) < CLEAR) { hurt(run, "cactus"); return; }
        reach(run, ledge.row);
        break;
      }
    }
  }

  for (let i = 0; i < rows.length; i++) {
    const ledge = rows[i];
    if (ledge.pick < 0 || ledge.picked || Math.abs(run.x - ledge.pick) > R + 6 || Math.abs(run.y - (ledge.y - 7)) > R + 7) continue;
    ledge.picked = true;
    run.marbles++;
    run.streak++;
    run.events |= PICK;
    if (run.marbles % REFILL === 0 && run.chances < CHANCES) { run.chances++; run.events |= BONUS; }
  }

  if (run.y - R <= TOP) hurt(run, "top");
  else if (run.y - R > H) hurt(run, "bottom");
}

/** The ledge one row below `ledge`, if it is on the board yet. */
export const below = (run: Run, ledge: Ledge) => run.rows.find(other => other.row === ledge.row + 1) ?? null;
