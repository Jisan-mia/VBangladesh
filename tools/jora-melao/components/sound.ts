// The board's sounds, all from shared/game-sound (no audio files, no loops). Everything is scheduled on the audio clock
// with tone(…, delay), so the player's pause (silenceScheduled) cuts it mid-phrase, and nothing keeps playing behind a menu.
import { buzz, hiss, tone } from "../../../shared/game-sound";

/** Each table's key for the clear ident: মেলা, হাট, বিল. */
const ROOTS = [523, 587, 659];
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
const note = (root: number, step: number) => root * 2 ** (PENTA[Math.min(step, PENTA.length - 1)] / 12);

export const sound = {
  /** A card turning on the jute: a papery swish and a tick. `delay` staggers the peek's wave. */
  flip: (delay = 0) => { hiss(0.06, 0.07, 3200, "bandpass", delay); tone(1250, 0.025, 0.03, "triangle", delay); },
  /** The signature, মেলার ঘণ্টা: a fair bell for a match, a step higher for every match in a row. */
  bell: (streak: number) => {
    const lift = 2 ** ((Math.min(Math.max(streak, 1), 7) - 1) * 2 / 12);
    tone(1568 * lift, 0.09, 0.08, "triangle"); tone(2093 * lift, 0.26, 0.06, "sine", 0.07); hiss(0.04, 0.03, 6000, "highpass", 0.03); buzz(12);
  },
  /** A miss: a soft wooden টুক, not a buzzer. */
  miss: () => tone(240, 0.12, 0.08, "sine", 0, 170),
  /** The edge turns amber: one low tick (a star is at stake). */
  stake: () => tone(330, 0.07, 0.05, "triangle", 0, 300),
  /** A star made out of reach: a dull double knock. */
  crack: () => { tone(170, 0.12, 0.1, "sine", 0, 110); tone(150, 0.14, 0.08, "sine", 0.13, 100); buzz([25, 40, 25]); },
  /** The birds fly (or the mela's wind): a flutter. */
  flutter: () => { for (let i = 0; i < 5; i++) hiss(0.05, 0.06, 2800 + i * 260, "bandpass", i * 0.055); tone(520, 0.2, 0.03, "sine", 0, 760); },
  /** A board cleared: three notes in the table's key, four for ★★★ or a finale. */
  ident: (world: number, big: boolean, delay = 0) => {
    const root = ROOTS[world] ?? ROOTS[0], steps = big ? [2, 4, 5, 7] : [2, 4, 5];
    steps.forEach((step, k) => tone(note(root, step), big && k === steps.length - 1 ? 0.4 : 0.16, 0.09, "triangle", delay + k * 0.09));
  },
};
