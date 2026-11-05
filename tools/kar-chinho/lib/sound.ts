// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music). Each has a picture twin on screen:
// the sign in its seat, the grey wrong word, the next picture, the stars, the finished page.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import type { WorldId } from "./levels";

// Each world's own key, so the same "বসল" sounds a little different under the sun, in the field and on the river.
const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 659, 3: 698 };

export const sound = {
  /** A finger on a tile. */
  tap: () => sfx.tap(),
  /** The signature, "বসল": a wooden টুক as the sign lands, then two rising marimba notes. */
  seat: (world: WorldId) => {
    const root = ROOT[world];
    tone(190, 0.05, 0.14, "sine", 0, 120);
    tone(root, 0.12, 0.09, "triangle", 0.05);
    tone(root * 1.5, 0.24, 0.08, "triangle", 0.12);
    buzz(10);
  },
  /** A wrong sign: a soft low boing as it tries the seat, and a little pop as it hops home. Never a buzzer. */
  miss: () => { tone(300, 0.16, 0.07, "sine", 0, 230); tone(420, 0.06, 0.05, "triangle", 0.62); },
  /** The page turns to the next word. */
  page: () => hiss(0.16, 0.05, 1900, "bandpass"),
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: WorldId) => {
    const root = ROOT[world];
    [1, 1.25, 1.5, 2].forEach((step, at) => tone(root * step, 0.2, 0.08, "triangle", 0.1 + at * 0.14));
  },
};
