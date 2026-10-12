// The switchboard rules: a press flips its own bulb and the four next to it. Pure and server-safe (share.ts replays links with it).
import { makeRng, pick } from "../../../shared/game-core";

export const LEVEL_COUNT = 30;
export const MAX_MOVES = 200;

/** [board size, switches pressed to make the puzzle]. Ten levels per size; level 1 and 2 are fixed lessons. */
const PLAN: ReadonlyArray<readonly [3 | 4 | 5, number]> = [
  [3, 1], [3, 1], [3, 2], [3, 2], [3, 3], [3, 3], [3, 4], [3, 4], [3, 5], [3, 5],
  [4, 3], [4, 3], [4, 4], [4, 4], [4, 5], [4, 5], [4, 6], [4, 6], [4, 7], [4, 7],
  [5, 4], [5, 5], [5, 5], [5, 6], [5, 6], [5, 7], [5, 8], [5, 9], [5, 10], [5, 11],
];
// Level 1: the middle switch (five bulbs out, one press). Level 2: a corner, so you see the edge has fewer neighbours.
const LESSONS: Record<number, number[]> = { 1: [4], 2: [0] };

export const WORLDS = ["নানাবাড়ির বারান্দা", "মেসের ঘর", "বিয়েবাড়ির প্যান্ডেল"] as const;
export const worldOf = (level: number) => Math.min(2, Math.floor((level - 1) / 10));
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const sizeOf = (level: number) => PLAN[level - 1][0];
/** Every level has one fixed board, so a friend's link and your replay are the same puzzle. */
export const levelSeed = (level: number) => 4021 + level * 7919;

export const allLit = (size: number) => 2 ** (size * size) - 1;

/** The bulbs one switch flips: itself, up, down, left, right. */
export function pressMask(size: number, index: number) {
  const row = Math.floor(index / size), col = index % size;
  let mask = 1 << index;
  if (row > 0) mask |= 1 << (index - size);
  if (row < size - 1) mask |= 1 << (index + size);
  if (col > 0) mask |= 1 << (index - 1);
  if (col < size - 1) mask |= 1 << (index + 1);
  return mask;
}

export const isLit = (lit: number, index: number) => (lit & (1 << index)) !== 0;
export const litCount = (lit: number) => { let count = 0; for (let bits = lit; bits; bits &= bits - 1) count++; return count; };

/**
 * The fewest switches that light every bulb from `lit`, in reading order, or null if no presses can.
 * Gaussian elimination over GF(2): row j says "the switches touching bulb j, added mod 2, must equal 1 if bulb j is dark".
 * 4×4 and 5×5 boards have several answers (2⁴ and 2² of them), so every free choice is tried and the shortest kept.
 */
export function solve(lit: number, size: number): number[] | null {
  const cells = size * size, dark = allLit(size) & ~lit, AUG = 2 ** cells;
  // Rows can reach bit 25 for 5×5, still inside a 32-bit int; the augmented column sits just above the switches.
  const rows = Array.from({ length: cells }, (_, j) => pressMask(size, j) + (isLit(dark, j) ? AUG : 0));
  const pivotRow: number[] = new Array(cells).fill(-1);
  let rank = 0;
  for (let col = 0; col < cells; col++) {
    const bit = 1 << col;
    const found = rows.findIndex((row, index) => index >= rank && (row & bit) !== 0);
    if (found < 0) continue;
    [rows[rank], rows[found]] = [rows[found], rows[rank]];
    for (let index = 0; index < cells; index++) if (index !== rank && rows[index] & bit) rows[index] ^= rows[rank];
    pivotRow[col] = rank++;
  }
  for (let index = rank; index < cells; index++) if (rows[index] & AUG) return null;
  const free = pivotRow.flatMap((row, col) => row < 0 ? [col] : []);
  let best: number[] | null = null;
  for (let choice = 0; choice < 2 ** free.length; choice++) {
    const presses: number[] = [];
    for (let col = 0; col < cells; col++) {
      const row = pivotRow[col];
      let on: number;
      if (row < 0) on = (choice >> free.indexOf(col)) & 1;
      else {
        on = rows[row] & AUG ? 1 : 0;
        free.forEach((freeCol, k) => { if ((choice >> k) & 1 && rows[row] & (1 << freeCol)) on ^= 1; });
      }
      if (on) presses.push(col);
    }
    if (!best || presses.length < best.length) best = presses;
  }
  return best;
}

export type Puzzle = { level: number; size: number; start: number; par: number };

/**
 * Starts from every bulb lit and presses `k` different switches. Pressing them again lights everything, so it's always solvable.
 * A draw is kept only when no shorter answer exists, so "সেরা" (par) is exactly k and truly the fewest.
 */
export function makePuzzle(level: number): Puzzle {
  const [size, k] = PLAN[level - 1], cells = size * size, rng = makeRng(levelSeed(level));
  let presses = LESSONS[level];
  for (let tries = 0; !presses; tries++) {
    const pool = Array.from({ length: cells }, (_, index) => index), drawn: number[] = [];
    for (let count = 0; count < k; count++) drawn.push(pool.splice(pick(rng, pool.length), 1)[0]);
    const start = drawn.reduce((lit, index) => lit ^ pressMask(size, index), allLit(size));
    if (solve(start, size)?.length === k || tries > 500) presses = drawn;
  }
  const start = presses.reduce((lit, index) => lit ^ pressMask(size, index), allLit(size));
  return { level, size, start, par: presses.length };
}

export type Game = { puzzle: Puzzle; lit: number; moves: number[]; hinted: boolean };

export const newGame = (puzzle: Puzzle): Game => ({ puzzle, lit: puzzle.start, moves: [], hinted: false });
export const isSolved = (game: Game) => game.lit === allLit(game.puzzle.size);

export function play(game: Game, index: number): Game | null {
  const { size } = game.puzzle;
  if (isSolved(game) || !Number.isInteger(index) || index < 0 || index >= size * size || game.moves.length >= MAX_MOVES) return null;
  return { ...game, lit: game.lit ^ pressMask(size, index), moves: [...game.moves, index] };
}

export function undo(game: Game): Game {
  if (!game.moves.length || isSolved(game)) return game;
  const last = game.moves[game.moves.length - 1];
  return { ...game, lit: game.lit ^ pressMask(game.puzzle.size, last), moves: game.moves.slice(0, -1) };
}

/** One switch from the shortest way home from here. */
export const hint = (game: Game) => solve(game.lit, game.puzzle.size)?.[0] ?? -1;

/** Lights after a list of presses from a level's start; null if a press is out of range. */
export function replay(level: number, moves: readonly number[]): Game | null {
  let game: Game | null = newGame(makePuzzle(level));
  for (const index of moves) { game = game && play(game, index); if (!game) return null; }
  return game;
}

/** ★★★ at par, ★★ within a few extra presses, ★ for any clear. A hint caps it at ★★. */
export const starLimits = (par: number) => ({ three: par, two: par + Math.max(2, Math.ceil(par / 2)) });
export function starsFor(moves: number, par: number, hinted: boolean) {
  const { three, two } = starLimits(par);
  const earned = moves <= three ? 3 : moves <= two ? 2 : 1;
  return hinted ? Math.min(2, earned) : earned;
}

/** How many fewer presses would have earned one more star, or 0 when that wasn't in reach (3 stars, or a hint taken at 2). */
export function shortBy(moves: number, par: number, hinted: boolean) {
  const { three, two } = starLimits(par), earned = starsFor(moves, par, hinted);
  if (earned === 3 || (hinted && earned === 2)) return 0;
  return moves - (earned === 2 ? three : two);
}

/** One character per switch (0–9, a–o) keeps a link short. */
const MOVE_CHARS = "0123456789abcdefghijklmno";
export const encodeMoves = (moves: readonly number[]) => moves.map(index => MOVE_CHARS[index]).join("");
export function decodeMoves(text: string, size: number) {
  if (text.length < 1 || text.length > MAX_MOVES) return null;
  const moves = [...text].map(char => MOVE_CHARS.indexOf(char));
  return moves.every(index => index >= 0 && index < size * size) ? moves : null;
}
