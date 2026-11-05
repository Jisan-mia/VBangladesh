// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music). Each has a picture twin on screen:
// the rocket landing and the planet lighting up, the wobble and its hint, the next question, the stars, the finished screen.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import type { WorldId } from "./course";

// Each planet one step up a pentatonic scale, so a trip out from the Sun climbs.
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];
const note = (planet: number) => 392 * 2 ** (SCALE[Math.min(7, planet)] / 12);
const ROOT: Record<WorldId, number> = { 0: 523, 1: 587, 2: 659 };

export const sound = {
  /** A finger on an answer. */
  tap: () => sfx.tap(),
  /** The rocket leaves: an airy rising swoosh. The signature, with the arrival note. */
  launch: () => { hiss(0.5, 0.05, 900, "bandpass"); tone(180, 0.46, 0.04, "triangle", 0, 520); },
  /** The rocket lands beside the planet: its note, a soft pop. */
  arrive: (planet: number, delay = 0.38) => { tone(note(planet), 0.28, 0.1, "triangle", delay); tone(note(planet) * 2, 0.18, 0.04, "sine", delay + 0.04); buzz(10); },
  /** A right pick where nothing flies (a porthole, a football): the note right away. */
  right: (planet: number) => { tone(note(planet), 0.26, 0.1, "triangle"); tone(note(planet) * 1.5, 0.2, 0.05, "sine", 0.08); buzz(10); },
  /** A slip: a soft low boing, never a buzzer. */
  slip: () => tone(330, 0.16, 0.06, "sine", 0, 250),
  /** The next question. */
  next: () => hiss(0.16, 0.05, 1900, "bandpass"),
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: WorldId) => { const root = ROOT[world]; [1, 1.25, 1.5, 2].forEach((step, at) => tone(root * step, 0.2, 0.08, "triangle", 0.1 + at * 0.14)); },
};
