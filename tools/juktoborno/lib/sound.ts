// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music). Each has a picture twin on screen:
// the letter in its slot, the gear and the lit যুক্তবর্ণ, the marks on the slots, the next picture, the stars.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import type { WorldId } from "./levels";

// Each world's own key, so the same "জোড়া লাগল" sounds a little different in the workshop, on the road, in the lab and at the fair.
const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 659, 3: 698 };

export const sound = {
  /** A finger on a tile. */
  tap: () => sfx.tap(),
  /** A letter lands in its slot: a soft wooden drop. */
  drop: () => tone(330, 0.08, 0.1, "sine", 0, 210),
  /** A letter taken back out. */
  back: () => tone(520, 0.06, 0.07, "triangle", 0, 380),
  /** The signature, "জোড়া লাগল": two quick clicks as the letters lock, then a chime pitched by world. */
  join: (world: WorldId) => {
    const root = ROOT[world];
    tone(170, 0.05, 0.1, "square", 0);
    tone(230, 0.05, 0.08, "square", 0.1);
    tone(root, 0.14, 0.09, "triangle", 0.2);
    tone(root * 1.5, 0.26, 0.08, "triangle", 0.3);
    buzz(10);
  },
  /** A try that didn't fit: a soft low boing, never a buzzer. */
  miss: () => { tone(300, 0.16, 0.07, "sine", 0, 230); tone(420, 0.06, 0.05, "triangle", 0.2); },
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
