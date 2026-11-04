// One round: a level's ten words in a seeded order, the tiles for each word, how the next word gets easier or harder,
// and the stars. Pure and deterministic (makeRng only), so tests and the bots play exactly what the page plays.
import { makeRng, starsFor } from "../../../shared/game-core";
import { levelOf, type Level } from "./levels";
import { PARTNERS, type Item, type Kar } from "./words";

export const MIN_CHOICES = 2, MAX_CHOICES = 4;

/**
 * The right sign plus `count − 1` wrong ones, in a seeded order. Wrong ones come first from `pool` (a finale's own signs),
 * then from the sign's look-alikes, closest first. A sign that would spell a real variant (`item.not`) is never a tile.
 */
export function choicesFor(item: Item, count: number, seed: number, pool: readonly Kar[] = []): Kar[] {
  const size = Math.max(MIN_CHOICES, Math.min(MAX_CHOICES, count));
  const allowed = (kar: Kar) => kar !== item.kar && !item.not?.includes(kar);
  const near = PARTNERS[item.kar];
  // A finale's own signs, ordered by how close a look-alike each one is.
  const fromPool = pool.filter(allowed).sort((a, b) => rank(near, a) - rank(near, b));
  const wrong = [...fromPool, ...near.filter(kar => allowed(kar) && !fromPool.includes(kar))];
  const tiles: Kar[] = [item.kar, ...wrong.slice(0, size - 1)];
  const rng = makeRng(seed);
  for (let i = tiles.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; }
  return tiles;
}
const rank = (near: readonly Kar[], kar: Kar) => { const at = near.indexOf(kar); return at < 0 ? near.length : at; };

/**
 * Sweet-spot difficulty, never announced: three words in a row missed on the first try take one tile away from the next word,
 * five in a row right on the first try add one. `offset` stays within one tile of the level's own count.
 */
export type Pace = { offset: number; right: number; missed: number };
export const START_PACE: Pace = { offset: 0, right: 0, missed: 0 };
export function nextPace(pace: Pace, firstTry: boolean): Pace {
  if (firstTry) return pace.right + 1 >= 5 ? { offset: Math.min(1, pace.offset + 1), right: 0, missed: 0 } : { ...pace, right: pace.right + 1, missed: 0 };
  return pace.missed + 1 >= 3 ? { offset: Math.max(-1, pace.offset - 1), right: 0, missed: 0 } : { ...pace, missed: pace.missed + 1, right: 0 };
}
export const choiceCount = (level: Level, pace: Pace) => Math.max(MIN_CHOICES, Math.min(MAX_CHOICES, level.base + pace.offset));

/** After this many wrong taps on one word, the right tile glows. So no word ever takes more than three taps. */
export const HINT_AFTER = 2;
/** Stars only record the round: 8 or more of 10 right on the first try → 3, 5 or more → 2, any finished round → 1. */
export const starsOf = (firstTry: number) => starsFor(firstTry, 8, 5);

export type Round = {
  level: number; seed: number; items: Item[]; index: number;
  /** Wrong taps on this word. */
  tries: number;
  /** Words right on the first try so far. */
  firstTry: number;
  /** Wrong taps in the whole round. */
  misses: number;
  solved: boolean; pace: Pace; choices: Kar[];
};

const itemSeed = (seed: number, index: number) => (seed + index * 7919) >>> 0;
const tilesFor = (level: Level, item: Item, pace: Pace, seed: number, index: number) => choicesFor(item, choiceCount(level, pace), itemSeed(seed, index), level.pool);

export function createRound(id: number, seed: number, pace: Pace = START_PACE): Round {
  const level = levelOf(id), items = [...level.items], rng = makeRng(seed);
  for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
  return { level: level.id, seed, items, index: 0, tries: 0, firstTry: 0, misses: 0, solved: false, pace, choices: tilesFor(level, items[0], pace, seed, 0) };
}

export const currentItem = (round: Round) => round.items[round.index];
export const isLast = (round: Round) => round.index >= round.items.length - 1;
export const isDone = (round: Round) => round.solved && isLast(round);
export const hintOn = (round: Round) => !round.solved && round.tries >= HINT_AFTER;

/** A tap on a tile. A right one fills the slot and counts toward the stars only on the first try. Taps after solving are ignored. */
export function answer(round: Round, kar: Kar): Round {
  if (round.solved || !round.choices.includes(kar)) return round;
  const item = currentItem(round);
  if (kar !== item.kar) return { ...round, tries: round.tries + 1, misses: round.misses + 1 };
  const first = round.tries === 0;
  return { ...round, solved: true, firstTry: round.firstTry + (first ? 1 : 0), pace: nextPace(round.pace, first) };
}

/** On to the next word, with its tiles sized by the pace so far. */
export function nextWord(round: Round): Round {
  if (!round.solved || isLast(round)) return round;
  const index = round.index + 1;
  return { ...round, index, tries: 0, solved: false, choices: tilesFor(levelOf(round.level), round.items[index], round.pace, round.seed, index) };
}

/** What a finished round shows and records. */
export type Result = { level: number; stars: number; words: number; firstTry: number; misses: number; items: Item[] };
export const resultOf = (round: Round): Result =>
  ({ level: round.level, stars: starsOf(round.firstTry), words: round.items.length, firstTry: round.firstTry, misses: round.misses, items: round.items });
