// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music). Each has a picture twin on screen:
// the plane's whoosh and its landing thud, the page turning, the stamp, the stars, the confetti.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import type { WorldId } from "./levels";

// Each world's own key, so a stamp sounds a little different in the paddy fields, the desert and over the sea.
const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 659 };

export const sound = {
  /** A finger on a pin, a button or a picture. */
  tap: () => sfx.tap(),
  /** The plane taking off: a rising airy whoosh. */
  fly: () => { hiss(0.9, 0.07, 1800, "bandpass"); tone(220, 0.8, 0.04, "sine", 0, 440); },
  /** The wheels touching down. */
  land: () => { tone(160, 0.12, 0.12, "sine", 0, 70); buzz(10); },
  /** A postcard turning. */
  page: () => hiss(0.14, 0.05, 2200, "bandpass"),
  /** The signature, the stamp: a wooden টুক, then two rising marimba notes pitched by world. */
  stamp: (world: WorldId) => {
    const root = ROOT[world];
    tone(170, 0.07, 0.16, "sine", 0, 90);
    tone(root, 0.12, 0.09, "triangle", 0.05);
    tone(root * 1.5, 0.24, 0.08, "triangle", 0.12);
    buzz(12);
  },
  /** A wrong picture: a soft low boing as it wobbles. Never a buzzer. */
  think: () => { tone(300, 0.16, 0.07, "sine", 0, 230); tone(420, 0.06, 0.05, "triangle", 0.4); },
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its passport check is done. */
  tune: (world: WorldId) => { const root = ROOT[world]; [1, 1.25, 1.5, 2].forEach((step, at) => tone(root * step, 0.2, 0.08, "triangle", 0.1 + at * 0.14)); },
};
