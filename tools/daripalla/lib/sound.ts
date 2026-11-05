// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music, no voice). Each has a picture twin on screen:
// the flying piece, the pan dipping, the beam rocking, the gold gauge and the dots. Longer runs use tone(…, delay), so the player's
// pause cuts them. The signature is the brass টুং when a pan comes level.
import { buzz, sfx, tone } from "../../../shared/game-sound";
import type { WorldId } from "./levels";
import { FLY_MS } from "./sim";

const FLY = FLY_MS / 1000;
// Each world's key.
const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 440 };

export const sound = {
  tap: () => sfx.tap(),
  /** A piece leaves the tray: a light pluck, right on the press. */
  take: () => tone(880, 0.05, 0.05, "triangle"),
  /** The piece lands on the pan: a short wooden thud, heavier for a bigger weight. */
  land: (value: number, lag = FLY) => { tone(180 - Math.min(60, value * 4), 0.12, 0.13, "sine", lag, 110); tone(900, 0.03, 0.03, "square", lag); },
  /** The pan is too heavy: the same thud and a lower second one. Never a buzzer. */
  heavy: (lag = FLY) => { sound.land(5, lag); tone(130, 0.18, 0.08, "sine", lag + 0.06, 90); },
  /** A piece lifted off. */
  lift: () => sfx.pick(),
  /** The signature, "টুং": a brass clink and its two quieter echoes, as the pan comes level. */
  level: (lag = FLY) => { tone(2093, 0.45, 0.06, "triangle", lag); tone(3322, 0.3, 0.03, "sine", lag); tone(2093, 0.35, 0.03, "triangle", lag + 0.32); buzz(12); },
  /** A right number: a soft good chime and the clink. */
  right: () => { sfx.good(); tone(2093, 0.4, 0.05, "triangle", 0.06); tone(3322, 0.3, 0.025, "sine", 0.06); },
  /** A wrong number, or a full pan: a soft low boing. */
  again: () => tone(330, 0.14, 0.06, "sine"),
  /** The next pan's weights drop onto the left pan. */
  drop: () => tone(210, 0.1, 0.09, "sine", 0.12, 140),
  /** The next-pan button arrives. */
  ready: () => tone(1175, 0.08, 0.04, "triangle"),
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.5) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: WorldId) => { const root = ROOT[world]; [1, 1.25, 1.5, 2].forEach((step, at) => tone(root * step, 0.2, 0.08, "triangle", 1.2 + at * 0.14)); },
};
