// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music). Each has a picture twin on screen:
// the safe picture landing in the bubble, the wobble and the ring, the next scene, the stars, the confetti.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import type { WorldId } from "./levels";

// Each world's own key, so the same "ঠিক" sounds a little different on the road, in the kitchen and by the pond.
const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 659 };

export const sound = {
  /** A finger on a picture. */
  tap: () => sfx.tap(),
  /** The signature, "ঠিক": a wooden টুক as the picture lands in the bubble, then two rising marimba notes. */
  safe: (world: WorldId) => {
    const root = ROOT[world];
    tone(190, 0.05, 0.14, "sine", 0, 120);
    tone(root, 0.12, 0.09, "triangle", 0.05);
    tone(root * 1.5, 0.24, 0.08, "triangle", 0.12);
    buzz(10);
  },
  /** A wrong picture: a soft low boing as it wobbles, and a little pop. Never a buzzer. */
  think: () => { tone(300, 0.16, 0.07, "sine", 0, 230); tone(420, 0.06, 0.05, "triangle", 0.4); },
  /** The next scene. */
  page: () => hiss(0.16, 0.05, 1900, "bandpass"),
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: WorldId) => {
    const root = ROOT[world];
    [1, 1.25, 1.5, 2].forEach((step, at) => tone(root * step, 0.2, 0.08, "triangle", 0.1 + at * 0.14));
  },
};
