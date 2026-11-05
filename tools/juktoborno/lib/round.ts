// One round: a level's words in a seeded order, the letter tiles for each word, the hint ladder, the quiet difficulty steps
// and the stars. Pure and deterministic (makeRng only), so the tests and the bots play exactly what the page plays.
import { makeRng, starsFor } from "../../../shared/game-core";
import { levelOf } from "./levels";
import { bn, conjunct, type Mode, type Word } from "./words";

/** Wrong tiles shown with a word's own letters: 2 normally, 1 after three misses in a row, 3 after five right in a row. Never announced. */
export const DECOYS = { easy: 1, normal: 2, hard: 3 } as const;
export type Pace = keyof typeof DECOYS;
/** The very first level opens with two tiles, so the first win is a tap or two away. */
export const startPace = (level: number): Pace => level === 1 ? "easy" : "normal";

/** A word and how it is asked: ভাঙি shows the যুক্তবর্ণ and asks for its letters, জুড়ি hides it. */
export type Step = { word: Word; mode: Mode };

export type Outcome = "fill" | "right" | "order" | "wrong" | "ignore";
export type Round = {
  level: number; seed: number; steps: readonly Step[]; index: number;
  /** Letters in the machine's slots so far. */
  filled: string[];
  /** The current word is done and waits for the child's পরেরটা. */
  solved: boolean;
  /** Full tries that missed, in the whole round (for the stars). */
  misses: number;
  /** Words right on the first full try. */
  firstTry: number;
  /** Full tries that missed on this word (for the hints). */
  tries: number;
  missRun: number; rightRun: number; pace: Pace;
  /** The last full try, kept on screen until the next tap so the child can see what fitted. */
  last: { outcome: Outcome; tried: string[] } | null;
};

function shuffle<T>(items: readonly T[], rng: () => number) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** The letter tiles for one word: its distinct base letters plus `pace` decoys, shuffled. Tiles are never used up (ক + ক). */
export function tilesFor(word: Word, pace: Pace, seed: number) {
  return shuffle([...new Set(word.parts), ...word.decoys.slice(0, DECOYS[pace])], makeRng(seed));
}

export function createRound(id: number, seed: number, pace?: Pace): Round {
  const level = levelOf(id), rng = makeRng(seed);
  const steps = shuffle(level.words, rng).slice(0, level.size).map((word, at): Step => ({ word, mode: level.mode === "mixed" ? (at % 2 === 0 ? "bhangi" : "juri") : level.mode }));
  return { level: level.id, seed, steps, index: 0, filled: [], solved: false, misses: 0, firstTry: 0, tries: 0, missRun: 0, rightRun: 0, pace: pace ?? startPace(level.id), last: null };
}

export const currentStep = (round: Round) => round.steps[round.index];
export const isLast = (round: Round) => round.index >= round.steps.length - 1;
export const tiles = (round: Round) => tilesFor(currentStep(round).word, round.pace, round.seed + round.index * 7919);

/** Puts a letter in the next empty slot; when the slots are full, checks them. A wrong try empties the slots. */
export function place(round: Round, letter: string): { round: Round; outcome: Outcome } {
  if (round.solved) return { round, outcome: "ignore" };
  const { word } = currentStep(round), filled = [...round.filled, letter];
  if (filled.length < word.parts.length) return { round: { ...round, filled, last: null }, outcome: "fill" };
  if (filled.every((part, i) => part === word.parts[i])) {
    const rightRun = round.rightRun + 1;
    // The pace changes only for the next word, never under the child's finger.
    const pace: Pace = rightRun >= 5 ? "hard" : round.pace === "easy" && rightRun >= 2 ? "normal" : round.pace;
    return {
      round: { ...round, filled, solved: true, rightRun, missRun: 0, pace, firstTry: round.firstTry + (round.tries === 0 ? 1 : 0), last: { outcome: "right", tried: filled } },
      outcome: "right",
    };
  }
  const outcome: Outcome = [...filled].sort().join() === [...word.parts].sort().join() ? "order" : "wrong";
  const missRun = round.missRun + 1;
  return {
    round: { ...round, filled: [], misses: round.misses + 1, tries: round.tries + 1, missRun, rightRun: 0, pace: missRun >= 3 ? "easy" : round.pace === "hard" ? "normal" : round.pace, last: { outcome, tried: filled } },
    outcome,
  };
}

/** Takes the last letter back out of the machine. */
export const unplace = (round: Round): Round => round.solved || !round.filled.length ? round : { ...round, filled: round.filled.slice(0, -1), last: null };

/** On to the next word. */
export const nextStep = (round: Round): Round => isLast(round) || !round.solved ? round : { ...round, index: round.index + 1, filled: [], solved: false, tries: 0, last: null };

/** 0 = nothing, 1 = a one-line reason, 2 = the next tile glows (after two missed tries on this word). */
export const hint = (round: Round) => round.solved ? 0 : Math.min(2, round.tries);

/** The letter the glowing tile is: the next empty slot's. */
export const wanted = (round: Round) => round.solved ? null : currentStep(round).word.parts[round.filled.length] ?? null;

/** For the last missed try: each tried letter is in its right place or not (a tick, or a dashed hop-out). */
export function marksOf(round: Round): ("right" | "wrong")[] {
  const last = round.last;
  if (!last || last.outcome === "right" || last.outcome === "fill" || last.outcome === "ignore") return [];
  const { word } = currentStep(round);
  return last.tried.map((letter, at) => letter === word.parts[at] ? "right" : "wrong");
}

/** Why a try didn't fit, in one line, naming what was right. Never a buzzer, never "ভুল". */
export function whyLine(round: Round) {
  const last = round.last, step = round.steps[round.index];
  if (!last || last.outcome === "right" || last.outcome === "fill" || last.outcome === "ignore" || !step) return "";
  const parts = step.word.parts;
  if (last.outcome === "order") return `বর্ণ ${parts.length === 3 ? "তিনটা" : "দুটো"} ঠিক, আগে-পরে উল্টো। যেটা আগে শোনো, সেটা আগে বসাও।`;
  const kept = last.tried.filter((part, i) => part === parts[i]);
  const stray = [...new Set(last.tried.filter(part => !parts.includes(part)))];
  const lines = [kept.length ? `${kept.join(", ")} ঠিক জায়গায়।` : "", stray.length ? `${stray.join(", ")} এই যুক্তবর্ণে নেই।` : ""].filter(Boolean);
  return lines.length ? lines.join(" ") : "আরেকবার ভাবো। শব্দটা ধীরে বলে দেখো।";
}

/** Stars record clean work: 0–1 missed tries in a round = 3, up to size − 2 = 2, else 1. */
export const starsOf = (misses: number, size = 6) => starsFor(misses, 1, size - 2, true);

/** What a finished round shows and records. */
export type Result = { level: number; stars: number; words: number; firstTry: number; misses: number; steps: readonly Step[] };
export const resultOf = (round: Round): Result =>
  ({ level: round.level, stars: starsOf(round.misses, round.steps.length), words: round.steps.length, firstTry: round.firstTry, misses: round.misses, steps: round.steps });

/** A praise line about the method, only when it was earned. */
export function methodLine(result: Pick<Result, "misses">) {
  if (result.misses === 0) return "একবারও আগে-পরে গোলমাল হয়নি। ধীরে বলে বলে বসিয়েছ।";
  if (result.misses <= 4) return `${bn(result.misses)}বার আবার ভাবতে হয়েছে, তারপর সব মিলেছে।`;
  return "কঠিন ছিল, তবু শেষ পর্যন্ত সবগুলো মিলিয়েছ।";
}

/** "আজ ৬টা যুক্তবর্ণ ভাঙলাম" for the card; জুড়লাম after a জুড়ি round, both when the round had both. */
export function cardLine(steps: readonly Step[]) {
  const modes = new Set(steps.map(step => step.mode));
  const verb = modes.has("bhangi") && modes.has("juri") ? "ভাঙলাম আর জুড়লাম" : modes.has("juri") ? "জুড়লাম" : "ভাঙলাম";
  return `আজ ${bn(steps.length)}টা যুক্তবর্ণ ${verb}`;
}

/** The যুক্তবর্ণ of the current word, as the machine's block shows it. */
export const jointOf = (round: Round) => conjunct(currentStep(round).word.parts);
