// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music, no voice). Each has a picture twin on
// screen: the number over the boat, the wobble, the dots, the flag. Longer runs use tone(…, delay) so the player's pause cuts them.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import type { WorldId } from "./levels";

// Each world's own key.
const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 440 };
const SCALE = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760];

export const sound = {
  tap: () => sfx.tap(),
  /** The চরকি turning: a run of ticks that slow down. */
  spin: (slow: boolean) => { sfx.pick(); if (!slow) for (let index = 0; index < 6; index++) tone(1500, 0.02, 0.03, "square", 0.05 + index * index * 0.011); },
  /** The চরকি stops: a wooden টুক. */
  land: () => tone(330, 0.09, 0.12, "sine", 0, 220),
  /** The signature, "ঘাট": a splash and one pentatonic note per ghat that rises going up the river and falls going back. */
  ghat: (ghat: number, dir: 1 | -1) => {
    const at = (ghat - 1) % 10;
    tone(SCALE[dir > 0 ? at : 9 - at], 0.24, 0.12, "triangle");
    hiss(0.16, 0.05, 700);
  },
  /** আব্বু's boat: a quieter, softer note. */
  rival: (ghat: number, dir: 1 | -1) => { const at = (ghat - 1) % 10; tone(SCALE[dir > 0 ? at : 9 - at] * 0.75, 0.16, 0.05, "sine"); },
  /** A wrong ghat: a soft low boing. Never a buzzer. */
  miss: () => tone(300, 0.14, 0.07, "sine", 0, 230),
  /** The boat reaches the flag: a drum thump and a rising triad. */
  arrive: (world: WorldId) => {
    const root = ROOT[world];
    tone(110, 0.2, 0.2, "sine", 0, 60);
    [1, 1.25, 1.5].forEach((step, at) => tone(root * step, 0.26, 0.09, "triangle", 0.12 + at * 0.1));
    buzz(12);
  },
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.5) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: WorldId) => { const root = ROOT[world]; [1, 1.25, 1.5, 2].forEach((step, at) => tone(root * step, 0.2, 0.08, "triangle", 1.2 + at * 0.14)); },
};
