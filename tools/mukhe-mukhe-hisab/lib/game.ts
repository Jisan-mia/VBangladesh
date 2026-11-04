// One round's sums, answers, points and stars. Pure and server-safe.
// Sums are dealt lazily from one seeded stream, so a round never runs out of them (the old game made 120 and broke on
// the 121st). The first 120 of every level and seed are exactly the old ones, so old links replay the same sums.
import { makeRng, pick } from "../../../shared/game-core";
import { worldOf, LEVELS, LEVEL_COUNT, MAX_DIGITS, type Level, type Question } from "./levels";

export { LEVEL_COUNT, LEVELS, MAX_DIGITS };
export type { Question };
export const ROUND_SECONDS = 60;
/** Kept for older imports: ধীরে খেলো no longer stretches the clock (it would make stars easier). */
export const SLOW_SECONDS = ROUND_SECONDS;
/** The old game's fixed deck size; still the first stretch of every deck. */
export const QUESTIONS = 120;

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const levelOf = (level: number): Level => LEVELS[level - 1];

/** Four different answers near the right one, none below zero, in a seeded order. */
export function makeChoices(rng: () => number, answer: number) {
  const near = [answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10, answer + 3];
  const wrong: number[] = [];
  while (wrong.length < 3) {
    const left = near.filter(value => value >= 0 && value !== answer && !wrong.includes(value));
    wrong.push(left[pick(rng, left.length)]);
  }
  const out = [...wrong];
  out.splice(pick(rng, 4), 0, answer);
  return out;
}

/** A level's sums for one seed, dealt as the round needs them. `list` only grows; the same seed gives the same list. */
export type Deck = { level: number; seed: number; list: Question[]; rng: () => number };
export const makeDeck = (level: number, seed: number): Deck => ({ level, seed, list: [], rng: makeRng((Math.imul(seed, 31) + level) >>> 0) });

function deal(deck: Deck) {
  const spec = levelOf(deck.level), rng = deck.rng, out = deck.list, index = out.length;
  const bazar = worldOf(deck.level) === 2;
  let made = spec.make(rng);
  for (let retry = 0; retry < 6 && made.lines.join() === out[index - 1]?.lines.join(); retry++) made = spec.make(rng);
  out.push({ lines: made.lines, ask: made.ask ?? (bazar ? "মোট কত টাকা?" : ""), answer: made.answer, choices: spec.choices ? makeChoices(rng, made.answer) : null, bazar, how: made.how });
}

/** The sum at `index` (0-based), dealing more when the round gets there. Never undefined. */
export function sumAt(deck: Deck, index: number): Question {
  const at = Math.max(0, Math.floor(index));
  while (deck.list.length <= at) deal(deck);
  return deck.list[at];
}

/** The round's first `count` sums, the same on every phone for the same level and seed. Never the same sum twice in a row. */
export function makeQuestions(level: number, seed: number, count = QUESTIONS): Question[] {
  const deck = makeDeck(level, seed);
  if (count > 0) sumAt(deck, count - 1);
  return deck.list.slice(0, count);
}

/** How many digits the pad waits for before it checks the answer. */
export const digitCount = (answer: number) => String(answer).length;

/** Points for a right answer, by the streak it makes: 10, then 20 from 5 in a row, 30 from 10, 40 from 15. */
export const pointsFor = (streak: number) => 10 * (1 + Math.min(3, Math.floor(Math.max(0, streak - 1) / 5)));
/** The multiplier the next right answer would get (shown as "×২"). */
export const comboOf = (streak: number) => pointsFor(streak + 1) / 10;

/** Seconds a wrong answer costs: 3, then 6 for the second in a row, 9 from the third. Random tapping earns nothing. */
export const PENALTY_MS = 3000;
export const penaltyMs = (slipsInARow: number) => PENALTY_MS * Math.max(1, Math.min(3, slipsInARow));

/** `slips` is wrong answers in a row (what the next penalty grows from). */
export type Run = { index: number; right: number; wrong: number; streak: number; bestStreak: number; score: number; slips: number };
export const freshRun = (): Run => ({ index: 0, right: 0, wrong: 0, streak: 0, bestStreak: 0, score: 0, slips: 0 });

/** One answer: a right one adds combo points; a wrong one breaks the streak (the clock takes the penalty). Either way the next sum comes. */
export function answerRun(run: Run, correct: boolean): Run {
  if (!correct) return { ...run, index: run.index + 1, wrong: run.wrong + 1, streak: 0, slips: run.slips + 1 };
  const streak = run.streak + 1;
  return { index: run.index + 1, right: run.right + 1, wrong: run.wrong, streak, bestStreak: Math.max(run.bestStreak, streak), score: run.score + pointsFor(streak), slips: 0 };
}

/** Typed digits ("৪৫" or "45") to a number, or null. */
export function readTyped(typed: string) {
  const ascii = typed.replace(/[০-৯]/g, digit => String(digit.charCodeAt(0) - 0x09e6));
  return /^\d{1,4}$/.test(ascii) ? Number(ascii) : null;
}

/** 0 means not cleared. */
export const starsOf = (level: number, right: number) => {
  const [one, two, three] = levelOf(level).stars;
  return right >= three ? 3 : right >= two ? 2 : right >= one ? 1 : 0;
};

/** Right answers still needed for the next star, or null at three stars. */
export function nextStar(level: number, right: number) {
  const stars = starsOf(level, right);
  return stars === 3 ? null : { stars: stars + 1, need: levelOf(level).stars[stars] - right };
}

/** The highest score `right` answers can make (all in one streak). */
export const maxScore = (right: number) => right <= 0 ? 0 : 10 * right + 10 * Math.max(0, right - 5) + 10 * Math.max(0, right - 10) + 10 * Math.max(0, right - 15);
/** The link's right-count limit (four digits: more than one answer a frame for a minute); a round has no fixed number of sums any more. */
export const MAX_RIGHT = 9999;
export const MAX_SCORE = maxScore(MAX_RIGHT);
/** A score some real round could make with `right` answers: whole tens, at least 10 each, at most one long streak. */
export const possibleScore = (right: number, score: number) =>
  Number.isInteger(right) && Number.isInteger(score) && right >= 0 && right <= MAX_RIGHT && score % 10 === 0 && score >= 10 * right && score <= maxScore(right);

/** Kept for older imports; lib/save.ts has the one the game uses. */
export function startLevel(stars: Record<number, number>, unlocked: number) {
  if ((stars[unlocked] ?? 0) < 3) return unlocked;
  for (let level = 1; level <= LEVEL_COUNT; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}
