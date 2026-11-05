// The ঢোল and its friends, synthesized from the shared kit (no audio files). Every note is a scheduled tone() or hiss(),
// so the player's pause cuts what is still ringing. Nothing here loops and nothing speaks. Each sound has a picture:
// the sticks swing, the drum skin pulses, the dot fills, the thread links two rhyme ends.
import { buzz, hiss, tone } from "../../../shared/game-sound";

/** Each world's key: the courtyard, the night sky, the fair. */
const ROOTS = [330, 294, 392];
/** A pentatonic ladder, in semitones. */
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
export const note = (root: number, step: number) => root * 2 ** (PENTA[Math.max(0, Math.min(step, PENTA.length - 1))] / 12);

/** A word's note: the line climbs a step a word, and its last word lands home (or one step above, on the first line of a pair). */
export const stepOf = (line: number, word: number, count: number) => word === count - 1 ? (line % 2 === 0 ? 2 : 0) : Math.min(word, 4);
export const rootOf = (world: number) => ROOTS[world - 1] ?? ROOTS[0];

export const drum = {
  /** The ঢুলি's stick, left (low) or right (high). Seen as the stick swinging down. */
  stick: (right: boolean, big = false) => {
    if (right) { tone(300, 0.1, big ? 0.13 : 0.09, "triangle", 0, 210); hiss(0.03, 0.05, 2600, "highpass"); }
    else { tone(big ? 118 : 132, 0.24, big ? 0.2 : 0.15, "sine", 0, 56); hiss(0.05, 0.04, 480); }
  },
  /** A quiet wood tick for a beat nobody drums (the ঢুলি has stepped back). Seen as the ball landing. */
  tick: () => tone(880, 0.04, 0.035, "triangle"),
  /** The count-in: two woodblock clicks, the second higher. Seen as the numbers ২ and ১. */
  count: (second: boolean) => { tone(second ? 740 : 620, 0.07, 0.1, "triangle"); hiss(0.025, 0.05, 2400, "highpass"); },
  /** Your tap on a beat: the bright ধা of the drum, and the word's note on a bell. Seen as the dot filling and the ring. */
  clap: (world: number, step: number, big: boolean) => {
    tone(190, 0.2, big ? 0.24 : 0.18, "sine", 0, 90);
    tone(note(rootOf(world), step), big ? 0.5 : 0.32, big ? 0.1 : 0.08, "triangle", 0.01);
    if (big) tone(note(rootOf(world), step) * 2, 0.45, 0.05, "sine", 0.02);
    buzz(8);
  },
  /** A tap between beats: a softer thump, never a buzzer. Seen as a small ring. */
  soft: () => tone(165, 0.1, 0.07, "sine", 0, 118),
  /** The signature "মিল": two bells on the same note, when a second line ends like the first. Seen as the thread tying the beads. */
  mil: (world: number, delay = 0) => {
    const f = note(rootOf(world), 4);
    tone(f, 0.5, 0.08, "sine", delay); tone(f * 2.01, 0.28, 0.035, "sine", delay);
    tone(f, 0.5, 0.08, "sine", delay + 0.16); tone(f * 2.01, 0.28, 0.035, "sine", delay + 0.16);
  },
  /** A line's end: a soft low pat as the bead fills. */
  bead: () => tone(240, 0.1, 0.06, "triangle", 0, 190),
  /** The title drum: a full low ঢোল roll and a high ring. */
  start: (world: number) => {
    tone(98, 0.5, 0.2, "sine", 0, 52); hiss(0.07, 0.08, 520);
    tone(note(rootOf(world), 5), 0.5, 0.06, "triangle", 0.06); buzz(12);
  },
  /** The end: a small drum roll and four notes up in the world's key (a fifth for a finale). */
  end: (world: number, big: boolean, delay = 0) => {
    const steps = big ? [0, 2, 3, 5, 6] : [0, 2, 3, 5];
    [0, 0.06, 0.12].forEach(at => tone(150, 0.1, 0.1, "sine", delay + at, 80));
    steps.forEach((step, k) => tone(note(rootOf(world), step), big && k === steps.length - 1 ? 0.5 : 0.2, 0.09, "triangle", delay + 0.2 + k * 0.1));
  },
};
