// The game's sounds, all from shared/game-sound.ts (soft, no loops, no music). Each has a picture twin on screen: the key sinking and its box
// filling, the box lighting in the look, the wobble, the piece settling, the handset ringing, the stars. The signature is the number as a tune:
// every digit has its own note, in the look and under your finger, so a number is also something you can hum.
import { buzz, sfx, tone } from "../../../shared/game-sound";
import type { WorldId } from "./levels";

const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 659 };

export const sound = {
  /** A key under the finger: a small plastic tick, then the digit's note. */
  key: (digit: number) => { tone(240, 0.03, 0.07, "square"); sfx.note(digit); },
  /** A digit in the look: just its note. */
  lit: (digit: number) => sfx.note(digit),
  /** A wrong key: a soft low boing, never a buzzer. */
  miss: () => { tone(330, 0.14, 0.06, "sine", 0, 250); buzz(14); },
  /** The eye key: two quick notes, an eye opening. */
  eye: () => { tone(880, 0.05, 0.06, "sine"); tone(1175, 0.07, 0.06, "sine", 0.06); },
  /** A key that can't be used now (the look is playing, no looks left). */
  no: () => tone(170, 0.05, 0.05, "sine"),
  /** A piece is dialled. */
  piece: () => sfx.good(),
  /** The whole number is dialled: the phone rings, four pips in two pairs. */
  ring: () => [0, 0.16, 0.62, 0.78].forEach(delay => tone(1320, 0.11, 0.05, "sine", delay)),
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's finale: four notes up its scale. */
  tune: (world: WorldId) => { [1, 1.25, 1.5, 2].forEach((step, at) => tone(ROOT[world] * step, 0.2, 0.08, "triangle", 0.1 + at * 0.14)); },
  tap: () => sfx.tap(),
  pop: () => sfx.pop(),
};
