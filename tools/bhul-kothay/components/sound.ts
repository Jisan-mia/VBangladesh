// The game's sounds, all from shared/game-sound (no audio files). Anything longer than a blip is scheduled on the audio
// clock with tone(…, delay), so the player's pause (silenceScheduled) cuts it mid-phrase. No loops.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";

/** Each world's key: the root of a major pentatonic, so any run of finds sounds like a tune. */
const ROOTS = [523, 440, 392, 494, 349, 330];
const PENTA = [0, 2, 4, 7, 9];
const note = (world: number, step: number) => (ROOTS[world] ?? 440) * 2 ** ((PENTA[step % 5] + 12 * Math.floor(step / 5)) / 12);

export const sound = {
  /** The signature: the red ballpoint ringing a difference, a quick scratch round, then a note that climbs with each find in a row. */
  ring: (world: number, streak: number) => {
    hiss(0.08, 0.08, 3400, "bandpass");
    hiss(0.07, 0.06, 4400, "bandpass", 0.06);
    tone(note(world, 2 + Math.min(streak, 7)), 0.16, 0.1, "triangle", 0.05);
    if (streak >= 2) tone(note(world, 4 + Math.min(streak, 7)), 0.2, 0.06, "sine", 0.12);
    buzz(10);
  },
  /** A tap where the two pictures are the same: a soft low thud, never harsh. */
  miss: () => { tone(160, 0.12, 0.07, "sine", 0, 110); buzz(25); },
  /** A tap on one already ringed. */
  again: () => sfx.tap(),
  /** The magnifier's glint: a hint. */
  hint: () => { tone(1320, 0.05, 0.06, "triangle"); tone(1760, 0.12, 0.05, "triangle", 0.05); },
  /** The হারিকেন carried to a new spot in the dark. */
  lamp: () => hiss(0.1, 0.05, 900, "lowpass"),
  /** The page turning on খোঁজা শুরু, then the world's three-note call. */
  start: (world: number) => {
    hiss(0.12, 0.1, 2600, "bandpass"); hiss(0.18, 0.07, 1400, "bandpass", 0.09);
    [0, 2, 4].forEach((step, k) => tone(note(world, step), 0.14, 0.07, "triangle", 0.2 + k * 0.11));
  },
  /** All found: a rising run in the world's key (bigger for three stars, a record or a finale's first clear). */
  done: (world: number, big: boolean) => {
    const steps = big ? [5, 7, 9, 10, 12] : [5, 7, 10];
    steps.forEach((step, k) => tone(note(world, step), big ? 0.18 : 0.14, 0.09, "triangle", 0.1 + k * 0.08));
    if (big) tone(note(world, 15), 0.42, 0.05, "sine", 0.1 + steps.length * 0.08);
    buzz([20, 40, 20]);
  },
  /** কারেন্ট এসেছে: the lights coming back after the last find in the dark. */
  lightsOn: () => { tone(60, 0.5, 0.05, "sawtooth", 0, 120); tone(2400, 0.04, 0.04, "square", 0.02); },
};
