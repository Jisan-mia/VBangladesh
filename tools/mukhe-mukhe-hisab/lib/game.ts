// One 60-second round: the seeded questions, the answer check, the combo points and the stars. Pure and server-safe.
import { makeRng, pick } from "../../../shared/game-core";
import { worldOf, LEVELS, LEVEL_COUNT, MAX_DIGITS, type Level, type Question } from "./levels";

export { LEVEL_COUNT, LEVELS, MAX_DIGITS };
export type { Question };
export const ROUND_SECONDS = 60;
/** "ধীরে খেলো" gives half as much time again. */
export const SLOW_SECONDS = 90;
/** More than anyone answers in a round (about one a second at best). */
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

/** The round's questions, the same on every phone for the same level and seed. Never the same sum twice in a row. */
export function makeQuestions(level: number, seed: number, count = QUESTIONS): Question[] {
  const spec = levelOf(level), rng = makeRng((Math.imul(seed, 31) + level) >>> 0), out: Question[] = [];
  const bazar = worldOf(level) === 2;
  for (let index = 0; index < count; index++) {
    let made = spec.make(rng);
    for (let retry = 0; retry < 6 && made.lines.join() === out[index - 1]?.lines.join(); retry++) made = spec.make(rng);
    out.push({ lines: made.lines, ask: made.ask ?? (bazar ? "মোট কত টাকা?" : ""), answer: made.answer, choices: spec.choices ? makeChoices(rng, made.answer) : null, bazar });
  }
  return out;
}

/** How many digits the pad waits for before it checks the answer. */
export const digitCount = (answer: number) => String(answer).length;

/** Points for a right answer, by the streak it makes: 10, then 20 from 5 in a row, 30 from 10, 40 from 15. */
export const pointsFor = (streak: number) => 10 * (1 + Math.min(3, Math.floor(Math.max(0, streak - 1) / 5)));
/** The multiplier the next right answer would get (shown as "×২"). */
export const comboOf = (streak: number) => pointsFor(streak + 1) / 10;

export type Run = { index: number; right: number; wrong: number; streak: number; bestStreak: number; score: number };
export const freshRun = (): Run => ({ index: 0, right: 0, wrong: 0, streak: 0, bestStreak: 0, score: 0 });

/** One answer: a right one adds combo points; a wrong one only breaks the streak. Either way the next question comes. */
export function answerRun(run: Run, correct: boolean): Run {
  if (!correct) return { ...run, index: run.index + 1, wrong: run.wrong + 1, streak: 0 };
  const streak = run.streak + 1;
  return { index: run.index + 1, right: run.right + 1, wrong: run.wrong, streak, bestStreak: Math.max(run.bestStreak, streak), score: run.score + pointsFor(streak) };
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

/** The highest score `right` answers can make (all in one streak), and the lowest (never five in a row). */
export const maxScore = (right: number) => { let total = 0; for (let streak = 1; streak <= right; streak++) total += pointsFor(streak); return total; };
export const MAX_RIGHT = QUESTIONS;
export const MAX_SCORE = maxScore(MAX_RIGHT);
/** A score some real round could make with `right` answers: whole tens, at least 10 each, at most one long streak. */
export const possibleScore = (right: number, score: number) =>
  Number.isInteger(right) && Number.isInteger(score) && right >= 0 && right <= MAX_RIGHT && score % 10 === 0 && score >= 10 * right && score <= maxScore(right);

/** Where to open: the furthest level reached that isn't three-starred yet, else the first one that isn't. */
export function startLevel(stars: Record<number, number>, unlocked: number) {
  if ((stars[unlocked] ?? 0) < 3) return unlocked;
  for (let level = 1; level <= LEVEL_COUNT; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}
