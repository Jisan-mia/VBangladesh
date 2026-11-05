// The beat plan: every beat of a level, with when it starts, whose it is and what it shows. Pure.
import { levelOf, rhymeForLevel, type Guide } from "./levels";
import { bare, wordsOf } from "./poems";

/** Two beats counted in before the first word (and again after coming back). */
export const COUNT_IN = 2;

export type Beat = {
  pass: number;
  line: number;
  /** The word that lights, or -1 for the rest at a line's end. */
  word: number;
  /** A bigger beat (the first word of a breath on a level that teaches it). */
  big: boolean;
  /** The last beat of its line (the line's rest when it has one): the bead fills here. */
  last: boolean;
  /** The ঢুলি plays this beat (sticks, sound) rather than you. */
  dhuli: boolean;
  /** Your tap here counts towards the stars. */
  mine: boolean;
  guide: Guide;
};

export type Plan = {
  beats: readonly Beat[];
  /** When each beat starts, in ms from the first word. */
  at: Float64Array;
  /** The first beat of each beat's line. */
  lineAt: Int32Array;
  /** How long each beat lasts. */
  len: Float64Array;
  /** Start of the first beat of every (pass, line), as a beat index, and which beat is a line's first. */
  starts: readonly number[];
  total: number;
  /** The beats whose taps are scored. */
  words: number;
  /** Dots a line shows at most (words and a rest). */
  dots: number;
};

/** Is the word after a comma or at the start of a line: the first word of a breath. */
const breathStart = (words: readonly string[], index: number) => index === 0 || words[index - 1].endsWith(",");

export function buildPlan(levelId: number): Plan {
  const level = levelOf(levelId), rhyme = rhymeForLevel(levelId);
  const beats: Beat[] = [], starts: number[] = [], lens: number[] = [];
  for (let pass = 0; pass < level.passes; pass++) {
    const guide: Guide = pass === level.passes - 1 ? level.guide : "full";
    rhyme.lines.forEach((text, line) => {
      // Echo: the ঢুলি plays even lines on the first pass, you play them on the second.
      const dhuli = level.echo ? (line % 2 === 0) === (pass % 2 === 0) : pass === 0;
      const mine = level.echo ? !dhuli : true;
      const words = wordsOf(text), ms = level.beatMs * (level.scale?.[line] ?? 1);
      starts.push(beats.length);
      words.forEach((_, word) => {
        beats.push({ pass, line, word, big: level.strong && breathStart(words, word), last: !level.rests && word === words.length - 1, dhuli, mine, guide });
        lens.push(ms);
      });
      if (level.rests) { beats.push({ pass, line, word: -1, big: false, last: true, dhuli, mine: false, guide }); lens.push(ms); }
    });
  }
  const at = new Float64Array(beats.length), len = Float64Array.from(lens), lineAt = new Int32Array(beats.length);
  let total = 0;
  for (let index = 0; index < beats.length; index++) { at[index] = total; total += len[index]; }
  starts.forEach((start, at2) => { const end = starts[at2 + 1] ?? beats.length; for (let index = start; index < end; index++) lineAt[index] = start; });
  const words = beats.filter(beat => beat.word >= 0 && beat.mine).length;
  const dots = Math.max(...rhyme.lines.map(text => wordsOf(text).length)) + (level.rests ? 1 : 0);
  return { beats, at, lineAt, len, starts, total, words, dots };
}

/** The beat index where this beat's line begins. */
export function lineStartOf(plan: Plan, index: number): number {
  let start = 0;
  for (const candidate of plan.starts) { if (candidate <= index) start = candidate; else break; }
  return start;
}

/** The first beat of the line after this beat's line, or -1 after the last. */
export function nextLineStart(plan: Plan, index: number): number {
  return plan.starts.find(candidate => candidate > index) ?? -1;
}

/** How many beats a line has (words, and its rest). */
export const lineBeats = (plan: Plan, index: number) => {
  const start = lineStartOf(plan, index), next = nextLineStart(plan, index);
  return (next < 0 ? plan.beats.length : next) - start;
};

/** The word without punctuation, for the tune and the card. */
export const coreOf = (word: string) => bare(word);
