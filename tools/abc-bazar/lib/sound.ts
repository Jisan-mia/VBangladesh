// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music). Each has a picture twin on screen:
// the stall bell with the picture popping, the grey wobble of a wrong tile, the next sign, the stars, the finished basket.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import type { WorldId } from "./levels";

// Each world's own key, so the same bell sounds a little different in the morning market, the noon haat, the evening shop and the night fair.
const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 659, 3: 698 };

export const sound = {
  /** A finger on a tile or a button. */
  tap: () => sfx.tap(),
  /** The signature, "বাজারের ঘণ্টি": a wooden টুক as the goods land on the stall, then a two-note shop bell pitched by world. */
  bell: (world: WorldId) => {
    const root = ROOT[world];
    tone(200, 0.05, 0.13, "sine", 0, 120);
    tone(root * 3, 0.34, 0.07, "sine", 0.05);
    tone(root * 4.5, 0.5, 0.05, "sine", 0.1);
    buzz(10);
  },
  /** A wrong tile: a soft low boing as it wobbles, never a buzzer. */
  miss: () => { tone(300, 0.16, 0.07, "sine", 0, 230); tone(420, 0.06, 0.05, "triangle", 0.2); },
  /** The next sign swings in: a paper-bag rustle. */
  next: () => hiss(0.16, 0.05, 1900, "bandpass"),
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: WorldId) => {
    const root = ROOT[world];
    [1, 1.25, 1.5, 2].forEach((step, at) => tone(root * step, 0.2, 0.08, "triangle", 0.1 + at * 0.14));
  },
};
