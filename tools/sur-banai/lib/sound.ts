// The three instruments, built from the site's shared tone and hiss (no audio files). Silent when the site-wide sound switch is off.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import { FREQ } from "./music";

/** One note of row `row` on instrument `sound` (0 বাঁশি, 1 ঢোল, 2 টুং). `quiet` softens chords so five notes together don't get loud. */
export function playNote(row: number, sound: number, quiet = 1) {
  const f = FREQ[row];
  if (sound === 1) {
    // A thump: a low sine that drops in pitch, with a puff of low noise for the skin.
    tone(f / 4, 0.28, 0.32 * quiet, "sine", 0, f / 8);
    hiss(0.05, 0.06 * quiet, 500);
  } else if (sound === 2) {
    // A small bell: a bright note with a faint out-of-tune overtone that rings out.
    tone(f * 2, 0.7, 0.07 * quiet, "triangle");
    tone(f * 5.4, 0.25, 0.015 * quiet, "sine");
  } else {
    // A soft flute: a pure sine and a breath of air.
    tone(f, 0.42, 0.12 * quiet, "sine");
    hiss(0.08, 0.012 * quiet, 2600, "bandpass");
  }
}

export const playBeat = (rows: number[], sound: number) => rows.forEach(row => playNote(row, sound, rows.length > 2 ? 0.6 : 1));

/** Each world's own key for the finale tune. */
const ROOT = [523, 587, 659, 698];

/** The game's other sounds: a cell is its own note (playNote); these are the rest, each with a picture twin on screen. */
export const sound = {
  /** A cell cleared: a soft tick. */
  off: () => tone(520, 0.05, 0.05, "triangle"),
  /** A locked cell: the shared tick, nothing else. */
  locked: () => sfx.tick(),
  /** The first finger on a button. */
  tap: () => sfx.tap(),
  /** A copy that didn't match: a soft low boing as the extra cells wobble. Never a buzzer. */
  miss: () => { tone(300, 0.16, 0.07, "sine", 0, 230); tone(420, 0.06, 0.05, "triangle", 0.4); },
  /** The signature, "মিলেছে": a small chime the moment ✓ is right, and a high one `after` seconds on, when the child's own tune has played through. */
  match: (after: number) => {
    tone(988, 0.09, 0.09, "triangle"); tone(1319, 0.14, 0.08, "triangle", 0.07); buzz(10);
    tone(1568, 0.3, 0.07, "triangle", after); tone(2093, 0.4, 0.05, "sine", after + 0.1);
  },
  /** The stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
  stars: (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: number) => { [1, 1.25, 1.5, 2].forEach((step, at) => tone(ROOT[world] * step, 0.2, 0.08, "triangle", 0.1 + at * 0.14)); },
  /** The title's খেলো, a new round. */
  page: () => hiss(0.16, 0.05, 1900, "bandpass"),
  /** ♥ রাখো: the tune is kept. */
  keep: () => sfx.good(),
};
