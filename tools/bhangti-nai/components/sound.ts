// The shop's sounds, all from shared/game-sound (no audio files). Long ones are scheduled on the audio clock with
// tone(…, delay), so the player's pause (silenceScheduled) cuts them mid-phrase. There is no loop, so none can outlive a pause.
import { buzz, hiss, tone } from '../../../shared/game-sound';

/** Each shop's key for its three-note clear ident: পাড়া, বাজার, হাট. */
const ROOTS = [523, 587, 659];
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
const note = (root: number, step: number) => root * 2 ** (PENTA[Math.min(step, PENTA.length - 1)] / 12);

export const sound = {
  /** The signature opener: a brass counter bell. */
  bell: () => { hiss(0.03, 0.08, 4000, 'highpass'); tone(1568, 0.55, 0.08, 'triangle'); tone(2349, 0.6, 0.05, 'sine'); tone(3136, 0.3, 0.025, 'sine', 0.01); buzz(12); },
  /** A customer steps up: a small ding. */
  arrive: () => tone(1318, 0.16, 0.035, 'triangle'),
  /** Coins clink, notes rustle: the sound says which kind of chit went down. */
  chit: (value: number, soft = false) => {
    const volume = soft ? 0.5 : 1;
    if (value <= 5) { tone(2637, 0.08, 0.06 * volume, 'sine'); tone(3520, 0.11, 0.04 * volume, 'sine', 0.025); }
    else { hiss(0.08, 0.1 * volume, 3200, 'highpass'); hiss(0.07, 0.06 * volume, 1800, 'bandpass', 0.05); }
    buzz(6);
  },
  /** The signature: the cash drawer slides out and its bell rings, ক্যাচিং, a step higher for each first try in a row. */
  till: (streak: number) => {
    const lift = 2 ** ((Math.min(Math.max(streak, 1), 7) - 1) * 2 / 12);
    hiss(0.12, 0.12, 900, 'lowpass');
    tone(1760 * lift, 0.3, 0.08, 'triangle', 0.06); tone(2637 * lift, 0.4, 0.05, 'sine', 0.08);
    buzz(10);
  },
  /** A soft "উঁহু". */
  wrong: () => { tone(262, 0.18, 0.07, 'sine', 0, 196); tone(220, 0.2, 0.05, 'sine', 0.16, 175); buzz(25); },
  /** A customer huffs off: the door sliding shut. */
  walkoff: () => { hiss(0.28, 0.07, 700, 'lowpass'); tone(196, 0.34, 0.05, 'sine', 0.02, 120); buzz([15, 40, 15]); },
  /** One of the last three seconds. */
  tick: (left: number) => tone(left === 1 ? 2300 : 1900, 0.025, 0.045, 'square'),
  /** A day cleared: three notes in the shop's key, a fourth for three stars or a finale. */
  ident: (world: number, big: boolean, delay = 0) => {
    const root = ROOTS[world] ?? ROOTS[0], steps = big ? [2, 4, 5, 7] : [2, 4, 5];
    steps.forEach((step, k) => tone(note(root, step), big && k === steps.length - 1 ? 0.4 : 0.16, 0.09, 'triangle', delay + k * 0.09));
  },
};
