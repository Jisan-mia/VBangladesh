// The page's sounds, all from shared/game-sound (no audio files). Long ones are scheduled on the audio clock with
// tone(…, delay), so the player's pause (silenceScheduled) cuts a song mid-phrase.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";

/** Semitones of a major pentatonic: any run of these sounds like a tune. */
const PENTA = [0, 2, 4, 7, 9];
const note = (root: number, step: number) => root * 2 ** ((PENTA[step % 5] + 12 * Math.floor(step / 5)) / 12);

export const sound = {
  /** The signature: a ballpoint clicking down on paper. */
  penDown: () => { tone(2600, 0.018, 0.05, "triangle"); hiss(0.025, 0.06, 4200, "bandpass"); },
  /** One soft scratch per cell the stroke grows, a shade brighter as it gets longer. */
  scratch: (cells: number) => hiss(0.045, 0.045, 4200 + cells * 160, "highpass"),
  /** The found word sings: one note per cell, climbing the world's key, a step higher for each word in a run. */
  sing: (root: number, cells: number, run: number) => {
    const from = Math.min(run, 6);
    for (let k = 0; k < cells; k++) tone(note(root, from + k), 0.16, 0.08, "triangle", k * 0.06);
    tone(note(root, from + cells + 2), 0.38, 0.05, "sine", cells * 0.06);
    buzz(10);
  },
  /** A stroke that isn't a word: a soft low thud. */
  miss: () => { tone(170, 0.14, 0.08, "sine", 0, 120); buzz([20, 30, 20]); },
  /** A tap on a letter (the first of two taps). */
  tap: () => tone(1500, 0.025, 0.04, "triangle"),
  hint: () => sfx.pop(),
  /** The page solved, after the last word's song: a rising four-note call (bigger for three stars, a record or a finale). */
  fanfare: (root: number, big: boolean, delay: number) => {
    const steps = big ? [5, 7, 9, 10, 12] : [5, 7, 10];
    steps.forEach((step, k) => tone(note(root, step), big ? 0.18 : 0.14, 0.09, "triangle", delay + k * 0.07));
    if (big) tone(note(root, 15), 0.4, 0.05, "sine", delay + steps.length * 0.07);
  },
  /** The page turning: on খোঁজা শুরু and on the next level. */
  turn: () => { hiss(0.12, 0.1, 2600, "bandpass"); hiss(0.18, 0.07, 1400, "bandpass", 0.09); },
};
