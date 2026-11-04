// A maze with its pieces: walls, one-way lanes, gates with their keys, and রিকশা stands that carry you across.
// Pure and allocation-free past setup: the solver, the bots and step.hot.ts all walk it with the same rules.
import { DIRS, E, N, OPPOSITE, S, W, neighbour, type Dir, type Maze } from "./maze";

export { DIRS, E, N, OPPOSITE, S, W, neighbour, type Dir };

/**
 * Cells run row by row. `open[cell]` has a bit per side you can walk through (N E S W), set on both sides of a passage.
 * `oneWay[cell]` marks sides you may not leave through although they're open: the far end of a one-way lane.
 * `gate[cell * 4 + side]` is the colour (1 or 2) of a gate on that side, on both sides of it; you pass with that key.
 * `key[cell]` is the key lying there (0 for none). `portal[cell]` is the other stand of a রিকশা pair, or -1.
 * `dark` is the lantern's reach in cells, 0 for a lit maze.
 */
export type Board = {
  size: number; seed: number; world: number; dark: number;
  open: Uint8Array; oneWay: Uint8Array; gate: Uint8Array; key: Uint8Array; portal: Int16Array;
  start: number; exit: number;
};

/** N E S W → 0 1 2 3. */
export const SIDE = new Uint8Array(9);
SIDE[N] = 0; SIDE[E] = 1; SIDE[S] = 2; SIDE[W] = 3;
/** Screen steps for each side: [dx, dy]. */
export const DX = new Int8Array(9), DY = new Int8Array(9);
DX[E] = 1; DX[W] = -1; DY[N] = -1; DY[S] = 1;

export function emptyBoard(size: number, seed: number, world = 0): Board {
  const count = size * size;
  return {
    size, seed, world, dark: 0,
    open: new Uint8Array(count), oneWay: new Uint8Array(count), gate: new Uint8Array(count * 4), key: new Uint8Array(count),
    portal: new Int16Array(count).fill(-1), start: 0, exit: count - 1,
  };
}

/** A plain maze (the old levels and the old daily) as a board with no pieces. */
export function boardFromMaze(maze: Maze, world = 0): Board {
  const board = emptyBoard(maze.size, maze.seed, world);
  board.open.set(maze.open);
  board.start = maze.start; board.exit = maze.exit;
  return board;
}

export const gateAt = (board: Board, cell: number, dir: Dir) => board.gate[cell * 4 + SIDE[dir]];

/** Can you walk from `cell` through `dir`, holding the keys in `mask` (bit 1 and bit 2)? */
export function passable(board: Board, cell: number, dir: Dir, mask: number) {
  if (!(board.open[cell] & dir) || board.oneWay[cell] & dir) return false;
  const colour = board.gate[cell * 4 + SIDE[dir]];
  return colour === 0 || (mask & colour) !== 0;
}

/** Why a side is shut: 0 open, 1 a wall, 2 a gate whose key you lack, 3 a one-way lane from its wrong end. */
export function blockedBy(board: Board, cell: number, dir: Dir, mask: number) {
  if (!(board.open[cell] & dir)) return 1;
  if (board.oneWay[cell] & dir) return 3;
  const colour = board.gate[cell * 4 + SIDE[dir]];
  return colour !== 0 && (mask & colour) === 0 ? 2 : 0;
}

/**
 * Arriving at `cell` heading `heading` in the middle of a walk: the way the lane carries on, or 0 to stop here.
 * The walker stops at home, at a junction and at a dead end (pickups, rides and the shop are handled by the caller).
 */
export function onward(board: Board, cell: number, heading: Dir, mask: number): Dir | 0 {
  if (cell === board.start || cell === board.exit) return 0;
  const back = OPPOSITE[heading];
  let way: Dir | 0 = 0, count = 0;
  for (let i = 0; i < 4; i++) {
    const dir = DIRS[i];
    if (dir !== back && passable(board, cell, dir, mask)) { way = dir; count++; }
  }
  return count === 1 ? way : 0;
}

/** How many sides of `cell` you could leave through (the junction count, for tests and the card). */
export function exits(board: Board, cell: number, mask: number) {
  let count = 0;
  for (let i = 0; i < 4; i++) if (passable(board, cell, DIRS[i], mask)) count++;
  return count;
}

/** The side of `from` that leads to the next-door `to`, or 0. */
export function sideTo(size: number, from: number, to: number): Dir | 0 {
  for (let i = 0; i < 4; i++) if (neighbour(size, from, DIRS[i]) === to) return DIRS[i];
  return 0;
}

/* ---------- building (gen.ts) ---------- */

export function openWall(board: Board, cell: number, dir: Dir) {
  const next = neighbour(board.size, cell, dir);
  if (next < 0) return;
  board.open[cell] |= dir; board.open[next] |= OPPOSITE[dir];
}
export function closeWall(board: Board, cell: number, dir: Dir) {
  const next = neighbour(board.size, cell, dir);
  if (next < 0) return;
  board.open[cell] &= ~dir; board.open[next] &= ~OPPOSITE[dir];
  board.oneWay[cell] &= ~dir; board.oneWay[next] &= ~OPPOSITE[dir];
  board.gate[cell * 4 + SIDE[dir]] = 0; board.gate[next * 4 + SIDE[OPPOSITE[dir]]] = 0;
}
/** The passage from `cell` through `dir` may now only be walked that way. */
export function makeOneWay(board: Board, cell: number, dir: Dir) {
  const next = neighbour(board.size, cell, dir);
  board.oneWay[cell] &= ~dir;
  board.oneWay[next] |= OPPOSITE[dir];
}
export function setGate(board: Board, cell: number, dir: Dir, colour: number) {
  const next = neighbour(board.size, cell, dir);
  board.gate[cell * 4 + SIDE[dir]] = colour;
  board.gate[next * 4 + SIDE[OPPOSITE[dir]]] = colour;
}

/** A short fingerprint of everything on the board: tests pin each level's, so a shipped maze never changes under a link. */
export function checksum(board: Board) {
  let hash = 2166136261 >>> 0;
  const mix = (value: number) => { hash = Math.imul(hash ^ (value & 0xffff), 16777619) >>> 0; };
  mix(board.size); mix(board.start); mix(board.exit); mix(board.dark * 10);
  for (let i = 0; i < board.open.length; i++) { mix(board.open[i] | (board.oneWay[i] << 4)); mix(board.key[i] | ((board.portal[i] + 1) << 2)); }
  for (let i = 0; i < board.gate.length; i++) if (board.gate[i]) mix(i * 4 + board.gate[i]);
  return hash.toString(36);
}
