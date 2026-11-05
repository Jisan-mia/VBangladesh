// The tool's soft sounds, synthesized (shared/game-sound.ts only; no loops, no music). Each has a picture twin on screen:
// the hands or brush moving, the germs bursting, the half-moon badge, the clean picture, the bubble gone.
import { hiss, sfx, tone } from "../../../shared/game-sound";

// C-major pentatonic, rising and falling, so any beat lands on a pleasant note.
const TUNE = [523, 659, 784, 659, 587, 784, 880, 784];

export const WASH_BEAT = 0.5;
export const BRUSH_BEAT = 0.6;

export const washBeat = (n: number) => tone(TUNE[n % TUNE.length], 0.16, n % 4 === 0 ? 0.06 : 0.04, "triangle");
export const brushStroke = (n: number) => hiss(0.12, 0.04, n % 2 ? 2000 : 2800, "bandpass");
export const germPop = () => { tone(520, 0.09, 0.06, "sine", 0, 1000); tone(640, 0.09, 0.05, "sine", 0.1, 1200); };
export const germBye = () => tone(600, 0.3, 0.05, "sine", 0, 1300);
export const softMiss = () => tone(330, 0.14, 0.06, "sine", 0, 262);
export const startChime = () => { tone(659, 0.1, 0.07, "triangle"); tone(988, 0.14, 0.06, "triangle", 0.08); };
/** The halfway cheer: three rising notes. */
export const halfway = () => { [784, 988, 1319].forEach((hz, at) => tone(hz, 0.18, 0.07, "triangle", at * 0.1)); };
/** The signature, "পরিষ্কার": a bright run up, then a shimmer. */
export const clean = () => {
  [523, 659, 784, 1047].forEach((hz, at) => tone(hz, 0.2, 0.08, "triangle", at * 0.09));
  tone(2093, 0.4, 0.035, "sine", 0.4);
  tone(2637, 0.35, 0.025, "sine", 0.48);
};
/** A bubble tapped: a tiny pop, a little different each time. */
export const bubble = (n: number) => tone(760 + (n % 4) * 90, 0.06, 0.07, "sine", 0, 1500);
export const right = () => sfx.good();
export const next = () => sfx.tap();
