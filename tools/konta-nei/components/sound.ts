// The shop's sounds, all from shared/game-sound (no audio files). Long ones are scheduled on the audio clock with
// tone(…, delay), so the player's pause (silenceScheduled) cuts them mid-phrase. The hum is the only loop.
import { buzz, hiss, loop, tone } from "../../../shared/game-sound";

/** Each shop's key for its three-note clear ident: পাড়া, বাজার, হাট. */
const ROOTS = [523, 587, 659];
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
const note = (root: number, step: number) => root * 2 ** (PENTA[Math.min(step, PENTA.length - 1)] / 12);

export const sound = {
  /** The signature opener: the tin shutter rattling up. */
  shutter: () => { for (let i = 0; i < 6; i++) hiss(0.045, 0.07, 2600 + i * 200, "bandpass", i * 0.045); tone(150, 0.3, 0.04, "square", 0, 110); },
  /** Eyes closing: a quick breath of air. */
  blink: () => { hiss(0.28, 0.1, 1400, "bandpass"); tone(420, 0.2, 0.025, "sine", 0, 260); },
  /** One of the last three seconds. */
  tick: (left: number) => tone(left === 1 ? 2300 : 1900, 0.025, 0.045, "square"),
  /** The signature: the cash box's টুং-টাং, a step higher with every answer in a row. */
  ding: (streak: number) => {
    const lift = 2 ** ((Math.min(Math.max(streak, 1), 7) - 1) * 2 / 12);
    tone(1568 * lift, 0.08, 0.07, "triangle"); tone(2093 * lift, 0.24, 0.06, "sine", 0.07); hiss(0.05, 0.04, 6000, "highpass", 0.03); buzz(10);
  },
  /** The first of two finds on a finale: half the ding. */
  half: () => { tone(1568, 0.08, 0.06, "triangle"); buzz(8); },
  /** A soft "উঁহু". */
  wrong: () => { tone(262, 0.18, 0.07, "sine", 0, 196); tone(220, 0.2, 0.05, "sine", 0.16, 175); buzz(25); },
  /** A gone thing landing back on its plank: a wooden টুক, after the drop. */
  back: (delay: number) => { tone(330, 0.06, 0.09, "triangle", delay, 240); hiss(0.03, 0.05, 900, "lowpass", delay); },
  /** A level cleared: three notes in the shop's key, a fourth for three stars or a finale. */
  ident: (world: number, big: boolean, delay = 0) => {
    const root = ROOTS[world] ?? ROOTS[0], steps = big ? [2, 4, 5, 7] : [2, 4, 5];
    steps.forEach((step, k) => tone(note(root, step), big && k === steps.length - 1 ? 0.4 : 0.16, 0.09, "triangle", delay + k * 0.09));
  },
  /** The hum of the look, climbing as the time runs out. */
  hum: () => { const live = loop("hum", 110); live.set(0.16); return live; },
};
