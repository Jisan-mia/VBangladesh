// Answers, score and stars. The formulas are the pre-rewrite ones (a right shelf is 100 plus up to 50 for speed, three
// shelves, 2 right to clear), so every old link's score is still a possible one. Pure and server-safe.
import { ROUNDS, type Round } from "./shelf";
import type { Spec } from "./levels";
import type { ItemId } from "./items";

export const MAX_SCORE = ROUNDS * 150;
/** Three stars need all three right and at least this score: half the speed bonus, i.e. answers at the quick time on average. */
export const THREE_STAR = ROUNDS * 125;

/** A quick answer for this level, in ms: more pictures, a reshuffled shelf and a second pick each get more time. */
export const fastMs = (spec: Pick<Spec, "choices" | "twist" | "two">) => 2000 + 500 * spec.choices + (spec.twist === "gap" ? 0 : 1000) + (spec.two ? 1500 : 0);

/** 100 for a right shelf, plus up to 50 for speed (25 at the quick time, nothing at twice that). */
export const roundScore = (fast: number, right: boolean, ms: number) => right ? 100 + Math.max(0, Math.round(50 * (1 - ms / (2 * fast)))) : 0;
/** The speed bonus still on offer `ms` into the question. */
export const bonusLeft = (fast: number, ms: number) => Math.max(0, Math.round(50 * (1 - ms / (2 * fast))));

/** One shelf's answer: the pictures picked, in order, and the ms from the eyes opening to the last pick. */
export type Answer = { picks: ItemId[]; ms: number };
/** A shelf is right when every pick was a gone thing and all of them were found. */
export const isRight = (round: Round, answer: Answer) => answer.picks.length === round.gone.length && answer.picks.every(id => round.gone.includes(id));
/** The shelf is decided: a wrong pick ends it at once; otherwise once every gone thing is found. */
export const isDecided = (round: Round, picks: readonly ItemId[]) => picks.some(id => !round.gone.includes(id)) || picks.length >= round.gone.length;

export type Result = { right: number; score: number; ms: number; fastest: number; points: number[] };
/** Right shelves, score, and the time over the answers (seconds count only while the pictures show). */
export function resultOf(spec: Spec, rounds: readonly Round[], answers: readonly Answer[]): Result {
  const fast = fastMs(spec), points: number[] = [];
  let right = 0, score = 0, ms = 0, fastest = Infinity;
  answers.forEach((answer, index) => {
    const ok = Boolean(rounds[index]) && isRight(rounds[index], answer);
    const got = roundScore(fast, ok, answer.ms);
    right += ok ? 1 : 0;
    score += got;
    ms += answer.ms;
    points.push(got);
    if (ok) fastest = Math.min(fastest, answer.ms);
  });
  return { right, score, ms, fastest: Number.isFinite(fastest) ? fastest : 0, points };
}

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
