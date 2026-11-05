// The game's state and set-up: a 12×16 board fenced with tin, food from a seeded ঠোঙা, turns buffered so the snake can never fold back
// on itself. Everything is allocated here, once per run; the per-move rules in step.hot.ts only mutate it.
import { makeRng } from "../../../shared/game-core";
import { levelOf, rectCells, CELLS, COLS, ROWS } from "./levels";
import { placeFood } from "./step.hot";
import { cellOf, MAX_CROWS, QUEUE, START, type Crash, type Dir, type Kind } from "./rules";

export * from "./rules";

export { CELLS, COLS, ROWS };

export type Game = {
  rng: () => number;
  level: number;
  /** The body as a ring: segment i (0 = head) is ring[(head + i) % CELLS]. */
  ring: Int16Array; head: number; length: number;
  /** 1 where a body segment lies. */
  occ: Uint8Array;
  dir: Dir;
  /** Turns waiting for the next moves; each one is checked against the one before it. */
  queue: Int8Array; queued: number;
  food: number; kind: Kind;
  bonus: number; bonusLife: number;
  eaten: number; golden: number; score: number; moves: number;
  over: boolean; won: boolean; crash: Crash;
  /** 1 on a tin wall cell (levels only; the classic board has none). */
  wall: Uint8Array;
  /** Bites that clear the level; 0 in the classic endless game. */
  goal: number;
  /** Bites in a row, each within COMBO_MOVES of the last. */
  combo: number; lastBite: number;
  /** Food lands within this many cells of the head; 0 anywhere. */
  near: number;
  // Crows: where each stands, which way it walks along its line (+1 or -1), and its line's two ends.
  crows: number; crowAt: Int16Array; crowWay: Int8Array; crowFrom: Int16Array; crowTo: Int16Array; crowEvery: number;
  /** The move a crow last turned round on, for the caw. */
  crowTurned: number;
  // Pipes: the two mouths, or -1.
  pipeA: number; pipeB: number;
  // The rail gate: its cells, its timing, and whether it is shut now.
  gateCell: Uint8Array; gateCount: number; gatePeriod: number; gateShutFor: number; gateWarn: number; gateShut: boolean;
  /** Moves of the green chilli's burst left; levels with `hot` only. */
  hot: number; hotOn: boolean; sourOn: boolean;
};

/** Level 0 is the classic endless game; levels 1–12 add a goal, walls and their one new thing. Classic food draws are unchanged. */
export function createGame(seed: number, level = 0): Game {
  const data = level ? levelOf(level) : null;
  const wall = new Uint8Array(CELLS), gateCell = new Uint8Array(CELLS);
  if (data) for (const cell of rectCells(data.walls)) wall[cell] = 1;
  let gateCount = 0;
  if (data?.gate) for (const cell of rectCells([data.gate.cells])) { gateCell[cell] = 1; gateCount++; }
  const crows = data?.crows ?? [];
  const game: Game = {
    rng: makeRng(seed), level,
    ring: new Int16Array(CELLS), head: 0, length: 0, occ: new Uint8Array(CELLS),
    dir: 0, queue: new Int8Array(QUEUE), queued: 0,
    food: -1, kind: "muri", bonus: -1, bonusLife: 0, eaten: 0, golden: 0, score: 0, moves: 0, over: false, won: false, crash: "",
    wall, goal: data ? data.goal : 0, combo: 0, lastBite: -99, near: data?.near ?? 0,
    crows: crows.length, crowAt: new Int16Array(MAX_CROWS), crowWay: new Int8Array(MAX_CROWS), crowFrom: new Int16Array(MAX_CROWS), crowTo: new Int16Array(MAX_CROWS), crowEvery: data?.crowEvery ?? 2, crowTurned: -99,
    pipeA: data?.pipes ? cellOf(data.pipes[0], data.pipes[1]) : -1, pipeB: data?.pipes ? cellOf(data.pipes[2], data.pipes[3]) : -1,
    gateCell, gateCount, gatePeriod: data?.gate?.period ?? 0, gateShutFor: data?.gate?.shut ?? 0, gateWarn: data?.gate?.warn ?? 0, gateShut: false,
    hot: 0, hotOn: Boolean(data?.hot), sourOn: Boolean(data?.sour),
  };
  crows.forEach(([x0, y0, x1, y1], index) => {
    game.crowFrom[index] = cellOf(x0, y0); game.crowTo[index] = cellOf(x1, y1);
    game.crowAt[index] = cellOf(x0, y0); game.crowWay[index] = 1;
  });
  setBody(game, START);
  placeFood(game);
  return game;
}

/** Lays the body out from head to tail (set-up and tests). */
export function setBody(game: Game, cells: readonly number[]) {
  game.occ.fill(0);
  game.head = 0; game.length = cells.length;
  cells.forEach((cell, index) => { game.ring[index] = cell; game.occ[cell] = 1; });
}
/** Segment i of the body, 0 = the head. */
export const segment = (game: Game, index: number) => game.ring[(game.head + index) % CELLS];
export const headCell = (game: Game) => game.ring[game.head];
export const tailCell = (game: Game) => game.ring[(game.head + game.length - 1) % CELLS];
/** The body as a plain array, head first (tests and the card; never per frame). */
export const bodyCells = (game: Game) => Array.from({ length: game.length }, (_, index) => segment(game, index));

/** The heading the snake will have once every waiting turn is done. */
export const heading = (game: Game): Dir => (game.queued ? game.queue[game.queued - 1] : game.dir) as Dir;

/** Queues an absolute turn (swipe, arrow key). Ignores a repeat, a U-turn against the last queued heading, or a full queue. */
export function turn(game: Game, dir: Dir) {
  const last = heading(game);
  if (game.over || dir === last || (dir + 2) % 4 === last || game.queued >= QUEUE) return false;
  game.queue[game.queued++] = dir;
  return true;
}

/** A tap on the left (-1) or right (+1) half: turn to the snake's own left or right. */
export const turnSide = (game: Game, side: -1 | 1) => turn(game, ((heading(game) + side + 4) % 4) as Dir);

/** The waiting turns, oldest first (tests). */
export const queuedTurns = (game: Game) => Array.from(game.queue.subarray(0, game.queued)) as Dir[];
