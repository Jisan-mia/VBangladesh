// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music, no voice). Each has a picture twin on screen:
// the card lighting up, the wobble and its hint, the bell swinging as the sign flips, the next picture, the stars.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import type { WorldId } from "./course";

const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 659 };
// Each pair its own step of a pentatonic scale, so a round climbs and falls as the pairs change.
const SCALE = [0, 2, 4, 7, 9, 12, 14];
const note = (pair: number) => 392 * 2 ** (SCALE[Math.min(6, Math.max(0, pair))] / 12);

export const sound = {
  /** A finger on a button that isn't an answer. */
  tap: () => sfx.tap(),
  /** A right pick: its pair's note, a soft pop on top. */
  right: (pair: number) => { tone(note(pair), 0.24, 0.1, "triangle"); tone(note(pair) * 1.5, 0.18, 0.05, "sine", 0.07); buzz(10); },
  /** A slip: a soft low boing, never a buzzer. */
  slip: () => tone(330, 0.16, 0.06, "sine", 0, 250),
  /** The bell: two soft strikes. The signature. The bell icon swings once on each. */
  bell: () => { tone(1568, 0.7, 0.07, "sine"); tone(2349, 0.5, 0.03, "sine"); tone(1568, 0.7, 0.06, "sine", 0.28); tone(2349, 0.5, 0.025, "sine", 0.28); },
  /** The next picture. */
  next: () => hiss(0.12, 0.04, 1900, "bandpass"),
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: WorldId) => { const root = ROOT[world]; [1, 1.25, 1.5, 2].forEach((step, at) => tone(root * step, 0.2, 0.08, "triangle", 0.1 + at * 0.14)); },
};
