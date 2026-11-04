// Headless players for the level tests. They play through lib/game.ts exactly as the page does (play, one gap step at a
// time), with seeded randomness, so every rate the tests assert is the same on every run.
import { makeRng, pick } from "../../../shared/game-core";
import { neighbour, opposite, place, shuffled, solve, step, type Board, type Dir } from "../lib/board";
import { levelBoard, play, startGame, type Game } from "../lib/game";
import { LEVELS } from "../lib/levels";

const DIRS: readonly Dir[] = [0, 1, 2, 3];

// ---- an exact distance-to-solved table for every ৩×৩ plate (one breadth-first search from solved, ~0.3 s once) ----
const FACT = [40320, 5040, 720, 120, 24, 6, 2, 1, 1];
function rank(cells: ArrayLike<number>) {
  let r = 0;
  for (let i = 0; i < 9; i++) { let smaller = 0; for (let j = i + 1; j < 9; j++) if (cells[j] < cells[i]) smaller++; r += smaller * FACT[i]; }
  return r;
}
function unrank(r: number, out: number[]) {
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = 0; i < 9; i++) { const index = Math.floor(r / FACT[i]); r %= FACT[i]; out[i] = pool.splice(index, 1)[0]; }
}
let table: Uint8Array | null = null;
export function distances() {
  if (table) return table;
  const dist = new Uint8Array(362880).fill(255), queue = new Int32Array(181440);
  const cells: number[] = [];
  let head = 0, tail = 0;
  const start = rank([1, 2, 3, 4, 5, 6, 7, 8, 0]);
  dist[start] = 0; queue[tail++] = start;
  while (head < tail) {
    const key = queue[head++];
    unrank(key, cells);
    const gap = cells.indexOf(0);
    for (const dir of DIRS) {
      const next = neighbour(3, gap, dir);
      if (next < 0) continue;
      cells[gap] = cells[next]; cells[next] = 0;
      const child = rank(cells);
      if (dist[child] === 255) { dist[child] = dist[key] + 1; queue[tail++] = child; }
      cells[next] = cells[gap]; cells[gap] = 0;
    }
  }
  table = dist;
  return dist;
}
/** The fewest moves left from a ৩×৩ arrangement (cells row by row, 0 the gap). */
export const distance3 = (cells: ArrayLike<number>) => distances()[rank(cells)];

/** The true shortest path for a ৩×৩ arrangement, from the table. */
function shortest3(start: number[]): Dir[] {
  const cells = start.slice(), path: Dir[] = [];
  for (let d = distance3(cells); d > 0; d--) {
    const gap = cells.indexOf(0);
    for (const dir of DIRS) {
      const next = neighbour(3, gap, dir);
      if (next < 0) continue;
      cells[gap] = cells[next]; cells[next] = 0;
      if (distance3(cells) === d - 1) { path.push(dir); break; }
      cells[next] = cells[gap]; cells[gap] = 0;
    }
  }
  return path;
}

function run(board: Board, tiles: number[], locked: boolean[], path: Dir[]) {
  const steps = place(board, tiles, locked);
  if (!steps) throw new Error("stuck");
  for (const dir of steps) { board = step(board, dir)!; path.push(dir); }
  for (const tile of tiles) locked[tile - 1] = true;
  return board;
}

/**
 * The method a person learns. On ৩×৩: ১ first, then ২ and ৩ as a pair, ৪ and ৭ as a pair, then the last little square;
 * never the true shortest. On bigger plates: lib/board.ts solve's layers (row, then column, the last two of each as a
 * pair), with the final ৩×৩ corner solved from the table, so a replan after a slip is fast. Same length as solve().
 */
export function method(start: Board): Dir[] {
  const { size } = start, path: Dir[] = [], locked: boolean[] = Array(size * size).fill(false);
  let board = start;
  const at = (row: number, col: number) => row * size + col + 1;
  if (size === 3) {
    board = run(board, [1], locked, path);
    board = run(board, [2, 3], locked, path);
    board = run(board, [4, 7], locked, path);
    run(board, [5, 6, 8], locked, path);
    return path;
  }
  let top = 0, left = 0;
  while (size - top > 3) {
    for (let col = left; col < size - 2; col++) board = run(board, [at(top, col)], locked, path);
    board = run(board, [at(top, size - 2), at(top, size - 1)], locked, path);
    top++;
    for (let row = top; row < size - 2; row++) board = run(board, [at(row, left)], locked, path);
    board = run(board, [at(size - 2, left), at(size - 1, left)], locked, path);
    left++;
  }
  // the corner as its own ৩×৩: relabel each ঘুঁটি by its home inside the corner
  const mini: number[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const tile = board.cells[(top + r) * size + left + c];
    mini.push(tile ? (Math.floor((tile - 1) / size) - top) * 3 + ((tile - 1) % size - left) + 1 : 0);
  }
  return path.concat(shortest3(mini));
}

/** The strong bot: the true shortest on ৩×৩; on bigger plates the layered solver, or the shuffle undone when that is shorter. */
export function strong(level: number): Game {
  const board = levelBoard(level);
  let path: Dir[];
  if (board.size === 3) path = shortest3(board.cells);
  else {
    const [seed, steps] = LEVELS[level - 1], undone = shuffled(board.size, seed, steps).path.slice().reverse().map(opposite);
    const solver = solve(board);
    path = solver.length <= undone.length ? solver : undone;
  }
  let game = startGame(level);
  for (const dir of path) game = play(game, [dir])!;
  return game;
}

/**
 * The casual bot: a patient person who knows the method but wanders. One push in `slipEvery` goes a random way (never
 * straight back, which the page would cancel), and they carry on with the method from wherever the plate is now.
 */
export function casual(level: number, seed: number, slipEvery = 8, limit = 6000): Game {
  const rng = makeRng(seed);
  let game = startGame(level), plan = method(game.board).reverse(), last: Dir | -1 = -1;
  for (let i = 0; i < limit && !game.won; i++) {
    let dir: Dir;
    if (pick(rng, slipEvery) === 0 || !plan.length) {
      const options = DIRS.filter(option => neighbour(game.board.size, game.board.gap, option) >= 0 && (last === -1 || option !== opposite(last)));
      dir = options[pick(rng, options.length)];
      game = play(game, [dir])!;
      plan = game.won ? [] : method(game.board).reverse();
    } else {
      dir = plan.pop()!;
      game = play(game, [dir])!;
    }
    last = dir;
  }
  return game;
}

/**
 * A first-timer: pushes whatever brings ঘুঁটি nearer home by eye (the sum of distances), one push in `wild` at random,
 * and happily pushes a wrong one straight back.
 */
export function firstTimer(level: number, seed: number, taps: number, wild = 5) {
  const rng = makeRng(seed);
  let game = startGame(level);
  const spread = (board: Board) => {
    let sum = 0;
    board.cells.forEach((tile, cell) => { if (tile) sum += Math.abs((tile - 1) % board.size - cell % board.size) + Math.abs(Math.floor((tile - 1) / board.size) - Math.floor(cell / board.size)); });
    return sum;
  };
  for (let i = 0; i < taps && !game.won; i++) {
    const options = DIRS.filter(option => neighbour(game.board.size, game.board.gap, option) >= 0);
    let dir = options[pick(rng, options.length)];
    if (pick(rng, wild) !== 0) {
      let best = Infinity;
      for (const option of options) { const after = spread(play(game, [option])!.board); if (after < best) { best = after; dir = option; } }
    }
    game = play(game, [dir])!;
  }
  return game;
}
