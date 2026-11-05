// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music, no voice). Each has a picture twin on screen:
// the brush dust, the bone lifting, the rock's wiggle, the bone snapping in, the dinosaur standing, the stars.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import type { WorldId } from "./worlds";

// Each world's own key for the finale tune: sand, jungle, hill.
const ROOT: Record<WorldId, number> = { 0: 392, 1: 440, 2: 523 };

export const sound = {
  tap: () => sfx.tap(),
  /** The brush, a soft hiss that rises a little with each new pass. `speed` 0..1. */
  brush: (pass = 1, speed = 0.5) => hiss(0.1, 0.05, 1500 + pass * 500 + speed * 700, "bandpass"),
  /** A bone shows: a bright pick and a small bell. */
  found: () => { sfx.pick(); tone(1319, 0.14, 0.06, "sine", 0.06); buzz(10); },
  /** The brush meets a rock: a dull knock. */
  rock: () => { tone(150, 0.08, 0.1, "sine", 0, 110); buzz(8); },
  /** Not a bone: a soft plop, lower than a find. */
  plop: () => tone(420, 0.1, 0.07, "sine", 0, 300),
  /** A tray bone is picked up. */
  pickUp: () => sfx.pick(),
  /** A bone snaps into its place. */
  snap: (step = 0) => { sfx.drop(); tone(660 + step * 70, 0.08, 0.06, "triangle", 0.05); },
  /** A wrong place or a wrong food: a soft low boing, never a buzzer. */
  miss: () => tone(300, 0.16, 0.07, "sine", 0, 230),
  /** The signature: the dinosaur stands, a friendly low "গুম গুম" with a rising second note. */
  stands: (delay = 0) => { tone(110, 0.3, 0.12, "triangle", delay, 165); tone(165, 0.3, 0.1, "triangle", delay + 0.24, 247); buzz([14, 40, 14]); },
  /** The right food. */
  good: () => sfx.good(),
  /** On to the next dinosaur. */
  page: () => hiss(0.16, 0.05, 1900, "bandpass"),
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: WorldId) => { [1, 1.25, 1.5, 2].forEach((step, at) => tone(ROOT[world] * step, 0.22, 0.08, "triangle", 0.1 + at * 0.15)); },
};
