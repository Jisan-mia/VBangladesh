// The three instruments, built from the site's shared tone and hiss (no audio files). Silent when the site-wide sound switch is off.
import { hiss, tone } from "../../../shared/game-sound";
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
