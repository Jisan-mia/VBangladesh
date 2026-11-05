// One round: a level's questions in order, the pictures for each, how the next question gets easier or harder (a pace that
// carries from round to round), and the stars. Pure and deterministic (makeRng only), so tests and the bots play exactly
// what the page plays.
import { makeRng, starsFor } from "../../../shared/game-core";
import { itemsOf, levelOf, type Item, type Level } from "./levels";
import type { Choice, Question } from "./sets";

export const MIN_CHOICES = 2, MAX_CHOICES = 4;

/**
 * Sweet-spot difficulty, never announced: three questions in a row missed on the first tap take one picture away from the
 * next question, five in a row right on the first tap add one. `offset` stays within one picture of the level's own count.
 * The pace is kept from round to round, so five in a row can span the end of a scene.
 */
export type Pace = { offset: number; right: number; missed: number };
export const START_PACE: Pace = { offset: 0, right: 0, missed: 0 };
export function nextPace(pace: Pace, firstTry: boolean): Pace {
  if (firstTry) return pace.right + 1 >= 5 ? { offset: Math.min(1, pace.offset + 1), right: 0, missed: 0 } : { ...pace, right: pace.right + 1, missed: 0 };
  return pace.missed + 1 >= 3 ? { offset: Math.max(-1, pace.offset - 1), right: 0, missed: 0 } : { ...pace, missed: pace.missed + 1, right: 0 };
}

/** How many pictures question `index` shows. Never more than the question has (the right one plus its wrong ones). */
export function choiceCount(level: Level, pace: Pace, index: number, available: number) {
  const base = index === 0 && level.opening ? level.opening : level.base + pace.offset;
  return Math.max(MIN_CHOICES, Math.min(MAX_CHOICES, base, available));
}

/** The safe picture plus the most tempting wrong ones (`count − 1` of them), in a seeded order. */
export function choicesFor(question: Question, count: number, seed: number): Choice[] {
  const size = Math.max(MIN_CHOICES, Math.min(MAX_CHOICES, count, question.wrong.length + 1));
  const tiles = [question.right, ...question.wrong.slice(0, size - 1)];
  const rng = makeRng(seed);
  for (let i = tiles.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; }
  return tiles;
}

/** After this many different wrong taps on one question, the safe picture glows. So no question takes more than three taps. */
export const HINT_AFTER = 2;
/** Stars only record the round: all but one first-tap right → 3, half → 2, any finished round → 1. */
export const starsOf = (firstTry: number, total: number) => starsFor(firstTry, total - 1, Math.ceil(total / 2));

export type Round = {
  level: number; seed: number; items: Item[]; index: number;
  /** The wrong pictures already tapped on this question (a second tap on the same one is not a new miss). */
  tried: string[];
  /** Questions right on the first tap so far. */
  firstTry: number;
  /** Wrong taps in the whole round. */
  misses: number;
  solved: boolean; pace: Pace; choices: Choice[];
};

const itemSeed = (seed: number, index: number) => (seed + index * 7919) >>> 0;
const tilesFor = (level: Level, item: Item, pace: Pace, seed: number, index: number) =>
  choicesFor(item.question, choiceCount(level, pace, index, item.question.wrong.length + 1), itemSeed(seed, index));

export function createRound(id: number, seed: number, pace: Pace = START_PACE): Round {
  const level = levelOf(id), items = itemsOf(id);
  return { level: level.id, seed, items, index: 0, tried: [], firstTry: 0, misses: 0, solved: false, pace, choices: tilesFor(level, items[0], pace, seed, 0) };
}

export const currentItem = (round: Round) => round.items[round.index];
export const isLast = (round: Round) => round.index >= round.items.length - 1;
export const hintOn = (round: Round) => !round.solved && round.tried.length >= HINT_AFTER;

/** A tap on a picture. A right one counts toward the stars only on the first tap. Taps after solving, or on a picture not shown, are ignored. */
export function answer(round: Round, choiceId: string): Round {
  if (round.solved) return round;
  const item = currentItem(round), tile = round.choices.find(choice => choice.id === choiceId);
  if (!tile) return round;
  if (tile.id !== item.question.right.id) {
    if (round.tried.includes(tile.id)) return round;
    return { ...round, tried: [...round.tried, tile.id], misses: round.misses + 1 };
  }
  const first = round.tried.length === 0;
  return { ...round, solved: true, firstTry: round.firstTry + (first ? 1 : 0), pace: nextPace(round.pace, first) };
}

/** On to the next question, with its pictures sized by the pace so far. */
export function nextQuestion(round: Round): Round {
  if (!round.solved || isLast(round)) return round;
  const index = round.index + 1;
  return { ...round, index, tried: [], solved: false, choices: tilesFor(levelOf(round.level), round.items[index], round.pace, round.seed, index) };
}

/** What a finished round shows and records. */
export type Result = { level: number; stars: number; count: number; firstTry: number; misses: number; items: Item[] };
export const resultOf = (round: Round): Result =>
  ({ level: round.level, stars: starsOf(round.firstTry, round.items.length), count: round.items.length, firstTry: round.firstTry, misses: round.misses, items: round.items });

/** "আজ রাস্তা পার হওয়ার ৫টা নিয়ম শিখলাম" for a scene, "আজ মেলার পথে ৬টা নিয়ম মনে করলাম" for a finale. */
export function cardLine(result: Pick<Result, "level" | "count">, bn: (n: number) => string) {
  const level = levelOf(result.level);
  return level.finale ? `আজ ${level.finale}: ${bn(result.count)}টা নিয়ম মনে করলাম` : `আজ ${setRules(level)} ${bn(result.count)}টা নিয়ম শিখলাম`;
}
import { setOf } from "./sets";
const setRules = (level: Level) => setOf(level.sets[0]).rules;
