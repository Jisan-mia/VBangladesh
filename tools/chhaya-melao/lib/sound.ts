// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music). Each has a picture twin on screen:
// the toy lifting off the shelf, the knock and ring where it lands, the shadow shaking its head, the lamp flicking on.
import { buzz, hiss, tone } from "../../../shared/game-sound";
import type { WorldId } from "./levels";

// Each world's own key, so the same bell sounds a little different in the room, the courtyard, the brick wall and the night.
const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 659, 3: 698 };

export const sound = {
  /** A toy leaves the shelf: a small wooden tick. */
  lift: () => tone(760, 0.03, 0.05, "triangle", 0, 900),
  /** The signature, "ঠক-ঢং": a wooden knock as the toy lands on its shadow, then a two-note bell pitched by world. */
  land: (world: WorldId) => {
    const root = ROOT[world];
    tone(210, 0.06, 0.14, "sine", 0, 110);
    tone(root * 2, 0.32, 0.07, "sine", 0.05);
    tone(root * 3, 0.46, 0.05, "sine", 0.11);
    buzz(10);
  },
  /** A wrong shadow: a soft low boing as the toy goes home, never a buzzer. */
  miss: () => { tone(300, 0.16, 0.07, "sine", 0, 230); tone(420, 0.06, 0.05, "triangle", 0.2); },
  /** A new wall: the lamp flicks. */
  lamp: () => { tone(2200, 0.015, 0.05, "square"); tone(140, 0.08, 0.06, "sine", 0.02); },
  /** A tap on a button. */
  tap: () => tone(620, 0.04, 0.05, "triangle"),
  /** The next wall slides in: a quiet rustle. */
  page: () => hiss(0.14, 0.04, 1900, "bandpass"),
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: WorldId) => {
    const root = ROOT[world];
    [1, 1.25, 1.5, 2].forEach((step, at) => tone(root * step, 0.2, 0.08, "triangle", 0.1 + at * 0.14));
  },
};

