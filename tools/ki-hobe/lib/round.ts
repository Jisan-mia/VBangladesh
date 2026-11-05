// A round of predictions as a pure state machine: guess → watch the experiment → the answer → next, five to nine times over.
// No React, no timers, no storage. The experiment's running time is the CSS animation's; this only knows which step it is on.
// Spec: ai_docs/statecharts/ki-hobe/KiHobe.tla.
import { makeRng, pick as pickIndex } from "../../../shared/game-core";
import { ITEMS, itemById, type Item } from "./items";
import { levelOf } from "./levels";

/** Brief §1: three missed guesses in a row quietly drop a wrong choice; five right in a row bring it back. */
export const EASE_AFTER = 3, HARDEN_AFTER = 5;

export type Step = "guess" | "watch" | "answer";
export type Round = {
  level: number;
  items: readonly Item[];
  index: number;
  step: Step;
  /** The choice the child made for the current experiment, or null. */
  picked: number | null;
  /** How many times the current experiment was shown again (আবার দেখো). */
  replays: number;
  /** Which guesses matched, one per finished guess. */
  matched: boolean[];
  right: number;
  missRun: number;
  rightRun: number;
  eased: boolean;
  /** The last experiment's guess is made: the round is won (stars and the daily limit are settled at that tap). */
  full: boolean;
};

function shuffle<T>(list: readonly T[], seed: number) {
  const rng = makeRng(seed), out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = pickIndex(rng, i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** The experiments of a level, in order. A level that uses its whole pool keeps the teaching order; a finale draws and mixes by seed. */
export function itemsOf(level: number, seed: number): readonly Item[] {
  const spec = levelOf(level);
  const rest = spec.pool.filter(id => !spec.fixed.includes(id));
  if (!spec.fixed.length && spec.take >= rest.length) return rest.map(itemById);
  const ids = [...spec.fixed, ...shuffle(rest, seed).slice(0, spec.take)];
  return shuffle(ids, seed + 7).map(itemById);
}

export const createRound = (level: number, seed: number, eased = false, rightRun = 0): Round =>
  ({ level, items: itemsOf(level, seed), index: 0, step: "guess", picked: null, replays: 0, matched: [], right: 0, missRun: 0, rightRun, eased, full: false });

export const current = (round: Round): Item => round.items[round.index];
export const isLast = (round: Round) => round.index + 1 >= round.items.length;

/** The choices on offer, in their own order: all of them, or (eased) the answer and one other. */
export function shownChoices(item: Item, eased: boolean): number[] {
  const all = item.choices.map((_, index) => index);
  if (!eased || all.length < 3) return all;
  const other = all.find(index => index !== item.answer)!;
  return all.filter(index => index === item.answer || index === other);
}

export type Outcome = "ignore" | "matched" | "surprise";

/**
 * A guess. Only on the guess step, and only once per experiment. A wrong guess is a surprise, never a loss: the experiment
 * plays either way. The last experiment's guess wins the round (`full`).
 */
export function predict(round: Round, choice: number): Outcome {
  if (round.step !== "guess" || !shownChoices(current(round), round.eased).includes(choice)) return "ignore";
  const hit = choice === current(round).answer;
  round.picked = choice; round.step = "watch"; round.replays = 0;
  round.matched.push(hit);
  round.right += hit ? 1 : 0;
  round.missRun = hit ? 0 : round.missRun + 1;
  round.rightRun = hit ? round.rightRun + 1 : 0;
  if (round.missRun >= EASE_AFTER) round.eased = true;
  else if (round.rightRun >= HARDEN_AFTER) round.eased = false;
  if (isLast(round)) round.full = true;
  return hit ? "matched" : "surprise";
}

/** The experiment ran to its end. The first time that shows the answer; a replay returns to it. */
export function watched(round: Round): boolean {
  if (round.step !== "watch") return false;
  round.step = "answer";
  return true;
}

/** আবার দেখো: the same experiment again, from its start. Only from the answer. */
export function replay(round: Round): boolean {
  if (round.step !== "answer") return false;
  round.step = "watch"; round.replays += 1;
  return true;
}

/** → : the next experiment. Only from the answer, and never past the last one. */
export function advance(round: Round): boolean {
  if (round.step !== "answer" || isLast(round)) return false;
  round.index += 1; round.step = "guess"; round.picked = null; round.replays = 0;
  return true;
}

export const matchedNow = (round: Round) => round.picked !== null && round.picked === current(round).answer;
export const everyItem = ITEMS;
