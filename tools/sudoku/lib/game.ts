// Levels, the daily puzzle, stars and every move a player makes. Pure: the component only renders this state.
import { starsFor } from "../../../shared/game-core";
import { LEVELS } from "./levels";
import { SHAPES, layout, makePuzzle, solveByLogic, type Shape, type Size } from "./sudoku";

export const LEVEL_COUNT = LEVELS.length;
/** Four tiers of ten. `pace` is the seconds a blank cell may take for three stars. */
export const TIERS = [
  { name: "সহজ", from: 1, pace: 5 },
  { name: "মাঝারি", from: 11, pace: 6 },
  { name: "কঠিন", from: 21, pace: 8 },
  { name: "ওস্তাদ", from: 31, pace: 10 },
] as const;
export const tierOf = (level: number) => TIERS.findLast(tier => level >= tier.from) ?? TIERS[0];

const DAILY_SIZE: Size = 9, DAILY_EMPTY = 46, DAILY_PACE = 8;
/** Daily puzzles are seeded by their date, written as 20261012. */
export const FIRST_DAY = 20260101, LAST_DAY = 20991231;

/** What a puzzle is: a ladder level (1..40) or the daily one for a date. */
export type Which = { level: number } | { day: number };
export type Puzzle = Which & { seed: number; shape: Shape; puzzle: number[]; solution: number[]; empty: number; par: number };

/** Seconds for three stars: the blank cells times the tier's pace, rounded up to ten seconds, at least half a minute. */
const parFor = (empty: number, pace: number) => Math.max(30, Math.ceil(empty * pace / 10) * 10);

/** Today's date in Bangladesh (UTC+6), as 20261012. */
export function todayKey(now = Date.now()) {
  const date = new Date(now + 6 * 3600_000);
  return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
}

/** A real calendar date in our range. */
export function validDay(day: number) {
  if (!Number.isInteger(day) || day < FIRST_DAY || day > LAST_DAY) return false;
  const y = Math.floor(day / 10000), m = Math.floor(day / 100) % 100, d = day % 100;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function build(seed: number, size: Size, empty: number, pace: number, which: Which): Puzzle | null {
  const shape = SHAPES[size], { puzzle, solution } = makePuzzle(seed, shape, empty);
  // Re-check what we're about to hand out: logic alone must reach the generator's solution.
  if (solveByLogic(puzzle, shape)?.join("") !== solution.join("")) return null;
  const blanks = puzzle.filter(value => !value).length;
  return { ...which, seed, shape, puzzle, solution, empty: blanks, par: parFor(blanks, pace) };
}

export function levelPuzzle(level: number) {
  const entry = LEVELS[level - 1];
  if (!Number.isInteger(level) || !entry) return null;
  const [size, empty, seed] = entry;
  return build(seed, size, empty, tierOf(level).pace, { level });
}

export const dailyPuzzle = (day: number) => validDay(day) ? build(day, DAILY_SIZE, DAILY_EMPTY, DAILY_PACE, { day }) : null;

/** Seconds for two stars. */
export const twoStarTime = (par: number) => Math.round(par * 2.2 / 10) * 10;

/** 3 stars at or under par, 2 within 2.2× par, else 1. Each hint takes the ceiling down a star (one hint: at most 2). */
export function starsEarned(seconds: number, hints: number, par: number) {
  return Math.max(1, Math.min(starsFor(seconds, par, twoStarTime(par), true), 3 - hints));
}

/** What the next star needed, in exact terms: seconds to shave and hints to skip. Null at three stars. */
export function nextStar(seconds: number, hints: number, par: number) {
  const stars = starsEarned(seconds, hints, par);
  if (stars >= 3) return null;
  const goal = stars + 1, limit = goal === 3 ? par : twoStarTime(par);
  return { goal, seconds: Math.max(0, seconds - limit), hints: Math.max(0, hints - (3 - goal)) };
}

/** Where a new visit starts: the furthest open level not yet at three stars (level 1 for a new player). */
export function startLevel(stars: Record<number, number>, unlocked: number) {
  for (let level = 1; level <= unlocked; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}

// ---- play ----

type Board = { values: number[]; notes: number[] };
export type Game = Board & { puzzle: Puzzle; history: Board[]; hints: number; hinted: number[] };

export const startGame = (puzzle: Puzzle): Game =>
  ({ puzzle, values: puzzle.puzzle.slice(), notes: new Array(puzzle.puzzle.length).fill(0), history: [], hints: 0, hinted: [] });

const given = (game: Game, cell: number) => game.puzzle.puzzle[cell] !== 0;
const step = (game: Game, values: number[], notes: number[]): Game =>
  ({ ...game, values, notes, history: [...game.history, { values: game.values, notes: game.notes }] });

/** Writes a digit. Pencil marks for that digit vanish from the cell's row, column and box. */
export function place(game: Game, cell: number, digit: number): Game | null {
  if (given(game, cell) || digit < 1 || digit > game.puzzle.shape.n || game.values[cell] === digit) return null;
  const values = game.values.slice(), notes = game.notes.slice();
  values[cell] = digit; notes[cell] = 0;
  for (const peer of layout(game.puzzle.shape).peers[cell]) notes[peer] &= ~(1 << digit);
  return step(game, values, notes);
}

/** Toggles a pencil mark (খসড়া) in an empty cell. */
export function toggleNote(game: Game, cell: number, digit: number): Game | null {
  if (given(game, cell) || game.values[cell] || digit < 1 || digit > game.puzzle.shape.n) return null;
  const notes = game.notes.slice();
  notes[cell] ^= 1 << digit;
  return step(game, game.values, notes);
}

/** Clears a cell's digit, or its pencil marks if it has no digit. */
export function erase(game: Game, cell: number): Game | null {
  if (given(game, cell) || (!game.values[cell] && !game.notes[cell])) return null;
  const values = game.values.slice(), notes = game.notes.slice();
  if (values[cell]) values[cell] = 0; else notes[cell] = 0;
  return step(game, values, notes);
}

/** Takes the last move back. Hints taken stay counted. */
export function undo(game: Game): Game | null {
  const last = game.history.at(-1);
  return last ? { ...game, ...last, history: game.history.slice(0, -1) } : null;
}

export const isWrong = (game: Game, cell: number) => game.values[cell] !== 0 && game.values[cell] !== game.puzzle.solution[cell];
export const isSolved = (game: Game) => game.values.every((value, cell) => value === game.puzzle.solution[cell]);

/** The cell a hint fills: the chosen one if it's blank or wrong, else the blank with the fewest possible digits. */
export function hintCell(game: Game, chosen = -1) {
  const open = (cell: number) => !given(game, cell) && game.values[cell] !== game.puzzle.solution[cell];
  if (chosen >= 0 && open(chosen)) return chosen;
  const { peers } = layout(game.puzzle.shape);
  let best = -1, fewest = 99;
  for (let cell = 0; cell < game.values.length; cell++) {
    if (!open(cell)) continue;
    const seen = new Set(peers[cell].map(peer => game.values[peer]).filter(Boolean));
    const choices = game.puzzle.shape.n - seen.size;
    if (choices < fewest) { best = cell; fewest = choices; }
  }
  return best;
}

/** Fills one cell with its answer and counts the hint. */
export function giveHint(game: Game, chosen = -1): { game: Game; cell: number } | null {
  const cell = hintCell(game, chosen);
  if (cell < 0) return null;
  const next = place(game, cell, game.puzzle.solution[cell]);
  return next ? { game: { ...next, hints: game.hints + 1, hinted: [...game.hinted, cell] }, cell } : null;
}

/** Rows, columns and boxes through `cell` that this move just completed correctly. */
export function newlyDone(before: Game, after: Game, cell: number) {
  const { units, unitsOf } = layout(after.puzzle.shape), solution = after.puzzle.solution;
  const done = (game: Game, unit: number[]) => unit.every(index => game.values[index] === solution[index]);
  return unitsOf[cell].map(index => units[index]).filter(unit => done(after, unit) && !done(before, unit));
}

/** How many of each digit are placed correctly, so the pad can grey out a finished digit. */
export function digitsDone(game: Game) {
  const count = new Array(game.puzzle.shape.n + 1).fill(0);
  game.values.forEach((value, cell) => { if (value && value === game.puzzle.solution[cell]) count[value]++; });
  return count.map(placed => placed === game.puzzle.shape.n);
}
