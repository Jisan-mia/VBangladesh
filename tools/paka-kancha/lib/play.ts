// One game, as pure functions: whose code (a puzzle), the tries so far and the try being typed. The rules are in rules.ts, the
// ladder in levels.ts, the ladder from before the rewrite in legacy.ts. No DOM, no clock: tests replay it exactly.
import { oldRules } from './legacy';
import { TAUGHT_AT, levelOf } from './levels';
import {
  FULL, bn, codeFromSeed, daySeed, erase as eraseKey, isOver, refusal, rowsOf, solved, submit as lockIn, typeDigit as addDigit,
  type Mark, type Play, type Puzzle, type Rules,
} from './rules';

export type Game = Play & { puzzle: Puzzle };
export const newGame = (puzzle: Puzzle, guesses: string[] = []): Game => ({ puzzle, guesses, input: '' });

/** The rules a puzzle is played by: a level's own, an old link's level by the old ladder, everything else all ten digits and seven tries. */
export function rulesOf(puzzle: Puzzle): Rules {
  if (puzzle.kind !== 'level') return FULL;
  if (puzzle.legacy) return oldRules(puzzle.level);
  const info = levelOf(puzzle.level);
  return info ? { digits: info.digits, tries: info.tries, repeat: info.repeat, feedback: info.feedback } : FULL;
}
export function codeOf(puzzle: Puzzle) {
  if (puzzle.kind === 'code') return puzzle.code;
  if (puzzle.kind === 'day') return codeFromSeed(daySeed(puzzle.date));
  if (puzzle.kind === 'seed') return codeFromSeed(puzzle.seed);
  const rules = rulesOf(puzzle);
  return codeFromSeed(puzzle.seed, rules.digits, rules.repeat);
}

export const rowsFor = (game: Game) => rowsOf(codeOf(game.puzzle), game.guesses, rulesOf(game.puzzle));
export const over = (game: Game) => isOver(codeOf(game.puzzle), game.guesses, rulesOf(game.puzzle).tries);
export const won = (game: Game) => solved(rowsFor(game));
/** Why a key can't go in right now ('' when it can): 'over' | 'pad' | 'full' | 'twice'. */
export const refusalFor = (game: Game, digit: string) => refusal(codeOf(game.puzzle), game, digit, rulesOf(game.puzzle));

/** Each of these returns the same game object when nothing changed (a refused key, an empty row), so a caller can tell. */
export function typeKey(game: Game, digit: string): Game {
  const next = addDigit(codeOf(game.puzzle), game, digit, rulesOf(game.puzzle));
  return next === game ? game : { ...game, ...next };
}
export const eraseRow = (game: Game): Game => game.input && !over(game) ? { ...game, ...eraseKey(game) } : game;
export function lockRow(game: Game): Game {
  const next = lockIn(codeOf(game.puzzle), game, rulesOf(game.puzzle));
  return next === game ? game : { ...game, ...next };
}

// ---- stars ----

/** Tries for ★★★ and ★★ on a ladder level (null for the daily, a seeded code, a friend's code and an old link's level). */
export function limitsOf(puzzle: Puzzle) {
  if (puzzle.kind !== 'level' || puzzle.legacy) return null;
  const info = levelOf(puzzle.level);
  return info ? { three: info.three, two: info.two } : null;
}
/** Stars for solving in `count` tries. */
export function starsFor(puzzle: Puzzle, count: number) {
  const limits = limitsOf(puzzle);
  return !limits ? 0 : count <= limits.three ? 3 : count <= limits.two ? 2 : 1;
}
/** Stars for a finished game: 0 when the code wasn't found. */
export const starsOf = (puzzle: Puzzle, rows: readonly Mark[][]) => solved(rows) ? starsFor(puzzle, rows.length) : 0;
/** How many tries fewer would have earned the next star (0 at three stars, for a miss, or off the ladder). */
export function triesToNextStar(puzzle: Puzzle, rows: readonly Mark[][]) {
  const limits = limitsOf(puzzle), stars = starsOf(puzzle, rows);
  if (!limits || !stars || stars === 3) return 0;
  return rows.length - (stars === 2 ? limits.three : limits.two);
}

// ---- what the board shows ----

/** The most পাকা any one try has earned: the pins the boss lock has open. */
export const pinsOpen = (rows: readonly Mark[][]) => rows.reduce((top, row) => Math.max(top, row.filter(mark => mark === 'p').length), 0);
export const ripeTotal = (rows: readonly Mark[][]) => rows.reduce((sum, row) => sum + row.filter(mark => mark === 'p').length, 0);

/** 0 calm · 1 two tries left · 2 the last try: the stage edge glows amber, then red. */
export function danger(triesLeft: number, playing: boolean) {
  return !playing ? 0 : triesLeft <= 1 ? 2 : triesLeft === 2 ? 1 : 0;
}

/** The line under the result by how many tries it took (a short level's last try still counts as its last). */
export function humanLine(rows: readonly Mark[][], tries: number) {
  if (!solved(rows)) return 'এবার আমগুলো কাঁচাই রইল। কোডটা দেখে নাও, পরেরবার ধরবে।';
  const at = rows.length;
  if (at === tries && tries > 1) return 'একদম শেষ বারে! শেষ মুহূর্তে আম পাকল।';
  return ['প্রথম বারেই! এটা আন্দাজ, না জাদু?', 'দ্বিতীয় বারেই। কপাল খুলে গেছে।', 'তিন বারে। মাথা ঠান্ডা, হাত পাকা।', 'চার বারে। ধাপে ধাপে পাকিয়েছ।', 'ধীরে ধীরে, ঠিক ঠিক। আম পেকেছে।', 'একটু ঘুরিয়েছে, তবু হাল ছাড়োনি।', 'শেষ বারে! শেষ মুহূর্তে আম পাকল।'][Math.min(at, 7) - 1];
}

/** Why you can't place a key, in a few words, for the line under the board. */
export function refusalLine(reason: string, digits: number, repeat: boolean) {
  if (reason === 'pad') return digits >= 10 ? '' : `এই লেভেলে শুধু ১ থেকে ${bn(digits)} পর্যন্ত অঙ্ক।`;
  if (reason === 'full') return 'চারটা হয়ে গেছে। এবার ‘দেখো’ চাপো।';
  if (reason === 'twice') return repeat ? '' : 'একই অঙ্ক দুবার না। চারটাই আলাদা।';
  return '';
}

/** Whether an aid is on: the pad's little mangoes (from level 3), the "this can't be the code" line (4), the red last-try edge (5). */
export function aidOn(puzzle: Puzzle, aid: keyof typeof TAUGHT_AT) {
  return puzzle.kind !== 'level' || Boolean(puzzle.legacy) || puzzle.level >= TAUGHT_AT[aid];
}
