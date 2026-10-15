// গুনে দেখি's rules as pure functions: three modes (count, see at a glance, which has more), three steps each,
// five items a round, a quiet ease after three misses in a row, lifted by five first-try answers.
import { makeRng, starsFor } from "../../../shared/game-core";

export type Mode = "guni" | "nojor" | "beshi";
export const MODES: { id: Mode; name: string }[] = [
  { id: "guni", name: "গুনি" },
  { id: "nojor", name: "এক নজরে" },
  { id: "beshi", name: "কোনটায় বেশি" },
];

/** One step of one mode. `min..max` is the quantity range; `pictures` answers with dot rows (ages 3–4) in place of numerals. */
export type LevelSpec = { mode: Mode; step: 1 | 2 | 3; label: string; min: number; max: number; pictures?: boolean; parts?: 2; koto?: boolean };
export const LEVELS: LevelSpec[] = [
  { mode: "guni", step: 1, label: "১–৫", min: 2, max: 5 },
  { mode: "guni", step: 2, label: "১–১০", min: 4, max: 10 },
  { mode: "guni", step: 3, label: "১–২০", min: 8, max: 20 },
  { mode: "nojor", step: 1, label: "১–৪", min: 1, max: 4, pictures: true },
  { mode: "nojor", step: 2, label: "১–৬", min: 2, max: 6 },
  { mode: "nojor", step: 3, label: "দুই ভাগে", min: 3, max: 10, parts: 2 },
  { mode: "beshi", step: 1, label: "১–৫", min: 1, max: 5 },
  { mode: "beshi", step: 2, label: "১–১০", min: 1, max: 10 },
  { mode: "beshi", step: 3, label: "কতটা বেশি", min: 1, max: 10, koto: true },
];
export const LEVEL_COUNT = LEVELS.length;
export const ITEMS = 5;

export const levelOf = (mode: Mode, step: number) => LEVELS.findIndex(spec => spec.mode === mode && spec.step === step) + 1;
export const specOf = (level: number) => LEVELS[level - 1];

/** Steps open in a mode: the first always, then each after a step with stars. Modes open on their own. */
export function openSteps(stars: Record<number, number>, mode: Mode) {
  let open = 1;
  while (open < 3 && stars[levelOf(mode, open)]) open++;
  return open;
}

export const NUMBER_WORDS = ["শূন্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়", "দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ", "বিশ"];
const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

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
export const LOOKS = ["dots", "dice", "mango", "fish"] as const;
export type Look = (typeof LOOKS)[number];

/** A fish in a pond, centred at x/y percent; `tint` picks its colour. */
export type Spot = { x: number; y: number; flip: boolean; tint: number };
export type Item =
  | { kind: "guni"; n: number; grid: [number, number]; spots: Spot[]; choices: number[] }
  | { kind: "nojor"; n: number; parts: number[]; look: Look; choices: number[]; pictures: boolean }
  | { kind: "beshi"; counts: [number, number]; bigFewer: boolean; spots: [Spot[], Spot[]]; koto: number[] | null };

type Rng = () => number;
const between = (rng: Rng, low: number, high: number) => low + Math.floor(rng() * (high - low + 1));

/** The range for this step; the quiet ease keeps to its lower half. */
export function span(level: number, eased: boolean): [number, number] {
  const { min, max } = specOf(level);
  return eased ? [min, min + Math.ceil((max - min) / 2)] : [min, max];
}

/** Columns × rows for a pond of n fish: every cell stays a big target (≥96px for up to 12 fish on a 320px phone). */
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

export function makeItem(level: number, rng: Rng, eased: boolean, index = 0): Item {
  const spec = specOf(level), [low, high] = span(level, eased);
  if (spec.mode === "guni") {
    const n = between(rng, low, high), grid = gridFor(n);
    return { kind: "guni", n, grid, spots: scatter(n, grid, rng), choices: choicesFor(n, 1, 20, rng) };
  }
  if (spec.mode === "nojor") {
    const look = LOOKS[index % LOOKS.length];
    if (spec.parts) {
      const n = between(rng, low, high), a = between(rng, Math.max(1, n - 5), Math.min(5, n - 1));
      return { kind: "nojor", n, parts: [a, n - a], look, choices: choicesFor(n, 1, 12, rng), pictures: false };
    }
    const n = between(rng, low, high);
    return { kind: "nojor", n, parts: [n], look, choices: choicesFor(n, 1, spec.pictures ? 5 : 9, rng), pictures: Boolean(spec.pictures) };
  }
  // Which has more: the ease and the first step keep the gap at two or more; "কতটা বেশি" keeps it at one to three.
  const gapLow = spec.koto ? 1 : eased || spec.step === 1 ? 2 : 1, gapHigh = spec.koto ? (eased ? 2 : 3) : high - low;
  const gap = between(rng, gapLow, Math.max(gapLow, gapHigh)), fewer = between(rng, Math.max(1, low), Math.max(1, high - gap));
  const more = fewer + gap, left = rng() < 0.5;
  const counts: [number, number] = left ? [more, fewer] : [fewer, more];
  const pond = (n: number) => scatter(n, n <= 6 ? [2, 3] : [3, 4], rng);
  return {
    kind: "beshi", counts,
    // From step 2 on, every other pond draws the fewer fish bigger, so size can't stand in for number.
    bigFewer: spec.step > 1 && !eased && index % 2 === 1,
    spots: [pond(counts[0]), pond(counts[1])],
    koto: spec.koto ? choicesFor(gap, 1, 5, rng) : null,
  };
}

export type Stage = "count" | "pick" | "koto" | "done";
export type Round = {
  level: number; seed: number; index: number; item: Item; stage: Stage;
  /** guni: the fish tapped, in counting order. */
  counted: number[];
  /** wrong tries on the question on screen, and whether this item has had any miss. */
  tries: number; clean: boolean;
  firstTry: number; missRun: number; rightRun: number; eased: boolean;
  /** fish counted (guni), patterns seen (nojor) or pond pairs compared (beshi) this round. */
  done: number;
};

const firstStage = (item: Item): Stage => item.kind === "guni" ? "count" : "pick";

export function newRound(level: number, eased = false, rightRun = 0, seed = 1 + Math.floor(Math.random() * 1e9)): Round {
  const item = makeItem(level, makeRng(seed), eased, 0);
  return { level, seed, index: 0, item, stage: firstStage(item), counted: [], tries: 0, clean: true, firstTry: 0, missRun: 0, rightRun, eased, done: 0 };
}

/** Counts a fish once. Returns null for a fish already counted or outside the counting stage. */
export function tapFish(round: Round, fish: number): Round | null {
  if (round.item.kind !== "guni" || round.stage !== "count" || round.counted.includes(fish) || fish < 0 || fish >= round.item.n) return null;
  const counted = [...round.counted, fish];
  return { ...round, counted, stage: counted.length === round.item.n ? "pick" : "count" };
}

export const answerOf = (round: Round) => {
  const item = round.item;
  if (item.kind === "beshi") return round.stage === "koto" || (round.stage === "done" && item.koto) ? Math.abs(item.counts[0] - item.counts[1]) : item.counts[0] > item.counts[1] ? 0 : 1;
  return item.n;
};

/** One answer: a number tile, or a pond (0 left, 1 right). A miss costs a try; three in a row quietly ease the next item. */
export function answer(round: Round, value: number): { round: Round; outcome: "right" | "again" | "ignore" } {
  if (round.stage !== "pick" && round.stage !== "koto") return { round, outcome: "ignore" };
  if (value !== answerOf(round)) {
    const missRun = round.missRun + 1;
    return { round: { ...round, tries: round.tries + 1, clean: false, missRun, rightRun: 0, eased: round.eased || missRun >= 3 }, outcome: "again" };
  }
  const item = round.item;
  if (item.kind === "beshi" && item.koto && round.stage === "pick") return { round: { ...round, stage: "koto", tries: 0, missRun: 0 }, outcome: "right" };
  const rightRun = round.clean ? round.rightRun + 1 : 0;
  const done = round.done + (item.kind === "guni" ? item.n : 1);
  return { round: { ...round, stage: "done", missRun: 0, rightRun, firstTry: round.firstTry + (round.clean ? 1 : 0), eased: round.eased && rightRun < 5, done }, outcome: "right" };
}

/** After two tries on a question, the answer glows. */
export const glows = (round: Round) => round.tries >= 2;

/** The next item of the round, or null after the fifth: the round then ends and waits for the child. */
export function nextItem(round: Round): Round | null {
  if (round.stage !== "done" || round.index + 1 >= ITEMS) return null;
  const index = round.index + 1, item = makeItem(round.level, makeRng(round.seed + index * 7919), round.eased, index);
  return { ...round, index, item, stage: firstStage(item), counted: [], tries: 0, clean: true };
}

/** Stars only record the round: 3 for four or five first-try answers out of five, 2 for two or three, else 1. */
export const roundStars = (firstTry: number) => starsFor(firstTry, 4, 2);

export function endLine(round: Round) {
  const mode = specOf(round.level).mode;
  if (mode === "guni") return `${bn(ITEMS)}টা পুকুরে মোট ${bn(round.done)}টা মাছ গুনলে।`;
  if (mode === "nojor") return `${bn(round.done)}টা নকশা এক নজরে দেখলে।`;
  return `${bn(round.done)} জোড়া পুকুর মেলালে।`;
}

/** Praise the method, and only when it earned it. */
export function praiseLine(round: Round) {
  if (round.firstTry < 4) return "";
  const mode = specOf(round.level).mode;
  if (mode === "guni") return "একটা একটা করে ছুঁয়ে গুনলে, তাই মিলে গেল।";
  if (mode === "nojor") return "না গুনেই চোখে ধরে ফেললে।";
  return "পাশাপাশি মিলিয়ে দেখলে, তাই ধরতে পারলে।";
}

export type Today = { fish: number; seen: number; ponds: number };
export function addToday(today: Today, round: Round): Today {
  const mode = specOf(round.level).mode;
  return { fish: today.fish + (mode === "guni" ? round.done : 0), seen: today.seen + (mode === "nojor" ? round.done : 0), ponds: today.ponds + (mode === "beshi" ? round.done : 0) };
}

/** The card's lines for the parent: what was done today, first person, no name. */
export function cardLines(today: Today) {
  return [
    today.fish ? `আজ ${bn(today.fish)}টা মাছ গুনলাম` : "",
    today.seen ? `${today.fish ? "" : "আজ "}${bn(today.seen)}টা নকশা এক নজরে চিনলাম` : "",
    today.ponds ? `${today.fish || today.seen ? "" : "আজ "}${bn(today.ponds)} জোড়া পুকুর মেলালাম` : "",
  ].filter(Boolean);
}
