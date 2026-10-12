// One level: three seeded shelves, the item that goes, the choices, then score and stars. Pure and server-safe.
import { makeRng, pick } from "../../../shared/game-core";
import { ITEM_IDS, type ItemId } from "./items";
import { LEVELS, LEVEL_COUNT, type Level } from "./levels";

export { LEVEL_COUNT, LEVELS };
export const ROUNDS = 3;
export const MAX_SCORE = ROUNDS * 150;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const levelOf = (level: number): Level => LEVELS[level - 1];

/**
 * `shelf` is what you look at. `after` is the shelf once your eyes open: with an empty place (null) in gap levels,
 * one item shorter and reshuffled in move levels, with `newcomer` in the missing item's place in swap levels.
 */
export type Round = { shelf: ItemId[]; missing: ItemId; slot: number; after: (ItemId | null)[]; newcomer: ItemId | null; choices: ItemId[] };

function shuffle<T>(rng: () => number, list: readonly T[]) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** One shelf. `avoid` keeps an item that already went this level from going again. */
export function makeRound(level: number, rng: () => number, avoid: readonly ItemId[] = []): Round {
  const { count, choices, unseen, twist } = levelOf(level);
  const pool = shuffle(rng, ITEM_IDS);
  const shelf = pool.slice(0, count), never = pool.slice(count);
  const open = shelf.map((_, index) => index).filter(index => !avoid.includes(shelf[index]));
  const slot = open[pick(rng, open.length)], missing = shelf[slot];
  let after: (ItemId | null)[], newcomer: ItemId | null = null;
  if (twist === "gap") after = shelf.map((id, index) => index === slot ? null : id);
  else if (twist === "move") {
    after = shelf.filter((_, index) => index !== slot);
    const a = pick(rng, after.length);
    let b = pick(rng, after.length - 1);
    if (b >= a) b++;
    [after[a], after[b]] = [after[b], after[a]];
  } else {
    newcomer = never.shift()!;
    after = shelf.map((id, index) => index === slot ? newcomer : id);
  }
  // Wrong choices: things still on the shelf (the newcomer first, as the lure), and things that were never there.
  const still = shuffle(rng, shelf.filter(id => id !== missing));
  const onShelf = (newcomer ? [newcomer, ...still] : still).slice(0, choices - 1 - unseen);
  return { shelf, missing, slot, after, newcomer, choices: shuffle(rng, [missing, ...onShelf, ...never.slice(0, unseen)]) };
}

/** The level's three shelves: the same on every phone for the same level and seed. */
export function makeLevel(level: number, seed: number): Round[] {
  const rng = makeRng((Math.imul(seed, 31) + level) >>> 0), rounds: Round[] = [];
  for (let index = 0; index < ROUNDS; index++) rounds.push(makeRound(level, rng, rounds.map(round => round.missing)));
  return rounds;
}

/** A quick answer for this level, in ms: more choices and a reshuffled shelf get more time. */
export const fastMs = (level: number) => { const { choices, twist } = levelOf(level); return 2000 + 500 * choices + (twist === "gap" ? 0 : 1000); };

export type Answer = { pick: ItemId; ms: number };

/** 100 for a right answer, plus up to 50 for speed (25 at the quick time, nothing at twice that). */
export const roundScore = (level: number, right: boolean, ms: number) =>
  right ? 100 + Math.max(0, Math.round(50 * (1 - ms / (2 * fastMs(level))))) : 0;

export type Result = { right: number; score: number; ms: number };
/** Right answers, score, and the time taken over the answers (seconds count only once the choices show). */
export function resultOf(level: number, rounds: readonly Round[], answers: readonly Answer[]): Result {
  let right = 0, score = 0, ms = 0;
  answers.forEach((answer, index) => {
    const ok = answer.pick === rounds[index]?.missing;
    right += ok ? 1 : 0;
    score += roundScore(level, ok, answer.ms);
    ms += answer.ms;
  });
  return { right, score, ms };
}

/** Three stars need all three right and at least this score: half the speed bonus, i.e. answers at the quick time on average. */
export const THREE_STAR = ROUNDS * 125;
/** Clear a level with 2 of 3 right (1 star), all 3 right for 2 stars, and quickly for 3. 0 means not cleared. */
export const starsOf = (right: number, score: number) => right < 2 ? 0 : right === 2 ? 1 : score >= THREE_STAR ? 3 : 2;

/** What stands between this result and the next star: more right answers, or more points (from quicker answers). */
export function nextStar(right: number, score: number): { right: number } | { points: number } | null {
  const stars = starsOf(right, score);
  if (stars === 3) return null;
  if (stars === 2) return { points: THREE_STAR - score };
  return { right: stars === 1 ? 1 : 2 - right };
}

/** Right answers behind a link's score (a right answer is worth 100 to 150; two right never reach 300 in practice). */
export const rightFromScore = (score: number) => score >= 300 ? 3 : score >= 200 ? 2 : score >= 100 ? 1 : 0;

/** A score some real run could make: k right answers give 100k to 150k. */
export const possibleScore = (score: number) => Number.isInteger(score) && [0, 1, 2, 3].some(k => score >= 100 * k && score <= 150 * k);

/** Where to open: the furthest level reached that isn't three-starred yet, else the first one that isn't. */
export function startLevel(stars: Record<number, number>, unlocked: number) {
  if ((stars[unlocked] ?? 0) < 3) return unlocked;
  for (let level = 1; level <= LEVEL_COUNT; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}
