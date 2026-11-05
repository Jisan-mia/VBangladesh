// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music, no voice). Each has a picture twin on
// screen: the ink growing, the next dot, the picture, the stars, the finished page.
import { buzz, tone } from "../../../shared/game-sound";
import type { WorldId } from "./levels";

// Each world's own key, so the same sounds change a little from স্বর to সংখ্যা.
const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 659, 3: 698 };

export const sound = {
  /** A finger on the board. */
  touch: () => tone(520, 0.04, 0.03, "sine"),
  /** The ink growing: a tick that climbs a little as the stroke fills. */
  ink: (reach: number) => tone(420 + (reach % 40) * 6, 0.05, 0.03, "sine"),
  /** A stroke is written: a wooden টুক and one bright note, pitched by world. */
  stroke: (world: WorldId) => { tone(210, 0.05, 0.12, "sine", 0, 130); tone(ROOT[world] * 1.5, 0.14, 0.07, "triangle", 0.04); buzz(8); },
  /** The signature: the letter turns into its picture, two rising bell notes. */
  picture: (world: WorldId) => { tone(ROOT[world] * 2, 0.4, 0.06, "sine", 0.05); tone(ROOT[world] * 3, 0.5, 0.035, "sine", 0.17); buzz(14); },
  /** A tap on a button. */
  tap: () => tone(600, 0.05, 0.04, "triangle"),
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: WorldId) => { [1, 1.25, 1.5, 2].forEach((step, at) => tone(ROOT[world] * step, 0.2, 0.08, "triangle", 0.1 + at * 0.14)); },
};
