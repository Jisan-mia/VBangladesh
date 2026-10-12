// The tin plate: ঘুঁটি, the gap, slides, seeded shuffles and a solver. Pure and server-safe.
import { makeRng, pick } from "../../../shared/game-core";

/** `cells[i]` is the ঘুঁটি in cell i (row by row); 0 is the gap. Solved: 1, 2, … then the gap in the last cell. */
export type Board = { size: number; cells: number[]; gap: number };
/** Where the gap steps: up, down, left, right. The ঘুঁটি on that side slides the other way into it. */
export type Dir = 0 | 1 | 2 | 3;
export const opposite = (dir: Dir) => (dir ^ 1) as Dir;
const DIRS: readonly Dir[] = [0, 1, 2, 3];

export function solvedBoard(size: number): Board {
  const count = size * size;
  return { size, cells: Array.from({ length: count }, (_, i) => (i + 1) % count), gap: count - 1 };
}

/** The cell next to `cell` on side `dir`, or -1 off the plate. */
export function neighbour(size: number, cell: number, dir: Dir) {
  const row = Math.floor(cell / size), col = cell % size;
  if (dir === 0) return row > 0 ? cell - size : -1;
  if (dir === 1) return row < size - 1 ? cell + size : -1;
  if (dir === 2) return col > 0 ? cell - 1 : -1;
  return col < size - 1 ? cell + 1 : -1;
}

/** The gap steps one cell (a ঘুঁটি slides into it), or null at the edge. */
export function step(board: Board, dir: Dir): Board | null {
  const next = neighbour(board.size, board.gap, dir);
  if (next < 0) return null;
  const cells = board.cells.slice();
  cells[board.gap] = cells[next];
  cells[next] = 0;
  return { size: board.size, cells, gap: next };
}

export const isSolved = (board: Board) => board.cells.every((tile, i) => tile === (i + 1) % board.cells.length);

/** Rows (from the top) whose ঘুঁটি are all home; the last row only counts when the whole plate is solved. */
export function rowsDone(board: Board) {
  let done = 0;
  for (let row = 0; row < board.size; row++) {
    let whole = true;
    for (let col = 0; col < board.size; col++) {
      const cell = row * board.size + col;
      if (board.cells[cell] !== (cell + 1) % board.cells.length) { whole = false; break; }
    }
    if (whole) done++;
  }
  return done;
}

/** A seeded shuffle: the gap wanders `steps` legal steps from solved, never straight back, so every plate can be solved. */
export function shuffled(size: number, seed: number, steps: number) {
  const rng = makeRng(seed);
  let board = solvedBoard(size), last: Dir | -1 = -1;
  const path: Dir[] = [];
  for (let i = 0; i < steps; i++) {
    const options = DIRS.filter(dir => dir !== (last === -1 ? -1 : opposite(last)) && neighbour(size, board.gap, dir) >= 0);
    const dir = options[pick(rng, options.length)];
    board = step(board, dir)!;
    path.push(dir);
    last = dir;
  }
  return { board, path };
}

/** The gap steps that slide a whole line so the ঘুঁটি in `cell` moves; null unless it shares the gap's row or column. */
export function lineTo(board: Board, cell: number): Dir[] | null {
  const { size, gap } = board;
  if (!Number.isInteger(cell) || cell < 0 || cell >= size * size || cell === gap) return null;
  const [row, col, gapRow, gapCol] = [Math.floor(cell / size), cell % size, Math.floor(gap / size), gap % size];
  if (row === gapRow) return Array<Dir>(Math.abs(col - gapCol)).fill(col < gapCol ? 2 : 3);
  if (col === gapCol) return Array<Dir>(Math.abs(row - gapRow)).fill(row < gapRow ? 0 : 1);
  return null;
}

/**
 * Fewest gap steps that bring `tiles` home while never touching a `locked` cell. Breadth-first search over the gap and
 * those ঘুঁটি's cells (the others can be pushed anywhere). With every ঘুঁটি of a 3×3 plate it is the true shortest solution.
 */
export function place(board: Board, tiles: readonly number[], locked: readonly boolean[] = []): Dir[] | null {
  const { size } = board, base = size * size, count = tiles.length;
  const pos = tiles.map(tile => board.cells.indexOf(tile)), home = tiles.map(tile => tile - 1);
  const encode = (gap: number) => { let key = gap; for (let i = 0; i < count; i++) key = key * base + pos[i]; return key; };
  const decode = (key: number) => { for (let i = count - 1; i >= 0; i--) { pos[i] = key % base; key = (key - pos[i]) / base; } return key; };
  const atHome = () => { for (let i = 0; i < count; i++) if (pos[i] !== home[i]) return false; return true; };
  if (atHome()) return [];
  const start = encode(board.gap);
  const from = new Map<number, number>([[start, -1]]), via = new Map<number, Dir>();
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const key = queue[head];
    for (const dir of DIRS) {
      const gap = decode(key), next = neighbour(size, gap, dir);
      if (next < 0 || locked[next]) continue;
      const moved = pos.indexOf(next);
      if (moved >= 0) pos[moved] = gap;
      const child = encode(next);
      if (from.has(child)) continue;
      from.set(child, key);
      via.set(child, dir);
      if (atHome()) {
        const path: Dir[] = [];
        for (let at = child; at !== start; at = from.get(at)!) path.push(via.get(at)!);
        return path.reverse();
      }
      queue.push(child);
    }
  }
  return null;
}

/** Appends a gap step, cancelling it against the step before when it goes straight back. */
export function pushStep(path: Dir[], dir: Dir) {
  if (path.length && path[path.length - 1] === opposite(dir)) path.pop();
  else path.push(dir);
}

/**
 * A solution the way a patient person solves it: the top row, then the left column, again and again until a 3×3 corner
 * is left, which is solved exactly. The last two ঘুঁটি of each line go in together, so the corner trick comes for free.
 * Not the shortest for 4×4 and 5×5, but always a real, playable solution. `enough` stops early (a hint needs one step).
 */
export function solve(start: Board, enough = Infinity): Dir[] {
  const { size } = start;
  let board = start;
  const path: Dir[] = [], locked: boolean[] = Array(size * size).fill(false);
  const run = (tiles: number[]) => {
    const steps = place(board, tiles, locked);
    if (!steps) throw new Error("unsolvable plate");
    for (const dir of steps) { board = step(board, dir)!; pushStep(path, dir); }
    for (const tile of tiles) locked[tile - 1] = true;
  };
  const at = (row: number, col: number) => row * size + col + 1;
  let top = 0, left = 0;
  while (size - top > 3) {
    for (let col = left; col < size - 2; col++) { run([at(top, col)]); if (path.length >= enough) return path; }
    run([at(top, size - 2), at(top, size - 1)]);
    top++;
    for (let row = top; row < size - 2; row++) { run([at(row, left)]); if (path.length >= enough) return path; }
    run([at(size - 2, left), at(size - 1, left)]);
    left++;
    if (path.length >= enough) return path;
  }
  const rest: number[] = [];
  for (let row = top; row < size; row++) for (let col = left; col < size; col++) if (row < size - 1 || col < size - 1) rest.push(at(row, col));
  run(rest);
  return path;
}

/** 30 levels: 3×3 (১–৮) for 1–10, the classic 4×4 for 11–25, 5×5 for 26–30. */
export const LEVEL_COUNT = 30;
export const sizeOf = (level: number) => level <= 10 ? 3 : level <= 25 ? 4 : 5;
