// The rules on top of the physics, pure and server-safe:
// - a board from the ladder (lib/levels.ts): clear the white coins in a strike budget, blacks cost a strike, the queen needs cover;
// - দশ চাল: a seeded scatter and ten strikes for points (what old challenge links open);
// - দুজনে: our house rules on one phone.
// Every random choice comes from makeRng(seed), so a link lays out the same board on every phone.
import { makeRng } from "../../../shared/game-core";
import {
  createWorld, isFree, shoot, AIM_MAX, BASE_MAX, BASE_MIN, BASE_Y, BIG_STRIKER_R, BOARD, CENTRE, COIN_R, PER_SIDE, POCKET_X, POCKET_Y, QUEEN, STRIKER, STRIKER_R,
  type World,
} from "./table";
import { levelSpec, type LevelSpec } from "./levels";

export type Mode = "level" | "board" | "duo";
/** How much the guide shows: সহজ, মাঝারি, ওস্তাদ. */
export type Hand = "e" | "n" | "h";
/** 0 = সাদা (white, plays first, bottom), 1 = কালো (black, top). */
export type Side = 0 | 1;
export const STRIKES = 10;
export const QUEEN_POINTS = 3;
/** দশ চাল: 18 coins and the queen. দুজনে: the loser's 9 coins plus the queen. */
export const MAX_SOLO = 2 * PER_SIDE + QUEEN_POINTS;
export const MAX_DUO = PER_SIDE + QUEEN_POINTS;
/** The softest strike that counts; a pull shorter than this is a cancel. */
export const MIN_POWER = 0.06;

export type Note =
  | "start" | "miss" | "pocket" | "queen" | "foul" | "cover" | "queen-back" | "last-back" | "again" | "theirs" | "turn" | "won"
  | "black" | "clear" | "out";

export type Stats = {
  /** Pieces that went in and stayed in (whites in a board, every piece in দশ চাল). */
  pieces: number;
  fouls: number;
  blacks: number;
  /** The most pieces one strike sank. */
  most: number;
};

export type Game = {
  mode: Mode;
  /** The board on the ladder (1–15), or 0 for দশ চাল and দুজনে. */
  level: number;
  seed: number;
  hand: Hand;
  world: World;
  spec: LevelSpec | null;
  phase: "aim" | "moving" | "over";
  strikes: number;
  /** Strikes allowed: the board's budget, 10 for দশ চাল, none for দুজনে. */
  budget: number;
  turn: Side;
  queen: "board" | "pending" | "covered";
  queenBy: Side | -1;
  dues: [number, number];
  winner: Side | -1;
  note: Note;
  /** Points this strike (দশ চাল), or pieces this strike (a board). */
  gained: number;
  /** Where the striker sits on the shooter's own baseline, 0 (left) to 1 (right) as the shooter sees it. */
  u: number;
  stats: Stats;
  /** A board: every white needed is in (and the queen covered, if the board needs her). */
  cleared: boolean;
};

export const sideOf = (i: number): Side | -1 => i < PER_SIDE ? 0 : i < 2 * PER_SIDE ? 1 : -1;
const TAU = Math.PI * 2;

// ---- layouts ----

/** The opening pattern: the queen in the middle, a ring of 6, then 12, colours alternating so white makes a Y. Index order is fill order for cards. */
export function formation(): Array<{ x: number; y: number; side: Side | 2 }> {
  const d = 2 * COIN_R + 0.6, spots: Array<{ x: number; y: number; side: Side | 2 }> = [{ x: CENTRE, y: CENTRE, side: 2 }];
  const ring = (radius: number, offset: number) => {
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + offset + (k * TAU) / 6;
      spots.push({ x: CENTRE + radius * Math.cos(a), y: CENTRE + radius * Math.sin(a), side: (k % 2) as Side });
    }
  };
  ring(d, 0);
  ring(2 * d, 0);
  ring(d * Math.sqrt(3), Math.PI / 6);
  return spots;
}

function placeFormation(w: World, queen = true) {
  const counts = [0, 0];
  for (const spot of formation()) {
    if (spot.side === 2 && !queen) continue;
    const i = spot.side === 2 ? QUEEN : spot.side * PER_SIDE + counts[spot.side]++;
    w.x[i] = spot.x; w.y[i] = spot.y; w.on[i] = 1;
  }
}

const distToSegment = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
  const vx = bx - ax, vy = by - ay, len2 = vx * vx + vy * vy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / len2)) : 0;
  return Math.hypot(px - ax - t * vx, py - ay - t * vy);
};

/** An easy shot set up on purpose: striker spot S, coin C, pocket P, all in one straight line. */
export type Lane = { sx: number; cx: number; cy: number; pocket: number };

/**
 * The দশ চাল scatter: the queen near the middle, two coins lined up straight for the two far pockets (so the
 * first strike can always score), and the rest spread out, never inside a pocket's mouth and never on your baseline.
 * Unchanged from the first version, so old links lay out the same board.
 */
export function scatter(w: World, seed: number): Lane[] {
  const rng = makeRng(seed);
  const between = (a: number, b: number) => a + rng() * (b - a);
  const gap = 2 * COIN_R + 6;
  for (let attempt = 0; ; attempt++) {
    w.on.fill(0);
    const placed: number[] = [], lanes: Lane[] = [];
    const fits = (x: number, y: number, minGap: number) => placed.every(j => Math.hypot(w.x[j] - x, w.y[j] - y) >= minGap)
      && [0, 1, 2, 3].every(p => Math.hypot(POCKET_X[p] - x, POCKET_Y[p] - y) >= 80);
    const clearOfLanes = (x: number, y: number) => lanes.every(lane => distToSegment(x, y, lane.sx, BASE_Y, lane.cx, lane.cy) >= STRIKER_R + COIN_R + 8
      && distToSegment(x, y, lane.cx, lane.cy, POCKET_X[lane.pocket], POCKET_Y[lane.pocket]) >= 2 * COIN_R + 6);
    const put = (i: number, x: number, y: number) => { w.x[i] = x; w.y[i] = y; w.on[i] = 1; placed.push(i); };
    const relax = attempt > 40 ? 4 : 0;

    put(QUEEN, between(280, 460), between(230, 400));
    for (const [i, pocket] of [[0, 0], [PER_SIDE, 1]] as const) {
      for (let tries = 0; tries < 60; tries++) {
        const sx = between(250, 490), f = between(0.5, 0.68);
        const cx = sx + f * (POCKET_X[pocket] - sx), cy = BASE_Y + f * (POCKET_Y[pocket] - BASE_Y);
        const lane = { sx, cx, cy, pocket };
        if (!fits(cx, cy, gap) || !clearOfLanes(cx, cy) || placed.some(j => distToSegment(w.x[j], w.y[j], sx, BASE_Y, cx, cy) < STRIKER_R + COIN_R + 8 || distToSegment(w.x[j], w.y[j], cx, cy, POCKET_X[pocket], POCKET_Y[pocket]) < 2 * COIN_R + 6)) continue;
        put(i, cx, cy);
        lanes.push(lane);
        break;
      }
    }
    if (lanes.length < 2 && attempt < 80) continue;
    for (let i = 0; i < QUEEN; i++) {
      if (w.on[i]) continue;
      for (let tries = 0; tries < 200 && !w.on[i]; tries++) {
        const x = between(60, BOARD - 60), y = between(60, 560);
        if (fits(x, y, gap - relax) && clearOfLanes(x, y)) put(i, x, y);
      }
    }
    if (placed.length === QUEEN + 1) return lanes;
    if (attempt >= 80) {
      for (let i = 0; i < QUEEN; i++) for (let y = 60; y <= 560 && !w.on[i]; y += 20) for (let x = 60; x <= BOARD - 60 && !w.on[i]; x += 20) if (fits(x, y, gap)) put(i, x, y);
      return lanes;
    }
  }
}

/** A board from the ladder: its whites, blacks and queen where the data puts them, or the opening pattern. */
function placeLevel(w: World, spec: LevelSpec) {
  if (spec.pattern) { placeFormation(w); return; }
  spec.whites?.forEach(([x, y], k) => { w.x[k] = x; w.y[k] = y; w.on[k] = 1; });
  spec.blacks?.forEach(([x, y], k) => { w.x[PER_SIDE + k] = x; w.y[PER_SIDE + k] = y; w.on[PER_SIDE + k] = 1; });
  if (spec.queen) { w.x[QUEEN] = spec.queen[0]; w.y[QUEEN] = spec.queen[1]; w.on[QUEEN] = 1; }
}

/** Puts a returned coin on the centre spot, or the nearest free spot around it. */
export function returnToCentre(w: World, i: number) {
  w.pocket[i] = -1;
  for (let k = 0; k < 9; k++) {
    const steps = k === 0 ? 1 : 6 * k, radius = k * (2 * COIN_R + 1);
    for (let s = 0; s < steps; s++) {
      const a = (s * TAU) / steps, x = CENTRE + radius * Math.cos(a), y = CENTRE + radius * Math.sin(a);
      if (isFree(w, x, y, w.r[i], i)) { w.x[i] = x; w.y[i] = y; w.on[i] = 1; return; }
    }
  }
  w.x[i] = CENTRE; w.y[i] = CENTRE; w.on[i] = 1;
}

// ---- the striker ----

/** The striker's spot for the shooter. The top player sees the board turned round, so their left is our right. */
export function strikerSpot(side: Side, u: number) {
  const x = BASE_MIN + Math.min(1, Math.max(0, u)) * (BASE_MAX - BASE_MIN);
  return side === 0 ? { x, y: BASE_Y } : { x: BOARD - x, y: BOARD - BASE_Y };
}

export const shooter = (g: Game): Side => g.mode === "duo" ? g.turn : 0;

/** Moves the striker to u on the shooter's baseline. Returns false when a coin is in the way there. */
export function placeStriker(g: Game, u: number) {
  g.u = Math.min(1, Math.max(0, u));
  const w = g.world, spot = strikerSpot(shooter(g), g.u);
  w.x[STRIKER] = spot.x; w.y[STRIKER] = spot.y; w.vx[STRIKER] = w.vy[STRIKER] = 0; w.on[STRIKER] = 1; w.pocket[STRIKER] = -1;
  return isFree(w, spot.x, spot.y, w.r[STRIKER], STRIKER);
}

export const strikerFree = (g: Game) => isFree(g.world, g.world.x[STRIKER], g.world.y[STRIKER], g.world.r[STRIKER], STRIKER);

/** The nearest free spot to u on the baseline (or u itself if the whole line is covered, which 19 coins can't really do). */
export function nearestFree(g: Game, u: number) {
  for (let k = 0; k <= 100; k++) {
    for (const candidate of k ? [u - k / 100, u + k / 100] : [u]) {
      if (candidate < 0 || candidate > 1) continue;
      const spot = strikerSpot(shooter(g), candidate);
      if (isFree(g.world, spot.x, spot.y, g.world.r[STRIKER], STRIKER)) return candidate;
    }
  }
  return u;
}

export const strikerRadius = (hand: Hand) => hand === "e" ? BIG_STRIKER_R : STRIKER_R;

/** The aim, an angle from straight up the board in the shooter's own view, as a direction on the board. */
export function aimDirection(g: Game, angle: number) {
  const a = Math.max(-AIM_MAX, Math.min(AIM_MAX, angle)), dx = Math.sin(a), dy = -Math.cos(a);
  return shooter(g) === 1 ? { dx: -dx, dy: -dy } : { dx, dy };
}

/** The angle (shooter's view) that points the striker at board point (x, y). */
export function angleTo(g: Game, x: number, y: number) {
  const w = g.world;
  let dx = x - w.x[STRIKER], dy = y - w.y[STRIKER];
  if (shooter(g) === 1) { dx = -dx; dy = -dy; }
  return Math.atan2(dx, -dy);
}

// ---- new games ----

function blank(mode: Mode, level: number, seed: number, hand: Hand, spec: LevelSpec | null, budget: number): Game {
  const world = createWorld();
  world.r[STRIKER] = strikerRadius(hand);
  return {
    mode, level, seed, hand, world, spec, phase: "aim", strikes: 0, budget, turn: 0, queen: "board", queenBy: -1, dues: [0, 0], winner: -1,
    note: "start", gained: 0, u: 0.5, stats: { pieces: 0, fouls: 0, blacks: 0, most: 0 }, cleared: false,
  };
}

/** A board from the ladder. The striker starts where the board's data says, so the first strike's aim makes sense. */
export function newLevel(level: number, hand: Hand): Game {
  const spec = levelSpec(level);
  const g = blank("level", level, spec.seed, hand, spec, spec.strikes);
  placeLevel(g.world, spec);
  placeStriker(g, nearestFree(g, spec.u));
  return g;
}

/** দশ চাল on a seeded scatter. `level` keeps an old board's number for its best score. */
export function newBoard(seed: number, hand: Hand): Game {
  const g = blank("board", 0, seed, hand, null, STRIKES);
  scatter(g.world, seed);
  placeStriker(g, nearestFree(g, 0.5));
  return g;
}

export function newDuo(seed: number, hand: Hand): Game {
  const g = blank("duo", 0, seed, hand, null, 0);
  placeFormation(g.world);
  placeStriker(g, nearestFree(g, 0.5));
  return g;
}

/** A deep copy, for looking ahead (the bots try a strike before they take it). */
export function cloneGame(g: Game): Game {
  const w = g.world;
  const world = {
    ...w, x: w.x.slice(), y: w.y.slice(), vx: w.vx.slice(), vy: w.vy.slice(), r: w.r.slice(), m: w.m.slice(), on: w.on.slice(),
    pocket: w.pocket.slice(), order: w.order.slice(), sunk: w.sunk.slice(),
  };
  return { ...g, world, dues: [g.dues[0], g.dues[1]], stats: { ...g.stats } };
}

// ---- counting ----

export const onBoard = (w: World, side: Side) => { let n = 0; for (let i = side * PER_SIDE; i < (side + 1) * PER_SIDE; i++) n += w.on[i]; return n; };

/** দশ চাল points: 1 for every coin in a pocket, 3 for the queen. */
export function soloPoints(w: World) {
  let points = 0;
  for (let i = 0; i < QUEEN; i++) if (!w.on[i]) points++;
  return points + (w.on[QUEEN] ? 0 : QUEEN_POINTS);
}

/** দুজনে board points for the winner: the other side's coins still on the board, plus 3 if the winner covered the queen. */
export function duoPoints(g: Game) {
  if (g.winner === -1) return 0;
  return onBoard(g.world, (1 - g.winner) as Side) + (g.queen === "covered" && g.queenBy === g.winner ? QUEEN_POINTS : 0);
}

/** A board: the whites placed, the whites it needs, and how many are in. */
export function whites(g: Game) {
  const total = g.spec?.pattern ? PER_SIDE : g.spec?.whites?.length ?? 0;
  return { total, need: g.spec?.need ?? total, inside: total - onBoard(g.world, 0) };
}
/** The board can't be cleared until the queen is in and covered. */
export const needsQueen = (g: Game) => Boolean(g.spec?.needQueen);
export const strikesLeft = (g: Game) => g.budget ? Math.max(0, g.budget - g.strikes) : Infinity;

/** Stars for a cleared board from strikes used: par or fewer is three, `two` or fewer is two, any clear is one. */
export function levelStars(g: Game) {
  if (g.mode !== "level" || !g.cleared || !g.spec) return 0;
  return g.strikes <= g.spec.par ? 3 : g.strikes <= g.spec.two ? 2 : 1;
}

// ---- a strike ----

export type Fired = "ok" | "busy" | "weak" | "blocked";

/** Flicks the striker at `angle` (shooter's view) with `power` 0–1. The size of the striker is fixed for the whole game. */
export function fire(g: Game, angle: number, power: number): Fired {
  if (g.phase !== "aim") return "busy";
  if (power < MIN_POWER) return "weak";
  if (!strikerFree(g)) return "blocked";
  const { dx, dy } = aimDirection(g, angle);
  shoot(g.world, dx, dy, power);
  g.phase = "moving";
  return "ok";
}

/** The most recently pocketed coin of a side (or of either side when side is -1), never the queen. A coin a board never placed doesn't count. */
function latest(w: World, side: Side | -1) {
  let best = -1;
  for (let i = 0; i < QUEEN; i++) {
    if (w.on[i] || w.pocket[i] < 0 || (side !== -1 && sideOf(i) !== side)) continue;
    if (best === -1 || w.order[i] > w.order[best]) best = i;
  }
  return best;
}

function sunkThisShot(w: World) {
  const list: number[] = [];
  for (let k = 0; k < w.sunkCount; k++) if (w.sunk[k] !== STRIKER) list.push(w.sunk[k]);
  return list;
}

/** দশ চাল: every piece counts, the queen 3. Striker in a pocket: this strike's pieces come back, plus one earlier coin. */
function settleBoard(g: Game) {
  const w = g.world, sunk = sunkThisShot(w);
  const foul = !w.on[STRIKER];
  g.strikes++;
  if (foul) {
    for (const i of sunk) returnToCentre(w, i);
    const penalty = latest(w, -1);
    if (penalty !== -1) returnToCentre(w, penalty);
    g.note = "foul";
    g.gained = 0;
    g.stats.fouls++;
  } else {
    g.gained = sunk.reduce((sum, i) => sum + (i === QUEEN ? QUEEN_POINTS : 1), 0);
    g.note = sunk.includes(QUEEN) ? "queen" : sunk.length ? "pocket" : "miss";
    g.stats.most = Math.max(g.stats.most, sunk.length);
  }
  let left = 0;
  for (let i = 0; i < STRIKER; i++) left += w.on[i];
  g.stats.pieces = 2 * PER_SIDE + 1 - left;
  if (g.strikes >= g.budget || left === 0) g.phase = "over";
}

/**
 * A board from the ladder. Whites are yours. A black that goes in comes back to the middle and costs one more strike.
 * The queen must be covered by a white in the same or the next strike, or she comes back. A board that needs her won't
 * take its last white before she is covered. Striker in a pocket: this strike's whites and queen come back, plus one earlier white.
 */
function settleLevel(g: Game) {
  const w = g.world, sunk = sunkThisShot(w);
  const own = sunk.filter(i => sideOf(i) === 0), blacks = sunk.filter(i => sideOf(i) === 1), queenIn = sunk.includes(QUEEN);
  const foul = !w.on[STRIKER];
  g.strikes++;
  let note: Note;
  for (const i of blacks) returnToCentre(w, i);
  if (blacks.length) { g.strikes += blacks.length; g.stats.blacks += blacks.length; }
  if (foul) {
    for (const i of own) returnToCentre(w, i);
    if (queenIn) returnToCentre(w, QUEEN);
    if (g.queen === "pending") { returnToCentre(w, QUEEN); g.queen = "board"; g.queenBy = -1; }
    const penalty = latest(w, 0);
    if (penalty !== -1) returnToCentre(w, penalty);
    g.stats.fouls++;
    note = "foul";
  } else {
    note = own.length ? "pocket" : blacks.length ? "black" : "miss";
    if (g.queen === "pending") {
      if (own.length) { g.queen = "covered"; note = "cover"; }
      else { returnToCentre(w, QUEEN); g.queen = "board"; g.queenBy = -1; note = "queen-back"; }
    }
    if (queenIn) {
      g.queenBy = 0;
      if (own.length) { g.queen = "covered"; note = "cover"; }
      else { g.queen = "pending"; note = "queen"; }
    }
    g.stats.most = Math.max(g.stats.most, own.length + (queenIn ? 1 : 0));
    // A board that needs the queen keeps its last white until she is covered.
    if (needsQueen(g) && g.queen !== "covered" && onBoard(w, 0) === 0) {
      const coin = latest(w, 0);
      if (coin !== -1) { returnToCentre(w, coin); note = "last-back"; }
    }
  }
  const count = whites(g);
  g.stats.pieces = count.inside;
  g.gained = foul ? 0 : own.length;
  g.cleared = count.inside >= count.need && (!needsQueen(g) || g.queen === "covered");
  if (g.cleared) { g.phase = "over"; note = "clear"; }
  else if (g.strikes >= g.budget) { g.phase = "over"; note = "out"; }
  g.note = note;
}

/**
 * Our house rules for two players: own coin in → play again; the queen must be covered by an own coin in the same or the
 * next strike, or it goes back; striker in a pocket → foul: this strike's own coins and queen come back, plus one penalty
 * coin (owed if you have none), turn over; an opponent's coin stays in and ends the turn; nobody's last coin may go in
 * before the queen is covered (it comes back); the side whose nine coins are all in, with the queen covered, wins.
 */
function settleDuo(g: Game) {
  const w = g.world, me = g.turn, them = (1 - me) as Side;
  const sunk = sunkThisShot(w);
  const own = sunk.filter(i => sideOf(i) === me), theirs = sunk.filter(i => sideOf(i) === them), queenIn = sunk.includes(QUEEN);
  const foul = !w.on[STRIKER];
  g.strikes++;
  let note: Note;
  if (foul) {
    for (const i of own) returnToCentre(w, i);
    if (queenIn) returnToCentre(w, QUEEN);
    if (g.queen === "pending") { returnToCentre(w, QUEEN); g.queen = "board"; g.queenBy = -1; }
    const penalty = latest(w, me);
    if (penalty !== -1) returnToCentre(w, penalty); else g.dues[me]++;
    g.turn = them;
    g.stats.fouls++;
    note = "foul";
  } else {
    let again = own.length > 0;
    note = again ? "again" : theirs.length ? "theirs" : "turn";
    if (g.queen === "pending") {
      if (own.length) { g.queen = "covered"; note = "cover"; }
      else { returnToCentre(w, QUEEN); g.queen = "board"; g.queenBy = -1; note = "queen-back"; }
    }
    if (queenIn) {
      g.queenBy = me;
      if (own.length) { g.queen = "covered"; note = "cover"; }
      else { g.queen = "pending"; again = true; note = "queen"; }
    }
    while (g.dues[me] > 0) {
      const coin = latest(w, me);
      if (coin === -1) break;
      returnToCentre(w, coin);
      g.dues[me]--;
    }
    g.stats.most = Math.max(g.stats.most, sunk.length);
    if (!again) g.turn = them;
  }
  for (const side of [me, them]) {
    if (onBoard(w, side) > 0 || g.queen === "covered") continue;
    const coin = latest(w, side);
    if (coin !== -1) { returnToCentre(w, coin); note = "last-back"; }
  }
  if (g.queen === "covered") {
    if (onBoard(w, me) === 0) g.winner = me;
    else if (onBoard(w, them) === 0) g.winner = them;
  }
  if (g.winner !== -1) { g.phase = "over"; note = "won"; }
  g.note = note;
}

/** Call once the discs have stopped after a strike. Applies the rules and puts the striker back for the next one. */
export function settle(g: Game) {
  if (g.mode === "level") settleLevel(g); else if (g.mode === "board") settleBoard(g); else settleDuo(g);
  if (g.phase !== "over") g.phase = "aim";
  placeStriker(g, nearestFree(g, g.u));
  return g.note;
}
