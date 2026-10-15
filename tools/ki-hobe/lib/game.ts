// Rounds, gentle difficulty and stars for কী হবে বলো তো? Pure functions, no React, no storage.
import { makeRng, pick as pickIndex } from "../../../shared/game-core";
import { ITEMS, type Item } from "./questions";

const bnDigits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => bnDigits.format(value);

export type Level = { title: string; set: 1 | 2 | 3 | "mix" };
export const LEVELS: readonly Level[] = [
  { title: "পুকুর আর রোদ", set: 1 },
  { title: "পড়া, ছায়া, চারা", set: 2 },
  { title: "আকাশ আর শব্দ", set: 3 },
  { title: "সব মিলিয়ে", set: "mix" },
];
export const LEVEL_COUNT = LEVELS.length;
export const MIX_SIZE = 5;
export const levelOf = (level: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, Math.round(level))) - 1];

/** Brief §1: three missed guesses in a row quietly drop a third choice; five right in a row bring it back. */
export const EASE_AFTER = 3, HARDEN_AFTER = 5;

export type Round = {
  level: number;
  items: readonly Item[];
  index: number;
  /** The prediction for the current item, or null while the child is still choosing. */
  picked: number | null;
  right: number;
  missRun: number;
  rightRun: number;
  easy: boolean;
};

function shuffle<T>(list: readonly T[], seed: number) {
  const rng = makeRng(seed), out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = pickIndex(rng, i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export function itemsFor(level: number, seed: number): readonly Item[] {
  const { set } = levelOf(level);
  return set === "mix" ? shuffle(ITEMS, seed).slice(0, MIX_SIZE) : shuffle(ITEMS.filter(item => item.set === set), seed);
}

export const newRound = (level: number, seed: number, easy = false): Round =>
  ({ level, items: itemsFor(level, seed), index: 0, picked: null, right: 0, missRun: 0, rightRun: 0, easy });

export const current = (round: Round) => round.items[round.index];
export const done = (round: Round) => round.index >= round.items.length;

/** Which choices to show, in their own order: all of them, or (eased) the answer and one other. */
export function shownChoices(item: Item, easy: boolean) {
  const all = item.choices.map((_, index) => index);
  if (!easy || all.length < 3) return all;
  const other = all.find(index => index !== item.answer)!;
  return all.filter(index => index === item.answer || index === other);
}

/** Records a prediction. Every guess plays the scene: a wrong guess is a surprise, not a loss. */
export function predict(round: Round, choice: number): Round {
  if (round.picked !== null || done(round)) return round;
  const matched = choice === current(round).answer;
  const missRun = matched ? 0 : round.missRun + 1, rightRun = matched ? round.rightRun + 1 : 0;
  const easy = missRun >= EASE_AFTER ? true : rightRun >= HARDEN_AFTER ? false : round.easy;
  return { ...round, picked: choice, right: round.right + (matched ? 1 : 0), missRun, rightRun, easy };
}

export const next = (round: Round): Round => round.picked === null ? round : { ...round, index: round.index + 1, picked: null };

/** Stars record how many guesses matched: all → 3, at least half → 2, else 1 (never 0: watching counts). */
export const starsOf = (right: number, total: number) => right >= total ? 3 : right * 2 >= total ? 2 : 1;

export const matchLine = (matched: boolean) => matched ? "যা ভেবেছিলে, তা-ই হলো।" : "ভাবনাটা মেলেনি। দেখো কী হলো।";

export const endLine = (right: number, total: number) => `${bn(total)}টা প্রশ্নে ${bn(right)}টা আন্দাজ মিলল।`;

/** Praise the method, never the child. */
export const methodLine = (right: number, total: number) => right < total
  ? "যেগুলো মেলেনি, ওগুলো থেকেই নতুন কিছু জানলে।"
  : "আগে ভাবলে, তারপর দেখলে, তারপর কেন। বিজ্ঞানীরাও এভাবে কাজ করে।";

/** The card's headline: what was done today, with no name and no score. */
export const cardLine = (count: number) => `আজ ${bn(count)}টা প্রশ্নে আগে ভাবলাম, তারপর দেখলাম`;
