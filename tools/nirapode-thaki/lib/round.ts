// The rules of a round, with no React: how many choices to show, which ones, stars, and the end-of-round lines.
import { starsFor } from "../../../shared/game-core";
import type { Choice, Question, SafetySet } from "./sets";

export const BASE_CHOICES = 3;

export function shuffle<T>(list: readonly T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * How many choices to offer: three, two after three misses in a row (quietly easier), four after five right in a row.
 * A "miss" is a question not answered on the first tap. Never more than the question has.
 */
export function choiceCount(missRun: number, rightRun: number, available: number, base = BASE_CHOICES) {
  const wanted = missRun >= 3 ? base - 1 : rightRun >= 5 ? base + 1 : base;
  return Math.max(2, Math.min(wanted, available));
}

/** The safe answer plus the most tempting wrong ones, shuffled. */
export function choicesFor(question: Question, count: number, rng: () => number): Choice[] {
  const size = choiceCount(0, 0, question.wrong.length + 1, count);
  return shuffle([question.right, ...question.wrong.slice(0, size - 1)], rng);
}

/** Stars are a record only: 3 for four or five safe picks first time, 2 for three, 1 for finishing. */
export const starsOf = (firstTry: number, total: number) => starsFor(firstTry, total - 1, Math.ceil(total / 2));

/** "আজ রাস্তা পার হওয়ার ৫টা নিয়ম শিখলাম" */
export const cardTitle = (set: SafetySet, bn: (n: number) => string) => `আজ ${set.rules} ${bn(set.questions.length)}টা নিয়ম শিখলাম`;

/** Where to start: the first set without stars, else the first. */
export function firstOpenSet(sets: readonly SafetySet[], stars: Record<number, number>) {
  const index = sets.findIndex((_, i) => !stars[i + 1]);
  return sets[index < 0 ? 0 : index];
}
