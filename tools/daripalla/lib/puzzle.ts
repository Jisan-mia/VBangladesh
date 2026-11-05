// One pan's puzzle as pure data: the given side (left) and the child's pan (right). Weights are plain numbers, never কেজি or গ্রাম.
// Fill levels: the missing addend (৪ + ? = ৭), with weights, with fruits of known weight, against two weights.
// Find levels: an unknown fruit found by balancing, then asked. Guess levels: ★ + ★ + ৩ = ১১ as a picture equation.
// Three misses in a row quietly ease the next pans of a round, five clean pans in a row step them up. Never announced.
import { levelOf, type Kind } from "./levels";

export type FruitId = "lichu" | "peyara" | "aam" | "pepe" | "kola" | "anaros" | "komola" | "dab";
/** name, and the form before "র/এর" ("কলার ওজন"). */
export const FRUITS: Record<FruitId, { name: string; of: string }> = {
  lichu: { name: "লিচু", of: "লিচুর" },
  peyara: { name: "পেয়ারা", of: "পেয়ারার" },
  aam: { name: "আম", of: "আমের" },
  pepe: { name: "পেঁপে", of: "পেঁপের" },
  kola: { name: "কলা", of: "কলার" },
  anaros: { name: "আনারস", of: "আনারসের" },
  komola: { name: "কমলা", of: "কমলার" },
  dab: { name: "ডাব", of: "ডাবের" },
};
/** Level 3's fruits with a weight tag. Small to big, so the tags never contradict the pictures. */
export const KNOWN_FRUITS: { fruit: FruitId; value: number }[] = [{ fruit: "lichu", value: 1 }, { fruit: "peyara", value: 2 }, { fruit: "aam", value: 3 }, { fruit: "pepe", value: 5 }];
/** Fruits whose weight is the question. Never one of the tagged ones, so "পেয়ারা ২" is never contradicted later. */
export const UNKNOWN_FRUITS: FruitId[] = ["kola", "anaros", "komola", "dab"];

export type Piece = { kind: "weight"; value: number } | { kind: "fruit"; fruit: FruitId; value: number; hidden: boolean } | { kind: "star"; value: number };
const weight = (value: number): Piece => ({ kind: "weight", value });
export const WEIGHTS_10 = [1, 2, 5].map(weight);
export const WEIGHTS_20 = [1, 2, 5, 10].map(weight);

/** The child's pan holds six pieces at most (a fixed starter counts), so the pans stay readable on a small phone. */
export const PAN_MAX = 6;

/** -1 eased, 0 as the level says, 1 brisk. Never announced. */
export type Pace = -1 | 0 | 1;

export type Puzzle = {
  kind: Kind;
  /** The given side (left). */
  left: Piece[];
  /** Fixed pieces already on the child's pan (right): the "৪" of ৪ + ? = ৭, or the total of a picture equation. */
  start: Piece[];
  /** What the child may add. Empty for a picture equation. */
  tray: Piece[];
  /** find: asked once the pan is level; guess: asked from the start. */
  answer: number;
  choices: number[];
};

type Rng = () => number;
const between = (rng: Rng, low: number, high: number) => low + Math.floor(rng() * (high - low + 1));
const pick = <T,>(rng: Rng, items: readonly T[]) => items[Math.floor(rng() * items.length)];
export const sum = (pieces: Piece[]) => pieces.reduce((total, piece) => total + piece.value, 0);

/** The fewest tray pieces that make `need` exactly (Infinity if they can't). */
export function fewestPieces(need: number, values: number[]) {
  const best = [0];
  for (let total = 1; total <= need; total++) best[total] = Math.min(Infinity, ...values.filter(value => value <= total).map(value => best[total - value] + 1));
  return need < 0 ? Infinity : best[need];
}

/** Two near misses and the answer, small to big, all at least 1. `trap` is the tempting wrong one (the whole pan, not half). */
export function choicesFor(answer: number, rng: Rng, trap?: number) {
  const picks = new Set([answer]);
  if (trap && trap !== answer) picks.add(trap);
  const near = [answer + 1, answer - 1, answer + 2, answer - 2].filter(value => value >= 1);
  if (rng() < 0.5) near.reverse();
  for (const value of near) { if (picks.size >= 3) break; picks.add(value); }
  return [...picks].sort((a, b) => a - b);
}

/** How many ★ a guess level shows. */
export const starsIn = (levelId: number) => (levelId === 10 ? 1 : levelId === 7 ? 2 : 3);

/** One puzzle for a level at a pace. `index` 0 is the gentlest: on level 1 a single tap finishes it. `avoid` is the last unknown fruit. */
export function makePuzzle(levelId: number, pace: Pace, rng: Rng, index = 0, avoid?: FruitId): Puzzle {
  const fruitPick = () => pick(rng, UNKNOWN_FRUITS.filter(fruit => fruit !== avoid));
  const unknown = (fruit: FruitId, value: number): Piece => ({ kind: "fruit", fruit, value, hidden: true });
  switch (levelId) {
    case 1: {
      if (index === 0) {
        const need = pick(rng, [1, 2, 5]), start = between(rng, 1, Math.min(5, 10 - need));
        return { kind: "fill", left: [weight(start + need)], start: [weight(start)], tray: WEIGHTS_10, answer: need, choices: [] };
      }
      const total = pace === -1 ? between(rng, 3, 6) : pace === 1 ? between(rng, 7, 10) : between(rng, 5, 10);
      const start = pace === -1 ? between(rng, Math.max(1, total - 4), total - 1) : pace === 1 ? between(rng, 1, total - 3) : between(rng, 1, total - 1);
      return { kind: "fill", left: [weight(total)], start: [weight(start)], tray: WEIGHTS_10, answer: total - start, choices: [] };
    }
    case 2: {
      const total = pace === -1 ? between(rng, 11, 14) : pace === 1 ? between(rng, 15, 20) : between(rng, 11, 20);
      const start = pace === -1 ? between(rng, total - 6, total - 2) : pace === 1 ? between(rng, 2, total - 8) : between(rng, 2, Math.min(10, total - 2));
      return { kind: "fill", left: [weight(total)], start: [weight(start)], tray: WEIGHTS_20, answer: total - start, choices: [] };
    }
    case 3: {
      const total = pace === -1 ? between(rng, 3, 6) : pace === 1 ? between(rng, 9, 15) : between(rng, 6, 12);
      return { kind: "fill", left: [weight(total)], start: [], tray: KNOWN_FRUITS.map(({ fruit, value }): Piece => ({ kind: "fruit", fruit, value, hidden: false })), answer: total, choices: [] };
    }
    case 8: {
      // Two weights on the given side, one already on the child's pan.
      const low = pace === -1 ? 1 : 2, high = pace === -1 ? 5 : pace === 1 ? 10 : 8;
      const a = between(rng, low, high), b = between(rng, low, high), total = a + b;
      const start = pace === -1 ? between(rng, Math.max(1, total - 4), total - 1) : pace === 1 ? between(rng, 1, Math.max(1, total - 9)) : between(rng, 1, total - 1);
      return { kind: "fill", left: [weight(a), weight(b)], start: [weight(start)], tray: WEIGHTS_20, answer: total - start, choices: [] };
    }
    case 4: {
      const value = pace === -1 ? between(rng, 2, 6) : pace === 1 ? between(rng, 6, 14) : between(rng, 3, 9);
      return { kind: "find", left: [unknown(fruitPick(), value)], start: [], tray: WEIGHTS_20, answer: value, choices: choicesFor(value, rng) };
    }
    case 5: {
      const value = pace === -1 ? between(rng, 2, 5) : pace === 1 ? between(rng, 5, 12) : between(rng, 3, 9);
      const known = pace === -1 ? between(rng, 1, 2) : pace === 1 ? between(rng, 2, 8) : between(rng, 1, 5);
      return { kind: "find", left: [unknown(fruitPick(), value), weight(known)], start: [], tray: WEIGHTS_20, answer: value, choices: choicesFor(value, rng, value + known) };
    }
    case 6: {
      const value = pace === -1 ? between(rng, 2, 4) : pace === 1 ? between(rng, 4, 9) : between(rng, 2, 7), fruit = fruitPick();
      return { kind: "find", left: [unknown(fruit, value), unknown(fruit, value)], start: [], tray: WEIGHTS_20, answer: value, choices: choicesFor(value, rng, value * 2) };
    }
    case 9: {
      // Two of the same fruit and a weight: the child halves what is left after the weight.
      const value = pace === -1 ? between(rng, 2, 3) : pace === 1 ? between(rng, 3, 7) : between(rng, 2, 5), fruit = fruitPick();
      const known = pace === -1 ? between(rng, 1, 2) : pace === 1 ? between(rng, 2, 5) : between(rng, 1, 4);
      return { kind: "find", left: [unknown(fruit, value), unknown(fruit, value), weight(known)], start: [], tray: WEIGHTS_20, answer: value, choices: choicesFor(value, rng, value * 2) };
    }
    default: {
      // ★ + n = T (level 10), ★ + ★ + n = T (7), ★ + ★ + ★ (+ n) = T (11).
      const stars = starsIn(levelId), eased = pace === -1 || index === 0;
      const value = between(rng, 2, stars === 1 ? (eased ? 5 : 8) : stars === 2 ? (eased ? 5 : 7) : (eased ? 4 : 5));
      const extra = stars === 3 ? between(rng, 0, 4) : between(rng, 1, 6);
      const left: Piece[] = [...Array.from({ length: stars }, (): Piece => ({ kind: "star", value })), ...(extra ? [weight(extra)] : [])];
      return { kind: "guess", left, start: [weight(sum(left))], tray: [], answer: value, choices: choicesFor(value, rng) };
    }
  }
}

/** The kind a level plays as (for the art and the copy). */
export const kindOfLevel = (levelId: number) => levelOf(levelId).kind;
