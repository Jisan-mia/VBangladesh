// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music). Each has a picture twin on screen:
// the piece lifting, the plate's thud and the number of pieces on it, the faces turning to smiles, the grey wobble of a
// wrong cut, the next guests sitting down, the stars at the end. Scheduled tones only, so the player's pause cuts them.
import { buzz, hiss, tone } from "../../../shared/game-sound";
import type { WorldId } from "./levels";

// Each world's own key, so the same plate-clink sounds a little different on the yellow, blue, red and pink cloth.
const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 659, 3: 698 };

export const sound = {
  /** A finger on a button. */
  tap: () => tone(520, 0.05, 0.05, "triangle"),
  /** A piece lifts off the basket or a plate. */
  pick: () => tone(440, 0.07, 0.06, "sine", 0, 620),
  /** The piece lands on a plate: a soft wooden thud, pitched higher for every piece already there, so the child hears the count. `delay` is how long the piece flies. */
  drop: (count: number, delay = 0.18) => { tone(170, 0.07, 0.11, "sine", delay, 110); tone(300 + Math.min(count, 6) * 45, 0.09, 0.07, "triangle", delay + 0.02); },
  /** A piece put back: the same, a little lower. */
  back: () => tone(260, 0.08, 0.06, "sine", 0, 180),
  /** A plate with too many: a soft low boing, never a buzzer. */
  over: () => { tone(300, 0.16, 0.07, "sine", 0, 230); tone(420, 0.06, 0.05, "triangle", 0.2); },
  /** A wrong knife or answer: the same soft boing. */
  miss: () => { tone(300, 0.16, 0.07, "sine", 0, 230); tone(420, 0.06, 0.05, "triangle", 0.2); },
  /** The knife goes through the রুটি: a whoosh and a knock. */
  cut: () => { hiss(0.14, 0.07, 1500, "bandpass"); tone(150, 0.06, 0.1, "sine", 0.1, 100); },
  /** The signature, "থালার ঠুং": everyone is served and every face smiles. Two plate clinks and a rising bell, pitched by world. */
  fair: (world: WorldId) => {
    const root = ROOT[world];
    tone(root * 3, 0.3, 0.07, "sine", 0.02);
    tone(root * 4.5, 0.45, 0.05, "sine", 0.08);
    tone(root * 6, 0.3, 0.04, "sine", 0.2);
    buzz(10);
  },
  /** The next guests sit down: a cloth rustle. */
  next: () => hiss(0.16, 0.05, 1900, "bandpass"),
  /** The stars at the end, one chime each. */
  stars: (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: WorldId) => {
    const root = ROOT[world];
    [1, 1.25, 1.5, 2].forEach((step, at) => tone(root * step, 0.2, 0.08, "triangle", 0.1 + at * 0.14));
  },
};
