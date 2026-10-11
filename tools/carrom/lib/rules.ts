// Game rules on top of the physics: the opening pattern, the seeded scatter for "দশ চাল", and our house rules for two players.
// Pure and server-safe; every random choice comes from makeRng(seed), so a challenge link lays out the same board.
import { makeRng } from "../../../shared/game-core";
import {
  createWorld, isFree, BASE_MAX, BASE_MIN, BASE_Y, BIG_STRIKER_R, BOARD, CENTRE, COIN_R, POCKET_X, POCKET_Y, QUEEN, STRIKER, STRIKER_R,
  type World,
} from "./physics";

export type Mode = "solo" | "duo";
/** 0 = সাদা (white, plays first, bottom), 1 = কালো (black, top). */
export type Side = 0 | 1;
export const STRIKES = 10;
export const PER_SIDE = 9;
export const QUEEN_POINTS = 3;
/** Solo: 18 coins and the queen. Duo: the loser's 9 coins plus the queen. */
export const MAX_SOLO = 2 * PER_SIDE + QUEEN_POINTS;
export const MAX_DUO = PER_SIDE + QUEEN_POINTS;

export type Note = "start" | "miss" | "pocket" | "queen" | "foul" | "cover" | "queen-back" | "last-back" | "again" | "theirs" | "turn" | "won";

export type Game = {
  mode: Mode;
  seed: number;
  world: World;
  phase: "aim" | "moving" | "over";
  strikes: number;
  turn: Side;
  queen: "board" | "pending" | "covered";
  queenBy: Side | -1;
  dues: [number, number];
  winner: Side | -1;
  note: Note;
  /** Solo: points this strike. */
  gained: number;
  /** Where the striker sits on the shooter's own baseline, 0 (left) to 1 (right) as the shooter sees it. */
  u: number;
};

export const sideOf = (i: number): Side | -1 => i < PER_SIDE ? 0 : i < 2 * PER_SIDE ? 1 : -1;
const TAU = Math.PI * 2;

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

function placeFormation(w: World) {
  const counts = [0, 0];
  for (const spot of formation()) {
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
 * The "দশ চাল" scatter: the queen near the middle, two coins lined up straight for the two far pockets (so the
 * first strike can always score), and the rest spread out, never inside a pocket's mouth and never on your baseline.
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
        // Nothing may sit on this lane, and this coin may not sit on the earlier lane.
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
      // Never reached for real seeds (tests check), but a board must never start with coins "already pocketed".
      for (let i = 0; i < QUEEN; i++) for (let y = 60; y <= 560 && !w.on[i]; y += 20) for (let x = 60; x <= BOARD - 60 && !w.on[i]; x += 20) if (fits(x, y, gap)) put(i, x, y);
      return lanes;
    }
  }
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

export function setStrikerSize(g: Game, big: boolean) {
  g.world.r[STRIKER] = big ? BIG_STRIKER_R : STRIKER_R;
}

export function newGame(mode: Mode, seed: number, big = false): Game {
  const world = createWorld();
  const game: Game = { mode, seed, world, phase: "aim", strikes: 0, turn: 0, queen: "board", queenBy: -1, dues: [0, 0], winner: -1, note: "start", gained: 0, u: 0.5 };
  if (mode === "solo") scatter(world, seed); else placeFormation(world);
  setStrikerSize(game, big);
  placeStriker(game, nearestFree(game, 0.5));
  return game;
}

export const onBoard = (w: World, side: Side) => { let n = 0; for (let i = side * PER_SIDE; i < (side + 1) * PER_SIDE; i++) n += w.on[i]; return n; };

/** Solo points: 1 for every coin in a pocket, 3 for the queen. */
export function soloPoints(w: World) {
  let points = 0;
  for (let i = 0; i < QUEEN; i++) if (!w.on[i]) points++;
  return points + (w.on[QUEEN] ? 0 : QUEEN_POINTS);
}
export const coinsIn = (w: World) => { let n = 0; for (let i = 0; i < QUEEN; i++) if (!w.on[i]) n++; return n; };

/** Duo board points for the winner: the other side's coins still on the board, plus 3 if the winner covered the queen. */
export function duoPoints(g: Game) {
  if (g.winner === -1) return 0;
  return onBoard(g.world, (1 - g.winner) as Side) + (g.queen === "covered" && g.queenBy === g.winner ? QUEEN_POINTS : 0);
}

/** The most recently pocketed coin of a side (or of either side when side is -1), never the queen. */
function latest(w: World, side: Side | -1) {
  let best = -1;
  for (let i = 0; i < QUEEN; i++) {
    if (w.on[i] || (side !== -1 && sideOf(i) !== side)) continue;
    if (best === -1 || w.order[i] > w.order[best]) best = i;
  }
  return best;
}

function sunkThisShot(w: World) {
  const list: number[] = [];
  for (let k = 0; k < w.sunkCount; k++) list.push(w.sunk[k]);
  return list;
}

/** Solo "দশ চাল": every piece counts, the queen 3. Striker in a pocket: this strike's pieces come back, plus one earlier coin. */
function settleSolo(g: Game) {
  const w = g.world, sunk = sunkThisShot(w).filter(i => i !== STRIKER);
  const foul = !w.on[STRIKER];
  g.strikes++;
  if (foul) {
    for (const i of sunk) returnToCentre(w, i);
    const penalty = latest(w, -1);
    if (penalty !== -1) returnToCentre(w, penalty);
    g.note = "foul";
    g.gained = 0;
  } else {
    g.gained = sunk.reduce((sum, i) => sum + (i === QUEEN ? QUEEN_POINTS : 1), 0);
    g.note = sunk.includes(QUEEN) ? "queen" : sunk.length ? "pocket" : "miss";
  }
  let left = 0;
  for (let i = 0; i < STRIKER; i++) left += w.on[i];
  if (g.strikes >= STRIKES || left === 0) g.phase = "over";
}

/**
 * Our house rules for two players (see RULES in link.ts for the wording):
 * own coin in → play again; the queen must be covered by an own coin in the same or the next strike, or it goes back;
 * striker in a pocket → foul: this strike's own coins and queen come back, plus one penalty coin (owed if you have none), turn over;
 * an opponent's coin stays in and ends the turn; nobody's last coin may go in before the queen is covered (it comes back);
 * the side whose nine coins are all in, with the queen covered, wins the board.
 */
function settleDuo(g: Game) {
  const w = g.world, me = g.turn, them = (1 - me) as Side;
  const sunk = sunkThisShot(w).filter(i => i !== STRIKER);
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
    // A coin owed from an earlier foul is paid with the first coin you pocket.
    while (g.dues[me] > 0) {
      const coin = latest(w, me);
      if (coin === -1) break;
      returnToCentre(w, coin);
      g.dues[me]--;
    }
    if (!again) g.turn = them;
  }
  // Nobody finishes before the queen is covered: a last coin that goes in early comes back.
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

/** Call once the discs have stopped after a shot. Applies the rules and puts the striker back for the next shot. */
export function settle(g: Game) {
  if (g.mode === "solo") settleSolo(g); else settleDuo(g);
  if (g.phase !== "over") g.phase = "aim";
  placeStriker(g, nearestFree(g, g.u));
  return g.note;
}
