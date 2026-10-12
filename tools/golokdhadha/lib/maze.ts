// Seeded mazes: a recursive backtracker (iterative, so a 15×15 never overflows the stack), BFS shortest paths and corridor runs.
// Pure and server-safe: share.ts uses it to check a link's maze.
import { makeRng, pick } from "../../../shared/game-core";

export const N = 1, E = 2, S = 4, W = 8;
export type Dir = 1 | 2 | 4 | 8;
export const DIRS: readonly Dir[] = [N, E, S, W];
export const OPPOSITE: Record<Dir, Dir> = { 1: 4, 2: 8, 4: 1, 8: 2 };

/** `open[cell]` is a bitmask of the sides you can walk through (N E S W). Cells run row by row; home is the top-left, the shop the bottom-right. */
export type Maze = { size: number; seed: number; open: Uint8Array; start: number; exit: number };

/** The cell next door, or -1 off the board. */
export function neighbour(size: number, cell: number, dir: Dir) {
  const row = Math.floor(cell / size), col = cell % size;
  if (dir === N) return row > 0 ? cell - size : -1;
  if (dir === S) return row < size - 1 ? cell + size : -1;
  if (dir === W) return col > 0 ? cell - 1 : -1;
  return col < size - 1 ? cell + 1 : -1;
}

export const canGo = (maze: Maze, cell: number, dir: Dir) => (maze.open[cell] & dir) !== 0;

/** Same seed and size, same maze, on every phone. Every cell is reachable and there's exactly one way between any two. */
export function makeMaze(size: number, seed: number): Maze {
  const rng = makeRng(seed), count = size * size, open = new Uint8Array(count), seen = new Uint8Array(count);
  const stack = [0];
  seen[0] = 1;
  while (stack.length) {
    const cell = stack[stack.length - 1];
    const options = DIRS.filter(dir => { const next = neighbour(size, cell, dir); return next >= 0 && !seen[next]; });
    if (!options.length) { stack.pop(); continue; }
    const dir = options[pick(rng, options.length)], next = neighbour(size, cell, dir);
    open[cell] |= dir;
    open[next] |= OPPOSITE[dir];
    seen[next] = 1;
    stack.push(next);
  }
  return { size, seed, open, start: 0, exit: count - 1 };
}

/** The shortest walk from `from` to `to` (both included), by breadth-first search; null if there's none. */
export function shortestPath(maze: Maze, from = maze.start, to = maze.exit): number[] | null {
  const previous = new Int32Array(maze.open.length).fill(-1);
  previous[from] = from;
  const queue = [from];
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head];
    if (cell === to) break;
    for (const dir of DIRS) {
      const next = neighbour(maze.size, cell, dir);
      if (next >= 0 && canGo(maze, cell, dir) && previous[next] < 0) { previous[next] = cell; queue.push(next); }
    }
  }
  if (previous[to] < 0) return null;
  const path = [to];
  while (path[path.length - 1] !== from) path.push(previous[path[path.length - 1]]);
  return path.reverse();
}

/** The side of `from` that leads to the next-door cell `to`, or 0 if they aren't neighbours. */
export function dirTo(size: number, from: number, to: number): Dir | 0 {
  return DIRS.find(dir => neighbour(size, from, dir) === to) ?? 0;
}

/**
 * A swipe: walk through `dir`, then keep following the corridor round its bends until a junction, a dead end, home or the shop.
 * Returns the cells passed (not including `from`); empty when a wall is in the way.
 */
export function run(maze: Maze, from: number, dir: Dir): number[] {
  if (!canGo(maze, from, dir)) return [];
  const cells: number[] = [];
  let cell = from, heading = dir;
  for (;;) {
    cell = neighbour(maze.size, cell, heading);
    cells.push(cell);
    if (cell === maze.exit || cell === maze.start) return cells;
    const ways = DIRS.filter(next => next !== OPPOSITE[heading] && canGo(maze, cell, next));
    if (ways.length !== 1) return cells;
    heading = ways[0];
  }
}

/** A tap: the cells on the way to `target` if it's in a straight, open line from `from`; otherwise null. */
export function straightTo(maze: Maze, from: number, target: number): number[] | null {
  const { size } = maze;
  if (target === from || target < 0 || target >= size * size) return null;
  const sameRow = Math.floor(from / size) === Math.floor(target / size), sameCol = from % size === target % size;
  if (!sameRow && !sameCol) return null;
  const dir: Dir = sameRow ? (target > from ? E : W) : (target > from ? S : N);
  const cells: number[] = [];
  for (let cell = from; cell !== target;) {
    if (!canGo(maze, cell, dir)) return null;
    cell = neighbour(size, cell, dir);
    cells.push(cell);
  }
  return cells;
}

/** How many swipes the shortest way takes when every swipe runs to the next junction: the decisions a player must make. */
export function swipesOnPath(maze: Maze, path: number[]) {
  let swipes = 0;
  for (let at = 0; at < path.length - 1;) {
    const cells = run(maze, path[at], dirTo(maze.size, path[at], path[at + 1]) as Dir);
    swipes++;
    at += cells.length;
  }
  return swipes;
}
