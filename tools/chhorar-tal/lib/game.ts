// The rules, with no React: four levels (one ছড়া each), the beat plan, when a tap counts as "on the beat", choices and stars.
import { starsFor } from "../../../shared/game-core";
import { pictureOf, type Picture } from "./pictures";
import { rhymeOf, wordsOf, type Rhyme } from "./rhymes";

/** beatMs: one word per beat, slow and steady (about 67 → 77 beats a minute). windowMs: how far off a tap may land and still glow. */
export type Level = { level: number; rhyme: string; beatMs: number; windowMs: number; choices: number; age: string };

export const LEVELS: readonly Level[] = [
  { level: 1, rhyme: "hattima", beatMs: 900, windowMs: 240, choices: 2, age: "৩+" },
  { level: 2, rhyme: "ata", beatMs: 860, windowMs: 230, choices: 2, age: "৩+" },
  { level: 3, rhyme: "chand", beatMs: 820, windowMs: 220, choices: 3, age: "৪+" },
  { level: 4, rhyme: "agdum", beatMs: 780, windowMs: 200, choices: 3, age: "৫+" },
];
export const LEVEL_COUNT = LEVELS.length;
/** The ছড়া goes round twice: once to hear the beat, once to play along. */
export const PASSES = 2;
export const COUNT_IN = 2;

export const levelOf = (level: number) => LEVELS[Math.max(0, Math.min(LEVEL_COUNT, Math.round(level) || 1) - 1)];
export const rhymeForLevel = (level: number) => rhymeOf(levelOf(level).rhyme)!;

/** One beat: which line is showing and which word lights (-1: none, a count-in or the rest at a line's end). */
export type Beat = { pass: number; line: number; word: number };

/** Two silent count-in beats, then each line word by word with one resting beat after it, all of it `passes` times. */
export function beatPlan(rhyme: Rhyme, passes = PASSES): Beat[] {
  const plan: Beat[] = Array.from({ length: COUNT_IN }, () => ({ pass: 0, line: -1, word: -1 }));
  for (let pass = 0; pass < passes; pass++) {
    rhyme.lines.forEach((text, line) => {
      wordsOf(text).forEach((_, word) => plan.push({ pass, line, word }));
      plan.push({ pass, line, word: -1 });
    });
  }
  return plan;
}

export const wordBeats = (plan: readonly Beat[]) => plan.filter(beat => beat.word >= 0).length;

/** The beat nearest to a tap at `elapsedMs`, and whether the tap landed within `windowMs` of it. */
export function nearBeat(elapsedMs: number, beatMs: number, windowMs: number) {
  const beat = Math.round(elapsedMs / beatMs);
  return { beat, near: Math.abs(elapsedMs - beat * beatMs) <= windowMs };
}

/** Three off-beat taps in a row quietly widen the window by half; five on the beat in a row narrow it a little. Never announced. */
export function windowFor(base: number, missRun: number, hitRun: number) {
  if (missRun >= 3) return Math.round(base * 1.5);
  if (hitRun >= 5) return Math.round(base * 0.85);
  return base;
}

export function shuffle<T>(list: readonly T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The missing word's picture plus `count - 1` pictures that don't rhyme with it, in a random order. */
export function choicesFor(rhyme: Rhyme, count: number, rng: () => number): Picture[] {
  const others = shuffle(rhyme.others, rng).slice(0, count - 1);
  return shuffle([rhyme.answer, ...others], rng).map(id => pictureOf(id)!);
}

/** Stars are a record only: one for finishing; two for tapping a quarter of the words on the beat or finding the rhyme first time; three for half and first time. */
export function starsOf(hits: number, words: number, firstTry: boolean) {
  const beat = starsFor(words ? hits / words : 0, 0.5, 0.25);
  if (beat === 3 && firstTry) return 3;
  return beat >= 2 || firstTry ? 2 : 1;
}

export const cardTitle = (lines: number, bn: (n: number) => string) => `আজ ${bn(lines)} লাইনের ছড়া তালে তালে বললাম`;

/** The fixed result behind `#og`, for the site's preview image only: it saves nothing and skips the daily limit. */
export const OG_DEMO = { level: 1, stars: 3, hits: 26, words: 30 };
export const isOgHash = (hash: string) => hash === "#og";

