// The 30 boards from before the rewrite (all plain সোজা তার, 3×3 → 4×4 → 5×5). They no longer make the ladder, but a link
// shared before the rewrite (no `v` key) names one of them, so they are rebuilt exactly as they were. tests/rewrite.test.ts pins
// every start, so a change here can't quietly swap the board behind an old link.
import { makeRng, pick } from "../../../shared/game-core";
import { allLit, pressMask, pressesLeft, type Board } from "./board";

export const LEGACY_COUNT = 30;
/** [board size, switches pressed to make the puzzle]. */
const PLAN: ReadonlyArray<readonly [3 | 4 | 5, number]> = [
  [3, 1], [3, 1], [3, 2], [3, 2], [3, 3], [3, 3], [3, 4], [3, 4], [3, 5], [3, 5],
  [4, 3], [4, 3], [4, 4], [4, 4], [4, 5], [4, 5], [4, 6], [4, 6], [4, 7], [4, 7],
  [5, 4], [5, 5], [5, 5], [5, 6], [5, 6], [5, 7], [5, 8], [5, 9], [5, 10], [5, 11],
];
const LESSONS: Record<number, number[]> = { 1: [4], 2: [0] };

export const isLegacyLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEGACY_COUNT;
/** The seed in an old link: one fixed board per level. New links use the same seed with `v=2`. */
export const levelSeed = (level: number) => 4021 + level * 7919;
export const legacySize = (level: number) => PLAN[level - 1][0];
export const plainBoard = (size: number): Board => ({ size, taped: 0, lines: [] });

/** The old generator, step for step: k different switches pressed from all-lit, kept when no shorter answer exists. */
export function legacyStart(level: number) {
  const [size, k] = PLAN[level - 1], cells = size * size, rng = makeRng(levelSeed(level)), board = plainBoard(size);
  let presses = LESSONS[level];
  for (let tries = 0; !presses; tries++) {
    const pool = Array.from({ length: cells }, (_, index) => index), drawn: number[] = [];
    for (let count = 0; count < k; count++) drawn.push(pool.splice(pick(rng, pool.length), 1)[0]);
    const start = drawn.reduce((lit, index) => lit ^ pressMask(board, index), allLit(size));
    if (pressesLeft(board, start) === k || tries > 500) presses = drawn;
  }
  return { size, start: presses.reduce((lit, index) => lit ^ pressMask(board, index), allLit(size)), par: presses.length };
}
