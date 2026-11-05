// The cash box's sounds, all from shared/game-sound (no audio files, no loop). Longer phrases are scheduled on the
// audio clock with tone(…, delay), so the player's pause (silenceScheduled) cuts them mid-phrase.
import { buzz, hiss, tone } from "../../../shared/game-sound";

/** Each world's key for its clear ident: the slate, the ledger, the ফর্দ. */
const ROOTS = [523, 587, 659];
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
const note = (root: number, step: number) => root * 2 ** (PENTA[Math.min(step, PENTA.length - 1)] / 12);

export const sound = {
  /** The signature: the cash box's ক্যাচিং, a step higher with every answer in a row (up to ten). */
  ching: (streak: number) => {
    const lift = 2 ** ((Math.min(Math.max(streak, 1), 10) - 1) / 12);
    hiss(0.05, 0.06, 5200, "highpass"); tone(2093 * lift, 0.08, 0.06, "triangle", 0.02); tone(2637 * lift, 0.28, 0.05, "sine", 0.06); buzz(10);
  },
  /** The combo going up a step (×২, ×৩, ×৪): a coin on top of the ching. */
  combo: () => { tone(1568, 0.06, 0.06, "square", 0.05); tone(2093, 0.16, 0.05, "square", 0.1); },
  /** A soft "উঁহু". */
  wrong: () => { tone(262, 0.18, 0.07, "sine", 0, 196); tone(220, 0.2, 0.05, "sine", 0.16, 175); buzz(25); },
  /** The drawer sliding open on শুরু করো. */
  drawer: () => { hiss(0.16, 0.07, 2600, "bandpass"); tone(180, 0.12, 0.05, "triangle", 0.02, 120); tone(2637, 0.3, 0.05, "sine", 0.16); },
  /** A star earned mid-round. */
  star: (n: number) => { tone([1047, 1319, 1568][Math.max(0, Math.min(2, n - 1))], 0.2, 0.09, "triangle"); tone([1319, 1568, 2093][Math.max(0, Math.min(2, n - 1))], 0.24, 0.06, "sine", 0.08); },
  /** One of the last five seconds. */
  tick: (left: number) => tone(left === 1 ? 2300 : 1900, 0.025, 0.045, "square"),
  /** Time's up: one round bell. */
  bell: () => { tone(784, 0.6, 0.08, "sine"); tone(392, 0.7, 0.05, "triangle", 0.02); },
  /** A level cleared: three notes in the world's key, a fourth for three stars or a finale. */
  ident: (world: number, big: boolean, delay = 0) => {
    const root = ROOTS[world] ?? ROOTS[0], steps = big ? [2, 4, 5, 7] : [2, 4, 5];
    steps.forEach((step, k) => tone(note(root, step), big && k === steps.length - 1 ? 0.4 : 0.16, 0.09, "triangle", delay + k * 0.09));
  },
};
