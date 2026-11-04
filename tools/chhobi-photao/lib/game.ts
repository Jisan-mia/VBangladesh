// Game rules: levels, marks, strokes, undo, the hint, mistakes and stars. Pure and server-safe (share.ts reaches it through link.ts).
import { starsFor as starsBetween } from "../../../shared/game-core";
import { cluesOf, sameClue, solveByLines, type Clues } from "./nonogram";
import { PICTURES, type Picture } from "./pictures";

export const LEVEL_COUNT = PICTURES.length;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
/** A fixed seed per level, so a challenge link names exactly one picture. */
export const levelSeed = (level: number) => 70_000 + level * 13;

export type Puzzle = Clues & { level: number; size: number; solution: boolean[]; picture: Picture };
const puzzles = new Map<number, Puzzle>();

export function puzzleOf(level: number): Puzzle {
  let puzzle = puzzles.get(level);
  if (!puzzle) {
    const picture = PICTURES[level - 1], size = picture.art.length;
    const solution = picture.art.flatMap(row => [...row].map(letter => letter !== "."));
    const line = (index: number, column: boolean) => Array.from({ length: size }, (_, step) => solution[column ? step * size + index : index * size + step]);
    puzzle = { level, size, solution, picture, rows: Array.from({ length: size }, (_, row) => cluesOf(line(row, false))), cols: Array.from({ length: size }, (_, col) => cluesOf(line(col, true))) };
    puzzles.set(level, puzzle);
  }
  return puzzle;
}
export const sizeOf = (level: number) => PICTURES[level - 1].art.length;

/** 0 empty, 1 filled, 2 marked ✕ (sure it's empty). */
export type Mark = 0 | 1 | 2;
export type Mode = "fill" | "cross";
/** `wrong` lists the cells outside the picture that were ever filled: each is one mistake, even after it's wiped. */
export type Game = { level: number; cells: Mark[]; wrong: number[]; hints: number; history: Mark[][] };

const HISTORY = 200;
export const newGame = (level: number): Game => ({ level, cells: Array(sizeOf(level) ** 2).fill(0), wrong: [], hints: 0, history: [] });

export function isSolved({ level, cells }: Game) {
  const { solution } = puzzleOf(level);
  return cells.every((mark, index) => (mark === 1) === solution[index]);
}

/** What a tap does to a cell in this mode: fill toggles filled, ✕ toggles the mark. */
export const markFor = (from: Mark, mode: Mode): Mark => mode === "fill" ? (from === 1 ? 0 : 1) : (from === 2 ? 0 : 2);

/** Sets `to` on these cells; `record` saves an undo step (once per stroke). Null when nothing changed or the picture is done. */
export function paint(game: Game, indices: readonly number[], to: Mark, record = true): Game | null {
  if (isSolved(game)) return null;
  const { solution } = puzzleOf(game.level);
  const cells = game.cells.slice(), wrong = game.wrong.slice();
  let changed = false;
  for (const index of indices) {
    if (!Number.isInteger(index) || index < 0 || index >= cells.length || cells[index] === to) continue;
    cells[index] = to;
    changed = true;
    if (to === 1 && !solution[index] && !wrong.includes(index)) wrong.push(index);
  }
  if (!changed) return null;
  return { ...game, cells, wrong, history: record ? [...game.history, game.cells].slice(-HISTORY) : game.history };
}

export function undo(game: Game): Game {
  if (!game.history.length || isSolved(game)) return game;
  return { ...game, cells: game.history[game.history.length - 1], history: game.history.slice(0, -1) };
}

/** Per row and column: "done" when its filled runs match the clue (the clue dims), "over" when it has more filled cells than the clue allows. */
export function lineStates({ level, cells }: Game) {
  const { size, rows, cols } = puzzleOf(level);
  const state = (clue: number[], line: boolean[]) => {
    if (sameClue(cluesOf(line), clue)) return "done" as const;
    return line.filter(Boolean).length > clue.reduce((sum, run) => sum + run, 0) ? "over" as const : "" as const;
  };
  const filled = (index: number) => cells[index] === 1;
  return {
    rows: rows.map((clue, row) => state(clue, Array.from({ length: size }, (_, col) => filled(row * size + col)))),
    cols: cols.map((clue, col) => state(clue, Array.from({ length: size }, (_, row) => filled(row * size + col)))),
  };
}

export const doneLines = (game: Game) => { const { rows, cols } = lineStates(game); return [...rows, ...cols].filter(state => state === "done").length; };

/**
 * One helpful cell: first a wrong mark to undo, otherwise the next cell line logic can prove from the right marks already on the board.
 * Returns the cell and the mark it should get, or null once the picture is done.
 */
export function hint(game: Game): { index: number; to: Mark } | null {
  if (isSolved(game)) return null;
  const puzzle = puzzleOf(game.level), { solution } = puzzle;
  const wrongFill = game.cells.findIndex((mark, index) => mark === 1 && !solution[index]);
  if (wrongFill >= 0) return { index: wrongFill, to: 0 };
  const wrongCross = game.cells.findIndex((mark, index) => mark === 2 && solution[index]);
  if (wrongCross >= 0) return { index: wrongCross, to: 1 };
  const known = game.cells.map(mark => mark === 1 ? 1 : mark === 2 ? 0 : -1);
  const next = solveByLines(puzzle, known, true);
  if (next) for (let index = 0; index < known.length; index++) if (known[index] === -1 && next[index] !== -1) return { index, to: next[index] ? 1 : 2 };
  // Logic can always move on from right marks; this is only a safety net.
  const missing = solution.findIndex((filled, index) => filled && game.cells[index] !== 1);
  return missing >= 0 ? { index: missing, to: 1 } : null;
}

export function applyHint(game: Game) {
  const help = hint(game);
  if (!help) return null;
  const next = paint(game, [help.index], help.to);
  return next ? { game: { ...next, hints: game.hints + 1 }, index: help.index } : null;
}

export const mistakes = (game: Game) => game.wrong.length;

/** Two mistakes still earn 2 stars; any hint caps the result at 2. */
export const TWO_STAR_MISTAKES = 2;
export function starsFor(mistakeCount: number, hinted: boolean) {
  const earned = starsBetween(mistakeCount, 0, TWO_STAR_MISTAKES, true);
  return hinted ? Math.min(2, earned) : earned;
}

/** How many fewer mistakes would have earned one more star (0 when a hint, not mistakes, is what's in the way). */
export function shortBy(mistakeCount: number, hinted: boolean) {
  const earned = starsFor(mistakeCount, hinted);
  if (earned === 3) return 0;
  if (earned === 1) return mistakeCount - TWO_STAR_MISTAKES;
  return hinted ? 0 : mistakeCount;
}
