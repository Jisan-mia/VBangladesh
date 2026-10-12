// Sudoku rules, a seeded generator and two solvers. Pure and server-safe (share.ts re-checks links with it).
// A grid is a flat array, row by row: 0 is an empty cell, 1..n a digit.
import { makeRng, pick } from "../../../shared/game-core";

/** n×n grid split into boxes `rows` tall and `cols` wide. */
export type Shape = { n: number; rows: number; cols: number };
export const SHAPES = {
  4: { n: 4, rows: 2, cols: 2 },
  6: { n: 6, rows: 2, cols: 3 },
  9: { n: 9, rows: 3, cols: 3 },
} as const satisfies Record<number, Shape>;
export type Size = keyof typeof SHAPES;

type Layout = { units: number[][]; unitsOf: number[][]; peers: number[][] };
const layouts = new Map<number, Layout>();

/** Rows, columns and boxes, plus each cell's units and peers, worked out once per size. */
export function layout({ n, rows, cols }: Shape): Layout {
  const known = layouts.get(n);
  if (known) return known;
  const units: number[][] = [];
  for (let r = 0; r < n; r++) units.push(Array.from({ length: n }, (_, c) => r * n + c));
  for (let c = 0; c < n; c++) units.push(Array.from({ length: n }, (_, r) => r * n + c));
  for (let br = 0; br < n; br += rows) for (let bc = 0; bc < n; bc += cols) {
    const box: number[] = [];
    for (let r = br; r < br + rows; r++) for (let c = bc; c < bc + cols; c++) box.push(r * n + c);
    units.push(box);
  }
  const unitsOf = Array.from({ length: n * n }, (_, cell) => units.map((unit, index) => unit.includes(cell) ? index : -1).filter(index => index >= 0));
  const peers = unitsOf.map((mine, cell) => [...new Set(mine.flatMap(index => units[index]))].filter(other => other !== cell));
  const made = { units, unitsOf, peers };
  layouts.set(n, made);
  return made;
}

const bits = (value: number) => { let count = 0; while (value) { value &= value - 1; count++; } return count; };
const lowDigit = (mask: number) => 31 - Math.clz32(mask & -mask);

function shuffled<T>(items: T[], rng: () => number) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** A full, valid grid from the seed: a base pattern with its bands, stacks, rows, columns and digits shuffled. */
export function solvedGrid(shape: Shape, rng: () => number) {
  const { n, rows, cols } = shape;
  const bandOrder = shuffled([...Array(n / rows).keys()], rng).flatMap(band => shuffled([...Array(rows).keys()], rng).map(r => band * rows + r));
  const stackOrder = shuffled([...Array(n / cols).keys()], rng).flatMap(stack => shuffled([...Array(cols).keys()], rng).map(c => stack * cols + c));
  const digits = shuffled([...Array(n).keys()].map(d => d + 1), rng);
  const flip = rows === cols && rng() < 0.5;
  const grid = new Array<number>(n * n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const br = bandOrder[r], bc = stackOrder[c];
    grid[flip ? c * n + r : r * n + c] = digits[(cols * (br % rows) + Math.floor(br / rows) + bc) % n];
  }
  return grid;
}

/** True when no row, column or box repeats a digit (empties ignored). */
export function consistent(grid: readonly number[], shape: Shape) {
  for (const unit of layout(shape).units) {
    let seen = 0;
    for (const cell of unit) {
      const value = grid[cell];
      if (!value) continue;
      if (seen & (1 << value)) return false;
      seen |= 1 << value;
    }
  }
  return true;
}

/**
 * Solves by the two moves a person makes with a pencil: a cell with only one possible digit, or a digit with only one
 * possible cell in a row, column or box. Returns the solution, or null if those moves get stuck. A grid this solves
 * has exactly one solution, and nobody has to guess.
 */
export function solveByLogic(puzzle: readonly number[], shape: Shape): number[] | null {
  const { n } = shape, { units, peers } = layout(shape), full = ((1 << n) - 1) << 1;
  const grid = puzzle.slice(), cand = new Array<number>(n * n).fill(full);
  let left = 0;
  const set = (cell: number, digit: number) => {
    grid[cell] = digit; cand[cell] = 0;
    for (const peer of peers[cell]) cand[peer] &= ~(1 << digit);
  };
  for (let cell = 0; cell < n * n; cell++) {
    if (!grid[cell]) { left++; continue; }
    if (!(cand[cell] & (1 << grid[cell]))) return null; // a given repeats a peer's digit
    set(cell, grid[cell]);
  }
  while (left) {
    let progress = false;
    for (let cell = 0; cell < n * n; cell++) {
      if (grid[cell]) continue;
      if (!cand[cell]) return null;
      if (bits(cand[cell]) === 1) { set(cell, lowDigit(cand[cell])); left--; progress = true; }
    }
    for (const unit of units) {
      for (let digit = 1; digit <= n; digit++) {
        let spot = -1, count = 0, placed = false;
        for (const cell of unit) {
          if (grid[cell] === digit) { placed = true; break; }
          if (cand[cell] & (1 << digit)) { spot = cell; count++; }
        }
        if (placed) continue;
        if (!count) return null;
        if (count === 1) { set(spot, digit); left--; progress = true; }
      }
    }
    if (!progress) return null;
  }
  return grid;
}

/** Counts solutions by plain search, stopping at `limit`. Independent of solveByLogic, so the tests can check it. */
export function countSolutions(puzzle: readonly number[], shape: Shape, limit = 2) {
  const { n } = shape, { peers } = layout(shape), full = ((1 << n) - 1) << 1;
  const grid = puzzle.slice();
  if (!consistent(grid, shape)) return 0;
  let found = 0;
  const search = (): void => {
    let best = -1, bestMask = 0, bestCount = 99;
    for (let cell = 0; cell < n * n; cell++) {
      if (grid[cell]) continue;
      let mask = full;
      for (const peer of peers[cell]) if (grid[peer]) mask &= ~(1 << grid[peer]);
      const count = bits(mask);
      if (count < bestCount) { best = cell; bestMask = mask; bestCount = count; if (count <= 1) break; }
    }
    if (best < 0) { found++; return; }
    for (let digit = 1; digit <= n && found < limit; digit++) {
      if (!(bestMask & (1 << digit))) continue;
      grid[best] = digit;
      search();
    }
    grid[best] = 0;
  };
  search();
  return found;
}

/**
 * The puzzle for a seed: clears cells in mirrored pairs (the newspaper look) while the grid stays solvable by logic,
 * until `empty` cells are blank or every pair has been tried. Counted work, not timed, so every phone makes the same puzzle.
 */
export function makePuzzle(seed: number, shape: Shape, empty: number) {
  const rng = makeRng(seed), { n } = shape, total = n * n;
  const solution = solvedGrid(shape, rng), puzzle = solution.slice();
  const pairs = shuffled([...Array(Math.ceil(total / 2)).keys()], rng);
  let blank = 0;
  for (const cell of pairs) {
    if (blank >= empty) break;
    const mirror = total - 1 - cell, two = mirror !== cell;
    puzzle[cell] = 0; if (two) puzzle[mirror] = 0;
    if (solveByLogic(puzzle, shape)) blank += two ? 2 : 1;
    else { puzzle[cell] = solution[cell]; puzzle[mirror] = solution[mirror]; }
  }
  return { puzzle, solution };
}

/** "0040…" ⇄ grid. Only the digits 0..n, exactly n×n of them. */
export const encodeGrid = (grid: readonly number[]) => grid.join("");
export function decodeGrid(text: string, shape: Shape) {
  if (text.length !== shape.n * shape.n || !new RegExp(`^[0-${shape.n}]+$`).test(text)) return null;
  return [...text].map(Number);
}
