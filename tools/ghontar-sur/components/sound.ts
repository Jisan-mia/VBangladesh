// The bells' sounds, all from shared/game-sound (no audio files). Long ones are scheduled on the audio clock with
// tone(…, delay), so the player's pause (silenceScheduled) cuts them mid-phrase. There is no loop: the melody is the sound.
import { buzz, hiss, tone } from "../../../shared/game-sound";
import { BELL_HZ } from "../lib/tune";

/** Each world's key for its clear ident: the gate, the banyan, the night. */
const ROOTS = [523, 587, 659];
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
const note = (root: number, step: number) => root * 2 ** (PENTA[Math.min(step, PENTA.length - 1)] / 12);

export const sound = {
  /** The signature টুং: a round brass note that sags a little, two bright overtones, and the clapper's knock. 3 oscillators. */
  bell: (bell: number, loud = 1) => {
    const frequency = BELL_HZ[bell];
    if (!frequency) return;
    tone(frequency, 0.95, 0.13 * loud, "sine", 0, frequency * 0.992);
    tone(frequency * 2.76, 0.38, 0.045 * loud, "sine");
    tone(frequency * 5.4, 0.12, 0.02 * loud, "triangle");
    hiss(0.03, 0.05 * loud, 3200, "highpass");
  },
  /** A slip: a dull clank, no pitch of the bells, so it is never mistaken for a note. */
  slip: () => { tone(170, 0.26, 0.1, "triangle", 0, 105); hiss(0.14, 0.08, 520, "lowpass"); buzz([30, 40, 30]); },
  /** A round right: two quick notes up. */
  round: (step: number) => { const lift = 2 ** (Math.min(step, 5) / 12); tone(1047 * lift, 0.1, 0.06, "triangle"); tone(1568 * lift, 0.2, 0.05, "sine", 0.07); buzz(10); },
  /** The title bell: the biggest bell, struck hard, with a long shimmer. */
  start: () => { tone(196, 1.3, 0.12, "sine", 0, 190); tone(392, 1.0, 0.1, "sine", 0, 388); tone(1082, 0.6, 0.04, "sine"); tone(2116, 0.2, 0.02, "triangle"); hiss(0.05, 0.07, 2600, "highpass"); buzz(12); },
  /** A level cleared: three notes in the world's key, a fourth for three stars or a finale. */
  ident: (world: number, big: boolean, delay = 0) => {
    const root = ROOTS[world] ?? ROOTS[0], steps = big ? [2, 4, 5, 7] : [2, 4, 5];
    steps.forEach((step, k) => tone(note(root, step), big && k === steps.length - 1 ? 0.45 : 0.18, 0.09, "triangle", delay + k * 0.09));
  },
};
