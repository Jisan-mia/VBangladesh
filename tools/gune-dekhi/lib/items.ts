// One question of a round (a "pond"): what is on screen and what the answer is. Pure and seeded: the same seed and level
// make the same pond on every phone. The shapes of fish and mangoes are in shapes.ts, the rules of a round in round.ts.
import { levelOf, type Look } from "./levels";

type Rng = () => number;
const between = (rng: Rng, low: number, high: number) => low + Math.floor(rng() * (high - low + 1));

/** Pip spots for 1–6 in a unit square, the dice layouts children meet in লুডু. */
export const PIPS: [number, number][][] = [
  [],
  [[0.5, 0.5]],
  [[0.27, 0.27], [0.73, 0.73]],
  [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
  [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
  [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
  [[0.28, 0.22], [0.28, 0.5], [0.28, 0.78], [0.72, 0.22], [0.72, 0.5], [0.72, 0.78]],
];
export const LOOKS: readonly Look[] = ["dots", "dice", "mango", "fish"];

/** A fish in a pond, centred at x/y percent; `tint` picks its colour. */
export type Spot = { x: number; y: number; flip: boolean; tint: number };
export type Item =
  | { kind: "guni"; n: number; grid: [number, number]; spots: Spot[]; choices: number[] }
  | { kind: "nojor"; n: number; parts: number[]; look: Look; choices: number[]; pictures: boolean }
  | { kind: "beshi"; counts: [number, number]; bigFewer: boolean; spots: [Spot[], Spot[]]; koto: number[] | null }
  | { kind: "merge"; counts: [number, number]; spots: [Spot[], Spot[]]; n: number; choices: number[] };

/** The quantity range of a level. The quiet ease keeps to the lower half; a warm-up pond is the lowest two. */
export function span(level: number, eased: boolean, warm = false): [number, number] {
  const { min, max } = levelOf(level);
  if (warm) return [min, Math.min(max, min + 1)];
  return eased ? [min, min + Math.ceil((max - min) / 2)] : [min, max];
}

/** Columns × rows for a pond of n fish. Up to 12 fish keep every cell ≥ 96 px on a 320 px phone; 13–20 are for the 5–6 year olds (≥ 72 px). */
export const gridFor = (n: number): [number, number] => n <= 6 ? [3, 2] : n <= 12 ? [3, 4] : [4, 5];

/** n fish in distinct grid cells, nudged a little inside each so the pond doesn't look like a table. */
export function scatter(n: number, [cols, rows]: [number, number], rng: Rng): Spot[] {
  const cells = Array.from({ length: cols * rows }, (_, index) => index);
  for (let index = cells.length - 1; index > 0; index--) { const swap = Math.floor(rng() * (index + 1)); [cells[index], cells[swap]] = [cells[swap], cells[index]]; }
  return cells.slice(0, n).sort((a, b) => a - b).map(cell => ({
    x: ((cell % cols) + 0.5 + (rng() - 0.5) * 0.24) / cols * 100,
    y: (Math.floor(cell / cols) + 0.5 + (rng() - 0.5) * 0.2) / rows * 100,
    flip: rng() < 0.5,
    tint: Math.floor(rng() * 4),
  }));
}

/** Fish lined up two by two from the top: two ponds side by side then match one to one, and the extra fish stick out. */
export const lined = (n: number): Spot[] => Array.from({ length: n }, (_, index) => ({ x: index % 2 ? 70 : 30, y: 11 + Math.floor(index / 2) * 19, flip: false, tint: index % 4 }));

/** The answer and two near neighbours inside low..high, in counting order. */
export function choicesFor(answer: number, low: number, high: number, rng: Rng) {
  const near = [answer - 1, answer + 1, answer - 2, answer + 2, answer - 3, answer + 3].filter(value => value >= low && value <= high);
  const first = near.splice(rng() < 0.5 || near.length < 3 ? 0 : 1, 1)[0];
  const second = near.find(value => value !== first)!;
  return [answer, first, second].sort((a, b) => a - b);
}

/** Two group sizes that add to n, each from 1 to `group`. */
export function splitOf(n: number, group: number, rng: Rng): [number, number] {
  const a = between(rng, Math.max(1, n - group), Math.min(group, n - 1));
  return [a, n - a];
}

const pond = (n: number, rng: Rng) => scatter(n, n <= 6 ? [2, 3] : [3, 4], rng);

export function makeItem(level: number, rng: Rng, eased: boolean, index = 0): Item {
  const spec = levelOf(level), [low, high] = span(level, eased, Boolean(spec.warm) && index === 0);
  if (spec.kind === "guni") {
    const n = between(rng, low, high), grid = gridFor(n);
    return { kind: "guni", n, grid, spots: scatter(n, grid, rng), choices: choicesFor(n, 1, 20, rng) };
  }
  if (spec.kind === "nojor") {
    const look = spec.look ?? LOOKS[index % LOOKS.length];
    if (spec.parts) {
      const n = between(rng, low, high), [a, b] = splitOf(n, spec.group ?? 5, rng);
      return { kind: "nojor", n, parts: [a, b], look, choices: choicesFor(n, 2, 12, rng), pictures: false };
    }
    const n = between(rng, low, high);
    return { kind: "nojor", n, parts: [n], look, choices: choicesFor(n, 1, spec.pictures ? 5 : 9, rng), pictures: Boolean(spec.pictures) };
  }
  if (spec.kind === "merge") {
    const n = between(rng, low, high), [a, b] = splitOf(n, 6, rng), left = rng() < 0.5;
    const counts: [number, number] = left ? [a, b] : [b, a];
    return { kind: "merge", counts, spots: [pond(counts[0], rng), pond(counts[1], rng)], n, choices: choicesFor(n, 2, 12, rng) };
  }
  // Which has more: the ease and the first step keep the gap at two or more; "কতটা বেশি" keeps it at one to three.
  const step = spec.koto ? 3 : spec.id === 7 ? 1 : 2;
  const gapLow = spec.koto ? 1 : eased || step === 1 ? 2 : 1, gapHigh = spec.koto ? (eased ? 2 : 3) : high - low;
  const gap = between(rng, gapLow, Math.max(gapLow, gapHigh)), fewer = between(rng, Math.max(1, low), Math.max(1, high - gap));
  const more = fewer + gap, left = rng() < 0.5;
  const counts: [number, number] = left ? [more, fewer] : [fewer, more];
  return {
    kind: "beshi", counts,
    // From the second step on, every other pond draws the fewer fish bigger, so size can't stand in for number.
    bigFewer: step > 1 && !eased && index % 2 === 1,
    spots: [pond(counts[0], rng), pond(counts[1], rng)],
    koto: spec.koto ? choicesFor(gap, 1, 5, rng) : null,
  };
}
