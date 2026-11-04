import { makeRng } from "../../../shared/game-core";
import { type Puzzle } from "../lib/game";
import { layout } from "../lib/sudoku";

function singles(grid: number[], puzzle: Puzzle) {
  const { n } = puzzle.shape, { units, peers } = layout(puzzle.shape), out: number[] = [];
  const cand = grid.map((v, cell) => { if (v) return 0; let m = ((1 << n) - 1) << 1; for (const p of peers[cell]) if (grid[p]) m &= ~(1 << grid[p]); return m; });
  cand.forEach((m, cell) => { if (m && (m & (m - 1)) === 0) out.push(cell); });
  for (const unit of units) for (let d = 1; d <= n; d++) { const spots = unit.filter(c => cand[c] & (1 << d)); if (spots.length === 1 && !out.includes(spots[0])) out.push(spots[0]); }
  return out;
}
export function bot(puzzle: Puzzle, seed: number, skill: { look: number; tap: number; slip: number }) {
  const rng = makeRng(seed), grid = puzzle.puzzle.slice(), scale = Math.pow((puzzle.shape.n * puzzle.shape.n) / 16, 1.5);
  let time = 0, mistakes = 0;
  while (grid.some(v => !v)) {
    const moves = singles(grid, puzzle);
    time += skill.tap * (0.8 + 0.4 * rng()) + skill.look * scale / Math.sqrt(moves.length) * (0.6 + 0.8 * rng());
    if (rng() < skill.slip) { mistakes++; time += skill.tap * 2.5; }
    const cell = moves[Math.floor(rng() * moves.length)];
    grid[cell] = puzzle.solution[cell];
  }
  return { seconds: time, mistakes };
}

/**
 * Three players. `look` is seconds to spot a move on a 4×4 (it grows with the grid as (cells/16)^1.5 and shrinks with
 * the number of moves on offer), `tap` the time to pick a cell and a digit, `slip` the chance of a wrong digit
 * (fixed at once, which costs time but no star).
 */
export const PLAYERS = {
  casual: { look: 2.2, tap: 0.9, slip: 0.06 },
  steady: { look: 1.4, tap: 0.7, slip: 0.03 },
  strong: { look: 0.8, tap: 0.5, slip: 0.01 },
} as const;
