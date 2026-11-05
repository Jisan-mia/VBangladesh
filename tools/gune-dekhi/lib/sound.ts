// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music, no voice). Each has a picture twin on
// screen: the number on the fish, the pond cheering, the grey wobble, the pattern showing and hiding, the stars.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import type { WorldId } from "./levels";

// Each world's own key, so "ঠিক" sounds a little different at the ghat, the fair and the market.
const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 659 };
// A major pentatonic climb: 0 2 4 7 9 in semitones, then up an octave, so twenty fish still sound like a tune.
const CLIMB = [0, 2, 4, 7, 9];

export const sound = {
  /** A finger on something. */
  tap: () => sfx.tap(),
  /** The signature, "গোনা": a water plip, then a marimba note one step higher than the last fish. */
  count: (n: number) => {
    const step = Math.max(0, n - 1), semitones = CLIMB[step % 5] + 12 * Math.floor(step / 5);
    const freq = 392 * 2 ** (Math.min(semitones, 31) / 12);
    tone(freq * 1.5, 0.05, 0.05, "sine", 0, freq * 0.8);
    tone(freq, 0.2, 0.1, "triangle", 0.015);
    buzz(6);
  },
  /** The last fish is counted: a small bell, so the child hears "that's all of them". */
  counted: () => { tone(1319, 0.28, 0.07, "sine", 0.08); tone(1976, 0.3, 0.04, "sine", 0.1); },
  /** A right answer: two rising notes in the world's key. */
  right: (world: WorldId) => {
    const root = ROOT[world];
    tone(root, 0.12, 0.09, "triangle");
    tone(root * 1.5, 0.22, 0.08, "triangle", 0.09);
    buzz(10);
  },
  /** A wrong answer: a soft low boing, never a buzzer. */
  miss: () => { tone(300, 0.16, 0.07, "sine", 0, 230); tone(420, 0.06, 0.05, "triangle", 0.18); },
  /** The pattern shows, and hides again. */
  show: () => hiss(0.16, 0.08, 2200, "bandpass"),
  hide: () => tone(520, 0.07, 0.05, "sine", 0, 360),
  /** The next pond comes. */
  page: () => hiss(0.16, 0.05, 1900, "bandpass"),
  /** The two ponds pour into one. */
  merge: () => { tone(260, 0.3, 0.07, "sine", 0, 520); hiss(0.3, 0.06, 900); },
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: WorldId) => {
    const root = ROOT[world];
    [1, 1.25, 1.5, 2].forEach((step, at) => tone(root * step, 0.2, 0.08, "triangle", 0.1 + at * 0.14));
  },
};
