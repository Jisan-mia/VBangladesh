// One page's play, pure: what a stroke strikes (forgiving by one cell), runs of quick finds, misses and hints.
// The component keeps a Round in state and passes seconds on the clock in, so the tests replay every move exactly.
import { lineBetween, type Puzzle } from "./grid";

/** Finds less than this many seconds apart make a run, and each word in a run sings a step higher. */
export const RUN_SECONDS = 8;

export type Round = { found: number[]; hinted: number[]; misses: number; run: number; bestRun: number; lastAt: number };
export type Outcome = { kind: "found" | "again" | "miss" | "none"; index: number };

/** A fresh page. `demo` keeps one word struck (the old teaching grid behind `d=1` links). */
export const newRound = (demo = -1): Round => ({ found: demo >= 0 ? [demo] : [], hinted: [], misses: 0, run: 0, bestRun: 0, lastAt: -99 });

const sameCells = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((cell, k) => cell === b[k]);
const either = (cells: readonly number[], own: readonly number[]) => sameCells(cells, own) || sameCells([...cells].reverse(), own);

/**
 * Which word a stroke means, or -1. Exact first, read either way. Then, for a word not yet found, one cell of slack:
 * a stroke that runs one cell past either end, or (on words of four cells or more) stops one cell short of an end.
 * Only a single such word counts, so the slack never picks between two.
 */
export function match(puzzle: Puzzle, cells: readonly number[], found: readonly number[]) {
  if (cells.length < 2) return -1;
  const exact = puzzle.words.findIndex(word => either(cells, word.cells));
  if (exact >= 0) return exact;
  const near: number[] = [];
  puzzle.words.forEach((word, index) => {
    if (found.includes(index)) return;
    const own = word.cells, n = own.length;
    const over = cells.length === n + 1 && (either(cells.slice(1), own) || either(cells.slice(0, -1), own));
    const short = n >= 4 && cells.length === n - 1 && (either(cells, own.slice(1)) || either(cells, own.slice(0, -1)));
    if (over || short) near.push(index);
  });
  return near.length === 1 ? near[0] : -1;
}

/** A stroke (or two taps) let go at `at` seconds on the clock. */
export function strike(round: Round, puzzle: Puzzle, cells: readonly number[], at: number): { round: Round; outcome: Outcome } {
  if (cells.length < 2) return { round, outcome: { kind: "none", index: -1 } };
  const index = match(puzzle, cells, round.found);
  if (index < 0) return { round: { ...round, misses: round.misses + 1 }, outcome: { kind: "miss", index } };
  if (round.found.includes(index)) return { round, outcome: { kind: "again", index } };
  const run = at - round.lastAt <= RUN_SECONDS ? round.run + 1 : 0;
  return {
    round: { ...round, found: [...round.found, index], run, bestRun: Math.max(round.bestRun, run + 1), lastAt: at },
    outcome: { kind: "found", index },
  };
}

/** Two taps: the first letter, then the last. Null when they aren't in one line. */
export const tapLine = (puzzle: Puzzle, from: number, to: number) => lineBetween(from, to, puzzle.size);

/** The word a hint rings next: the first not found and not hinted yet, or -1. */
export const nextHint = (puzzle: Puzzle, round: Round) => puzzle.words.findIndex((_, index) => !round.found.includes(index) && !round.hinted.includes(index));

export function takeHint(round: Round, puzzle: Puzzle): { round: Round; index: number } | null {
  const index = nextHint(puzzle, round);
  return index < 0 ? null : { round: { ...round, hinted: [...round.hinted, index] }, index };
}

export const isDone = (round: Round, puzzle: Puzzle) => round.found.length === puzzle.words.length;
