// A plain look-ahead player. It proves every level can be cleared (tests) and sets each level's par (scripts/make-levels.ts).
// Spawns are seeded, so it can look ahead exactly: no guessing where the next আঁটি falls.
import { slide, spawn, DIRS, STONE, type Dir } from "./board";
import { move, plot } from "./game";

/** Big tiles hug a corner along a snake, with room to spare. */
function worth(cells: readonly number[], size: number) {
  let value = 0, empty = 0;
  for (let cell = 0; cell < cells.length; cell++) {
    const stage = cells[cell];
    if (stage === 0) { empty++; continue; }
    if (stage === STONE) continue;
    const row = Math.floor(cell / size), col = cell % size, along = row % 2 ? size - 1 - col : col;
    value += 4 ** stage * 4 ** ((size * size - (row * size + along)) / size);
  }
  return value * (1 + empty * 0.1) + empty * 50;
}

function search(cells: readonly number[], size: number, seed: number, index: number, depth: number): number {
  if (!depth) return worth(cells, size);
  let best = -1;
  for (const dir of DIRS) {
    const done = slide(cells, size, dir);
    if (!done) continue;
    const placed = spawn(done.cells, seed, index);
    if (placed) done.cells[placed.cell] = placed.stage;
    best = Math.max(best, search(done.cells, size, seed, index + 1, depth - 1));
  }
  return best;
}

/** The bot's next swipe from a board, given the seed and how many moves have been made. Null when stuck. */
export function botMove(cells: readonly number[], size: number, seed: number, moves: number, depth = 3): Dir | null {
  let pick: Dir | null = null, best = -Infinity;
  for (const dir of DIRS) {
    const done = slide(cells, size, dir);
    if (!done) continue;
    const placed = spawn(done.cells, seed, moves + 2);
    if (placed) done.cells[placed.cell] = placed.stage;
    const value = search(done.cells, size, seed, moves + 3, depth - 1);
    if (value > best) { best = value; pick = dir; }
  }
  return pick;
}

/** The bot's move count to reach `target` on a plot, or null if it gets stuck first. */
export function botRun(seed: number, size: number, stones: readonly number[], target: number, cap = 2000) {
  let game = plot(seed, size, stones);
  while (game.top < target && game.moves.length < cap) {
    const dir = botMove(game.cells, size, seed, game.moves.length);
    if (dir === null) return null;
    const next = move(game, dir);
    if (!next) return null;
    game = next;
  }
  return game.top >= target ? game.moves.length : null;
}
