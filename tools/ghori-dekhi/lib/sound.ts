// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music). Each has a picture twin on screen:
// the hand clicking in, the ringing number, the pie filling, the card wobbling, the next scene, the stars.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import type { WorldId } from "./levels";

// Each world's own key, so the bell sounds a little different at dawn, noon, in the afternoon and at dusk.
const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 659, 3: 698 };

export const sound = {
  /** A finger on a hand or a card. */
  tap: () => sfx.tap(),
  /** A hand passes a click spot while it turns. */
  click: () => sfx.tick(),
  /** Released: the hand eases into its click with a soft knock. */
  seat: () => tone(220, 0.05, 0.08, "sine", 0, 140),
  /** The signature, "ঢং": a bell, then its fifth, pitched by world. You see the pie fill and the words come. */
  bell: (world: WorldId) => {
    const root = ROOT[world];
    tone(root, 0.32, 0.1, "sine");
    tone(root * 2, 0.22, 0.04, "sine");
    tone(root * 1.5, 0.3, 0.08, "triangle", 0.14);
    buzz(10);
  },
  /** A wrong answer: a soft low boing, never a buzzer. You see the hand wobble or the card show its own clock. */
  miss: () => tone(300, 0.16, 0.07, "sine", 0, 230),
  /** On to the next scene. */
  page: () => hiss(0.16, 0.05, 1900, "bandpass"),
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: WorldId) => {
    const root = ROOT[world];
    [1, 1.25, 1.5, 2].forEach((step, at) => tone(root * step, 0.2, 0.08, "triangle", 0.1 + at * 0.14));
  },
};
